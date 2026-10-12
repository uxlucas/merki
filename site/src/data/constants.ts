/** Canonical category order for the filter chips. Mirrors CATEGORIES in scripts/lib/categories.ts (site/ can't import from scripts/). */
export const CATEGORY_ORDER = [
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

export const SIZES = [16, 20, 24] as const;
