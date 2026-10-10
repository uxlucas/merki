export interface LabIcon {
  name: string;
  svg: string;
  meta: { category?: string; tags?: string[]; aliases?: string[] } | null;
}

export const SIZES = [16, 20, 24] as const;

/** Fixed weight references shown in compare mode. */
export const REFERENCE_NAMES = ['search', 'calendar', 'user', 'circle-x'] as const;
