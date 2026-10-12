import set from '../../../icons/_set.json';
import { CATEGORY_ORDER } from './constants';
import raw from './icons.json';

export type Category = (typeof CATEGORY_ORDER)[number];

/** One icon as the build writes it to icons.json. `svg` is the optimized SVG without width/height. */
export interface SiteIcon {
  name: string;
  component: string;
  category: Category;
  tags: string[];
  aliases: string[];
  svg: string;
}

export interface CategoryGroup {
  id: Category;
  label: string;
  icons: SiteIcon[];
}

export const icons = raw as unknown as SiteIcon[];
export const iconByName: ReadonlyMap<string, SiteIcon> = new Map(icons.map((icon) => [icon.name, icon]));
export const categoryLabel = (id: Category): string => id.charAt(0).toUpperCase() + id.slice(1);

const manifest = set as Record<Category, string[]>;

export const categories: CategoryGroup[] = CATEGORY_ORDER.map((id) => ({
  id,
  label: categoryLabel(id),
  icons: manifest[id].map((name) => {
    const icon = iconByName.get(name);
    if (!icon) throw new Error(`icons/_set.json lists ${name}, but the build has no such icon`);
    return icon;
  }),
}));

/** Every icon once: category order, then the order inside icons/_set.json. */
export const orderedIcons: SiteIcon[] = categories.flatMap((group) => group.icons);
