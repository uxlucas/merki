export interface LabIcon {
  name: string;
  svg: string;
  meta: { category?: string; tags?: string[]; aliases?: string[] } | null;
}

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

/** Fixed weight references shown in compare mode. */
export const REFERENCE_NAMES = ['search', 'calendar', 'user', 'circle-x'] as const;
