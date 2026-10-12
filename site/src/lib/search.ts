import type { SiteIcon } from '../data/icons';

const unhyphenate = (value: string): string => value.replace(/-/g, '');

/**
 * A word may be a component name ("CalendarIcon"): the trailing "icon" is dropped so it matches the name.
 * Up to 4 letters it is kept as typed. Hyphens are ignored, so "ArrowUpRightIcon" finds "arrow-up-right".
 */
const normalize = (word: string): string => unhyphenate(word.length > 4 && word.endsWith('icon') ? word.slice(0, -4) : word);

/** Every word of the query must appear in the name, a tag or an alias. A standalone "icon" or "icons" is filler. */
export function searchIcons(list: SiteIcon[], query: string): SiteIcon[] {
  const words = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((word) => word && word !== 'icon' && word !== 'icons')
    .map(normalize)
    .filter(Boolean);
  if (words.length === 0) return list;
  return list.filter((icon) => {
    const haystack = [icon.name, ...icon.tags, ...icon.aliases].map((value) => unhyphenate(value.toLowerCase()));
    return words.every((word) => haystack.some((value) => value.includes(word)));
  });
}
