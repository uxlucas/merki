/*
 * Presentation pages. Runs inside Figma, inlined after core.ts (uses its helpers).
 * Each build* function switches page once, clears what it owns, and rebuilds it from the data.
 */
declare const figma: any;
declare function pageByName(name: string): any;
declare const hex: (value: string) => { r: number; g: number; b: number };
declare function autoLayout(direction: 'HORIZONTAL' | 'VERTICAL', props?: Record<string, unknown>): any;
declare function loadFonts(): Promise<any>;
declare function text(chars: string, font: any, size: number, color: string): any;

const solid = (value: string, opacity?: number) => ({ type: 'SOLID', color: hex(value), ...(opacity === undefined ? {} : { opacity }) });

/** Component sets by name, read from the Components page without switching to it. */
export async function setsFromComponentsPage(): Promise<Map<string, any>> {
  const page = pageByName('Components');
  await page.loadAsync();
  return new Map(page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).map((s: any) => [s.name, s]));
}

export function variantOf(set: any, size: number): any {
  const variant = set.children.find((c: any) => c.name === `Size=${size}`);
  if (!variant) throw new Error(`${set.name} has no Size=${size} variant`);
  return variant;
}

export function requireSets(sets: Map<string, any>, names: string[]): void {
  const missing = names.filter((n) => !sets.has(n));
  if (missing.length) throw new Error(`Missing component sets: ${missing.join(', ')}. Run the 10-components scripts first.`);
}

function clearPage(page: any, keep: (node: any) => boolean = () => false): void {
  for (const child of [...page.children]) if (!keep(child)) child.remove();
}

