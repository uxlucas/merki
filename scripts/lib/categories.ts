export const CATEGORIES = [
  'navigation',
  'actions',
  'status',
  'people',
  'objects',
  'data',
  'communication',
  'system',
  'text',
  'billing',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface IconMeta {
  category: Category;
  tags: string[];
  aliases: string[];
}
