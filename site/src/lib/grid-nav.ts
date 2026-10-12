export type NavKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End';
export const NAV_KEYS: ReadonlySet<string> = new Set<NavKey>(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

/** Next icon for a key press. Groups are the visible category cards, each laid out `cols` wide. */
export function moveInGroups(groups: string[][], current: string, key: NavKey, cols: number): string {
  const flat = groups.flat();
  const g = groups.findIndex((group) => group.includes(current));
  if (g === -1) return flat[0] ?? current;
  const group = groups[g];
  const i = group.indexOf(current);
  const col = i % cols;

  switch (key) {
    case 'ArrowLeft':
      return flat[Math.max(0, flat.indexOf(current) - 1)];
    case 'ArrowRight':
      return flat[Math.min(flat.length - 1, flat.indexOf(current) + 1)];
    case 'Home':
      return group[0];
    case 'End':
      return group[group.length - 1];
    case 'ArrowDown': {
      if (i + cols < group.length) return group[i + cols];
      const lastRow = Math.floor((group.length - 1) / cols);
      if (Math.floor(i / cols) < lastRow) return group[group.length - 1];
      const next = groups[g + 1];
      return next ? next[Math.min(col, next.length - 1)] : current;
    }
    case 'ArrowUp': {
      if (i - cols >= 0) return group[i - cols];
      const prev = groups[g - 1];
      if (!prev) return current;
      const lastRowStart = Math.floor((prev.length - 1) / cols) * cols;
      return prev[Math.min(lastRowStart + col, prev.length - 1)];
    }
  }
}

/** Column count of a CSS grid, from its computed template. Falls back to 16 where there is no layout (tests). */
export function columnsOf(el: Element | null): number {
  if (!el) return 16;
  const template = getComputedStyle(el).gridTemplateColumns;
  const count = template ? template.split(' ').filter(Boolean).length : 0;
  return count > 0 ? count : 16;
}
