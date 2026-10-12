export interface LabIcon {
  name: string;
  svg: string;
  meta: { category?: string; tags?: string[]; aliases?: string[] } | null;
}

export { CATEGORY_ORDER, SIZES } from '../data/constants';

/** Fixed weight references shown in compare mode. */
export const REFERENCE_NAMES = ['search', 'calendar', 'user', 'circle-x'] as const;
