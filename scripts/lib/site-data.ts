import type { Category, IconMeta } from './categories.js';
import { componentName } from './react.js';

export interface SiteIcon {
  name: string;
  component: string;
  category: Category;
  tags: string[];
  aliases: string[];
  svg: string;
}

export function toSiteIcon(name: string, meta: IconMeta, svg: string): SiteIcon {
  return { name, component: componentName(name), category: meta.category, tags: meta.tags, aliases: meta.aliases, svg };
}
