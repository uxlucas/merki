/*
 * Runs inside Figma through the Figma connection (use_figma). Plain Plugin API, no imports:
 * scripts/figma-scripts.ts transpiles this file, strips `export`, and inlines it into every script.
 */
declare const figma: any;

export const SIZES = [16, 20, 24];
export const PAGE_NAMES = ['Cover', 'Icons', 'Components', 'Construction', 'Changelog'];
const COLLECTION = 'Merki';
const VARIABLE = 'icon';
const DEPRECATED = 'Deprecated';
const GRID = { cols: 6, cellW: 136, cellH: 72, pad: 40, top: 64, gap: 120 };

export const hex = (value: string) => ({
  r: parseInt(value.slice(1, 3), 16) / 255,
  g: parseInt(value.slice(3, 5), 16) / 255,
  b: parseInt(value.slice(5, 7), 16) / 255,
});

export function pageByName(name: string): any {
  const page = figma.root.children.find((p: any) => p.name === name);
  if (!page) throw new Error(`Page "${name}" is missing. Run 00-setup first.`);
  return page;
}

export async function ensurePages(): Promise<string[]> {
  const created: string[] = [];
  const pages = figma.root.children;
  // A new file starts with one blank "Page 1": make it the Cover instead of leaving it behind.
  if (!pages.some((p: any) => p.name === 'Cover') && pages.length === 1 && pages[0].children.length === 0) pages[0].name = 'Cover';
  for (const name of PAGE_NAMES) {
    if (!figma.root.children.some((p: any) => p.name === name)) {
      const page = figma.createPage();
      page.name = name;
      created.push(page.id);
    }
  }
  PAGE_NAMES.forEach((name, index) => {
    const page = pageByName(name);
    if (figma.root.children.indexOf(page) !== index) figma.root.insertChild(index, page);
  });
  return created;
}

export async function ensureIconVariable(): Promise<any> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let collection = collections.find((c: any) => c.name === COLLECTION);
  if (!collection) {
    collection = figma.variables.createVariableCollection(COLLECTION);
    collection.renameMode(collection.modes[0].modeId, 'Light');
    collection.addMode('Dark');
  }
  const mode = (name: string) => collection.modes.find((m: any) => m.name === name).modeId;
  const variables = await figma.variables.getLocalVariablesAsync('COLOR');
  let variable = variables.find((v: any) => v.name === VARIABLE && v.variableCollectionId === collection.id);
  if (!variable) variable = figma.variables.createVariable(VARIABLE, collection, 'COLOR');
  variable.scopes = ['STROKE_COLOR', 'SHAPE_FILL'];
  variable.setValueForMode(mode('Light'), hex('#18181b'));
  variable.setValueForMode(mode('Dark'), hex('#e6e7eb'));
  return variable;
}

export function boundPaint(paint: any, variable: any): any {
  const bound = figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: paint.color }, 'color', variable);
  return paint.opacity !== undefined && paint.opacity !== 1 ? { ...bound, opacity: paint.opacity } : bound;
}

export function bindPaints(node: any, variable: any): number {
  const nodes = node.findAll(() => true);
  for (const n of nodes) {
    if (Array.isArray(n.strokes) && n.strokes.length) n.strokes = n.strokes.map((p: any) => (p.type === 'SOLID' ? boundPaint(p, variable) : p));
    if (Array.isArray(n.fills) && n.fills.length) n.fills = n.fills.map((p: any) => (p.type === 'SOLID' ? boundPaint(p, variable) : p));
  }
  return nodes.length;
}

/** Replace a variant's drawing with the 16px SVG rescaled to `size` (strokes scale with it). The component itself stays. */
export function drawInto(component: any, svg: string, size: number, variable: any): void {
  for (const child of [...component.children]) child.remove();
  const art = figma.createNodeFromSvg(svg);
  if (size !== 16) art.rescale(size / 16);
  component.resizeWithoutConstraints(size, size);
  for (const child of [...art.children]) component.appendChild(child);
  art.remove();
  component.fills = [];
  component.clipsContent = false;
  bindPaints(component, variable);
}

export function gridPosition(index: number, cols: number): { x: number; y: number } {
  return { x: GRID.pad + (index % cols) * GRID.cellW, y: GRID.top + Math.floor(index / cols) * GRID.cellH };
}

export function layoutVariants(set: any): void {
  let x = 16;
  for (const child of set.children) {
    child.x = x;
    child.y = 16;
    x += child.width + 16;
  }
  set.resizeWithoutConstraints(x, 16 + Math.max(...set.children.map((c: any) => c.height)) + 16);
}

