import { SITE_URL } from '../../site/src/config.js';

/** One icon as the build writes it to site/src/data/icons.json. */
export interface SourceIcon {
  name: string;
  component: string;
  category: string;
  tags: string[];
  aliases: string[];
  svg: string;
}

export interface FigmaIcon {
  name: string;
  category: string;
  /** Component set name in Figma: `category/name`. */
  setName: string;
  description: string;
  /** The icon's page on the site; set as the component set's documentation link. */
  docsUrl: string;
  /** 16px SVG with concrete black paint; the sync binds every paint to the `icon` variable. */
  svg: string;
}

export interface FigmaCategory {
  id: string;
  label: string;
  icons: FigmaIcon[];
}

export function toFigmaSvg(svg: string): string {
  return svg.replace(/^<svg\b/, '<svg width="16" height="16"').replace(/currentColor/g, '#000000');
}

export function figmaDescription(icon: SourceIcon): string {
  return [
    `React: ${icon.component}`,
    icon.tags.length ? `Tags: ${icon.tags.join(', ')}` : null,
    icon.aliases.length ? `Aliases: ${icon.aliases.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

const label = (id: string): string => id.charAt(0).toUpperCase() + id.slice(1);

export function figmaCategories(icons: SourceIcon[], order: Record<string, string[]>): FigmaCategory[] {
  const byName = new Map(icons.map((icon) => [icon.name, icon]));
  return Object.entries(order).map(([id, names]) => ({
    id,
    label: label(id),
    icons: names.map((name) => {
      const icon = byName.get(name);
      if (!icon) throw new Error(`icons/_set.json lists ${name}, but the build has no such icon`);
      return { name, category: id, setName: `${id}/${name}`, description: figmaDescription(icon), docsUrl: `${SITE_URL}/icons/${name}`, svg: toFigmaSvg(icon.svg) };
    }),
  }));
}
