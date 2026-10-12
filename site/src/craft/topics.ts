export const CRAFT_TOPICS = [
  { slug: 'keylines', title: 'Keylines' },
  { slug: 'one-stroke', title: 'One stroke' },
  { slug: 'looks-right', title: 'Looks right' },
  { slug: 'solid-accents', title: 'Solid accents' },
  { slug: 'in-context', title: 'In context' },
  { slug: 'points', title: 'Points' },
] as const;

export type CraftSlug = (typeof CRAFT_TOPICS)[number]['slug'];