export function upsertIconSet(icon: any, sets: Map<string, any>, section: any, variable: any): { set: any; created: boolean } {
  const existing = sets.get(icon.setName);
  const variants = new Map<string, any>();
  if (existing) for (const child of existing.children) if (child.type === 'COMPONENT') variants.set(child.name, child);
  const fresh: any[] = [];
  const components = SIZES.map((size) => {
    const name = `Size=${size}`;
    let component = variants.get(name);
    if (!component) {
      component = figma.createComponent();
      component.name = name;
      fresh.push(component);
    }
    drawInto(component, icon.svg, size, variable);
    return component;
  });
  let set = existing;
  if (!set) {
    set = figma.combineAsVariants(components, section);
    set.name = icon.setName;
    sets.set(icon.setName, set);
  } else {
    for (const component of fresh) set.appendChild(component);
    if (set.parent !== section) section.appendChild(set);
  }
  set.description = icon.description;
  layoutVariants(set);
  return { set, created: !existing };
}

function sizeSection(section: any, count: number): void {
  const rows = Math.max(1, Math.ceil(count / GRID.cols));
  section.resizeWithoutConstraints(GRID.pad * 2 + GRID.cols * GRID.cellW, GRID.top + rows * GRID.cellH + GRID.pad);
}

/** One category: its section on the Components page, and every icon's set inside it, updated in place. */
export async function syncCategory(data: { id: string; label: string; previousLabel: string | null; icons: any[] }) {
  const page = pageByName('Components');
  await figma.setCurrentPageAsync(page);
  const variable = await ensureIconVariable();
  const sets = new Map<string, any>(page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).map((s: any) => [s.name, s]));
  let section = page.children.find((n: any) => n.type === 'SECTION' && n.name === data.label);
  if (!section) {
    section = figma.createSection();
    section.name = data.label;
    page.appendChild(section);
  }
  let created = 0;
  const variantIds: string[] = [];
  data.icons.forEach((icon, index) => {
    const result = upsertIconSet(icon, sets, section, variable);
    if (result.created) created += 1;
    const at = gridPosition(index, GRID.cols);
    result.set.x = at.x;
    result.set.y = at.y;
    variantIds.push(...result.set.children.map((c: any) => c.id));
  });
  sizeSection(section, data.icons.length);
  const previous = data.previousLabel ? page.children.find((n: any) => n.type === 'SECTION' && n.name === data.previousLabel) : null;
  section.x = 0;
  section.y = previous ? previous.y + previous.height + GRID.gap : 0;
  return { section: section.id, sets: data.icons.length, created, updated: data.icons.length - created, variantIds };
}

/** Sets the repo no longer has move to "Deprecated" (never deleted, so other files' instances keep working). */
export async function deprecateMissing(keepNames: string[]) {
  const page = pageByName('Components');
  await figma.setCurrentPageAsync(page);
  const keep = new Set(keepNames);
  const stale = page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).filter((s: any) => !keep.has(s.name));
  let section = page.children.find((n: any) => n.type === 'SECTION' && n.name === DEPRECATED);
  if (!stale.length) {
    if (section && section.children.length === 0) section.remove();
    return { moved: [] as string[] };
  }
  if (!section) {
    section = figma.createSection();
    section.name = DEPRECATED;
    page.appendChild(section);
  }
  stale.forEach((set: any, index: number) => {
    section.appendChild(set);
    const at = gridPosition(index, GRID.cols);
    set.x = at.x;
    set.y = at.y;
  });
  sizeSection(section, stale.length);
  const bottom = Math.max(0, ...page.children.filter((n: any) => n !== section).map((n: any) => n.y + n.height));
  section.x = 0;
  section.y = bottom + GRID.gap;
  return { moved: stale.map((s: any) => s.name) };
}

/* ---- Shared helpers for the presentation pages (scripts/figma/pages.ts). ---- */

export function autoLayout(direction: 'HORIZONTAL' | 'VERTICAL', props: Record<string, unknown> = {}): any {
  const frame = figma.createFrame();
  frame.layoutMode = direction;
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.fills = [];
  Object.assign(frame, props);
  return frame;
}

export async function loadFonts() {
  const available = await figma.listAvailableFontsAsync();
  const has = (family: string, style: string) => available.some((f: any) => f.fontName.family === family && f.fontName.style === style);
  const pick = (family: string, style: string) => (has(family, style) ? { family, style } : { family: 'Inter', style });
  const fonts = {
    head: pick('Host Grotesk', 'Medium'),
    mono: pick('JetBrains Mono', 'Regular'),
    monoMedium: pick('JetBrains Mono', 'Medium'),
    text: { family: 'Inter', style: 'Regular' },
  };
  for (const font of Object.values(fonts)) await figma.loadFontAsync(font);
  return fonts;
}

export function text(chars: string, font: any, size: number, color: string): any {
  const node = figma.createText();
  node.fontName = font;
  node.fontSize = size;
  node.characters = chars;
  node.fills = [{ type: 'SOLID', color: hex(color) }];
  return node;
}
