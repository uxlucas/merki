import type { SiteIcon } from '../data/icons';

/** Every word of the query must appear in the name, a tag, an alias or the component name. */
export function searchIcons(list: SiteIcon[], query: string): SiteIcon[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return list;
  return list.filter((icon) => {
    const haystack = [icon.name, icon.component, ...icon.tags, ...icon.aliases].map((value) => value.toLowerCase());
    return words.every((word) => haystack.some((value) => value.includes(word)));
  });
}