/** Icons page: a white card per category, 16px instances with their names in mono (like the site). */
export async function buildIconsPage(categories: { label: string; setNames: string[] }[]) {
  const sets = await setsFromComponentsPage();
  requireSets(sets, categories.flatMap((c) => c.setNames));
  const page = pageByName('Icons');
  await figma.setCurrentPageAsync(page);
  clearPage(page);
  const fonts = await loadFonts();
  const column = autoLayout('VERTICAL', { name: 'Icons', itemSpacing: 32, paddingTop: 64, paddingBottom: 64, paddingLeft: 64, paddingRight: 64 });
  column.fills = [solid('#fafafa')];
  page.appendChild(column);
  let instances = 0;
  for (const category of categories) {
    const card = autoLayout('VERTICAL', { name: category.label, itemSpacing: 16, paddingTop: 24, paddingBottom: 24, paddingLeft: 24, paddingRight: 24, cornerRadius: 16 });
    card.fills = [solid('#ffffff')];
    card.strokes = [solid('#ececef')];
    card.strokeWeight = 1;
    const head = autoLayout('HORIZONTAL', { name: 'Header', itemSpacing: 8 });
    head.appendChild(text(category.label, fonts.head, 18, '#18181b'));
    head.appendChild(text(String(category.setNames.length), fonts.text, 14, '#a1a1aa'));
    card.appendChild(head);
    const grid = autoLayout('HORIZONTAL', { name: 'Grid', itemSpacing: 8, layoutWrap: 'WRAP', counterAxisSpacing: 8 });
    grid.primaryAxisSizingMode = 'FIXED';
    grid.resize(7 * 112 + 6 * 8, 112);
    // resize() fixes both axes; wrapped rows need the cross axis to grow.
    grid.counterAxisSizingMode = 'AUTO';
    card.appendChild(grid);
    for (const setName of category.setNames) {
      const name = setName.split('/')[1];
      const tile = autoLayout('VERTICAL', { name, itemSpacing: 12, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER', cornerRadius: 14 });
      tile.primaryAxisSizingMode = 'FIXED';
      tile.counterAxisSizingMode = 'FIXED';
      tile.resize(112, 112);
      tile.fills = [solid('#ffffff')];
      tile.strokes = [solid('#ececef')];
      tile.strokeWeight = 1;
      tile.appendChild(variantOf(sets.get(setName), 16).createInstance());
      const label = text(name, fonts.mono, 11, '#71717a');
      label.textAutoResize = 'HEIGHT';
      label.resize(96, label.height);
      label.textAlignHorizontal = 'CENTER';
      label.textTruncation = 'ENDING';
      label.maxLines = 1;
      tile.appendChild(label);
      grid.appendChild(tile);
      instances += 1;
    }
    column.appendChild(card);
  }
  column.x = 0;
  column.y = 0;
  return { page: page.id, column: column.id, cards: categories.length, instances };
}

/** Cover, 1920×960 (also the Community thumbnail): the site's hero. */
export async function buildCover(data: { count: number; markSvg: string; wall: string[]; highlight: string[] }) {
  const sets = await setsFromComponentsPage();
  requireSets(sets, data.wall);
  const page = pageByName('Cover');
  await figma.setCurrentPageAsync(page);
  clearPage(page);
  const fonts = await loadFonts();
  const cover = figma.createFrame();
  cover.name = 'Cover';
  cover.resize(1920, 960);
  cover.fills = [solid('#fafafa')];
  cover.clipsContent = true;
  page.appendChild(cover);

  const wall = figma.createFrame();
  wall.name = 'Wall';
  wall.fills = [];
  wall.clipsContent = false;
  cover.appendChild(wall);
  const cols = 16;
  data.wall.forEach((setName, index) => {
    const instance = variantOf(sets.get(setName), 24).createInstance();
    instance.rescale(2);
    instance.x = (index % cols) * 96 + 24;
    instance.y = Math.floor(index / cols) * 96 + 24;
    if (data.highlight.includes(setName)) {
      for (const n of instance.findAll(() => true)) {
        if (Array.isArray(n.strokes) && n.strokes.length) n.strokes = [solid('#3b82f6')];
        if (Array.isArray(n.fills) && n.fills.length) n.fills = [solid('#3b82f6')];
      }
    }
    wall.appendChild(instance);
  });
  wall.resizeWithoutConstraints(cols * 96, Math.ceil(data.wall.length / cols) * 96);
  wall.x = (1920 - wall.width) / 2;
  wall.y = 600;

  const fade = figma.createRectangle();
  fade.name = 'Fade';
  fade.resize(1920, 360);
  fade.y = 600;
  fade.fills = [
    {
      type: 'GRADIENT_LINEAR',
      gradientTransform: [[0, 1, 0], [-1, 0, 1]],
      gradientStops: [
        { position: 0, color: { ...hex('#fafafa'), a: 1 } },
        { position: 1, color: { ...hex('#fafafa'), a: 0 } },
      ],
    },
  ];
  cover.appendChild(fade);

  const brand = autoLayout('HORIZONTAL', { name: 'Brand', itemSpacing: 14, counterAxisAlignItems: 'CENTER' });
  const mark = figma.createNodeFromSvg(data.markSvg);
  mark.resize(26, 32);
  brand.appendChild(mark);
  brand.appendChild(text('merki-icons', fonts.monoMedium, 28, '#18181b'));
  cover.appendChild(brand);
  brand.x = (1920 - brand.width) / 2;
  brand.y = 140;

  const headline = text('An icon library that\nobsesses over details', fonts.head, 104, '#18181b');
  headline.textAlignHorizontal = 'CENTER';
  headline.letterSpacing = { unit: 'PERCENT', value: -4 };
  headline.lineHeight = { unit: 'PERCENT', value: 100 };
  cover.appendChild(headline);
  headline.x = (1920 - headline.width) / 2;
  headline.y = 224;

  const facts = text(`${data.count} icons · 16 / 20 / 24 · MIT`, fonts.mono, 24, '#71717a');
  cover.appendChild(facts);
  facts.x = (1920 - facts.width) / 2;
  facts.y = 476;

  cover.x = 0;
  cover.y = 0;
  return { page: page.id, cover: cover.id, wall: data.wall.length, highlighted: data.highlight.length };
}

/** Construction: the 16px grid template (kept as one component, redrawn in place) and worked examples. */
export async function buildConstruction(data: { examples: string[] }) {
  const sets = await setsFromComponentsPage();
  requireSets(sets, data.examples);
  const page = pageByName('Construction');
  await figma.setCurrentPageAsync(page);
  // The template is a component other files may use: keep the node, redraw its contents.
  let template = page.children.find((n: any) => n.type === 'COMPONENT' && n.name === 'Construction grid');
  clearPage(page, (n) => n === template);
  if (!template) {
    template = figma.createComponent();
    template.name = 'Construction grid';
    page.appendChild(template);
  }
  for (const child of [...template.children]) child.remove();
  template.resizeWithoutConstraints(320, 320);
  template.fills = [solid('#ffffff')];
  template.description = 'The 16px grid at 20×: 1px padding (pink) and the four keylines (blue) from spec §2.';
  for (let i = 0; i <= 16; i += 1) {
    for (const vertical of [true, false]) {
      const line = figma.createRectangle();
      line.resize(vertical ? 1 : 320, vertical ? 320 : 1);
      line.x = vertical ? Math.min(i * 20, 319) : 0;
      line.y = vertical ? 0 : Math.min(i * 20, 319);
      line.fills = [solid('#eceef3')];
      template.appendChild(line);
    }
  }
  const outline = (node: any, color: string, opacity: number) => {
    node.fills = [];
    node.strokes = [solid(color, opacity)];
    node.strokeWeight = 1;
    template.appendChild(node);
    return node;
  };
  const padding = outline(figma.createRectangle(), '#e11d74', 0.5);
  padding.resize(280, 280);
  padding.x = 20;
  padding.y = 20;
  padding.dashPattern = [4, 4];
  const circle = outline(figma.createEllipse(), '#3b82f6', 0.55);
  circle.resize(240, 240);
  circle.x = 40;
  circle.y = 40;
  for (const [w, h, x, y] of [[230, 230, 45, 45], [200, 250, 60, 35], [250, 200, 35, 60]]) {
    const r = outline(figma.createRectangle(), '#3b82f6', 0.55);
    r.resize(w, h);
    r.x = x;
    r.y = y;
    r.cornerRadius = 40;
  }
  template.x = 0;
  template.y = 0;

  const fonts = await loadFonts();
  const row = autoLayout('HORIZONTAL', { name: 'Examples', itemSpacing: 40 });
  for (const setName of data.examples) {
    const cell = autoLayout('VERTICAL', { name: setName, itemSpacing: 12 });
    const stage = figma.createFrame();
    stage.name = 'Stage';
    stage.resize(320, 320);
    stage.fills = [];
    stage.clipsContent = false;
    stage.appendChild(template.createInstance());
    const icon = variantOf(sets.get(setName), 16).createInstance();
    icon.rescale(20);
    stage.appendChild(icon);
    icon.x = 0;
    icon.y = 0;
    cell.appendChild(stage);
    cell.appendChild(text(setName.split('/')[1], fonts.mono, 14, '#71717a'));
    row.appendChild(cell);
  }
  page.appendChild(row);
  row.x = 400;
  row.y = 0;
  return { page: page.id, template: template.id, examples: data.examples.length };
}

/** Changelog: CHANGELOG.md as text blocks. */
export async function buildChangelog(blocks: { type: 'h' | 'p' | 'ul'; level?: number; text?: string; items?: string[] }[]) {
  const page = pageByName('Changelog');
  await figma.setCurrentPageAsync(page);
  clearPage(page);
  const fonts = await loadFonts();
  const plain = (s: string) => s.replace(/\*\*|`/g, '');
  const column = autoLayout('VERTICAL', { name: 'Changelog', itemSpacing: 14, paddingTop: 48, paddingBottom: 48, paddingLeft: 48, paddingRight: 48 });
  column.counterAxisSizingMode = 'FIXED';
  column.resize(816, column.height);
  // resize() fixes both axes; the column must grow with its text.
  column.primaryAxisSizingMode = 'AUTO';
  column.fills = [solid('#ffffff')];
  page.appendChild(column);
  const add = (node: any) => {
    column.appendChild(node);
    node.textAutoResize = 'HEIGHT';
    node.layoutSizingHorizontal = 'FILL';
  };
  for (const block of blocks) {
    if (block.type === 'h') add(text(plain(block.text ?? ''), fonts.head, block.level === 1 ? 32 : block.level === 2 ? 22 : 16, '#18181b'));
    else if (block.type === 'p') add(text(plain(block.text ?? ''), fonts.text, 14, '#52525b'));
    else for (const item of block.items ?? []) add(text(`•  ${plain(item)}`, fonts.text, 14, '#52525b'));
  }
  column.x = 0;
  column.y = 0;
  return { page: page.id, column: column.id, blocks: blocks.length };
}
