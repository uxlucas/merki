import type { SiteIcon } from '../data/icons';

/**
 * A word may be a component name ("CalendarIcon"): the trailing "icon" is dropped so it matches the name.
 * A bare "icon" (or anything up to 4 letters) is kept as typed.
 */
const normalize = (word: string): string => (word.length > 4 && word.endsWith('icon') ? word.slice(0, -4) : word);

/** Every word of the query must appear in the name, a tag or an alias. */
export function searchIcons(list: SiteIcon[], query: string): SiteIcon[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean).map(normalize);
  if (words.length === 0) return list;
  return list.filter((icon) => {
    const haystack = [icon.name, ...icon.tags, ...icon.aliases].map((value) => value.toLowerCase());
    return words.every((word) => haystack.some((value) => value.includes(word)));
  });
}
