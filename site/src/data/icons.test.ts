import { describe, expect, it } from 'vitest';
import { CalendarIcon } from 'merki-icons';
import { CATEGORY_ORDER } from './constants';
import { categories, categoryLabel, iconByName, icons, orderedIcons } from './icons';

describe('site icon data', () => {
  it('has the full set', () => {
    expect(icons).toHaveLength(157);
    expect(iconByName.get('calendar')?.component).toBe('CalendarIcon');
  });

  it('lists every icon exactly once, in category order', () => {
    expect(categories.map((c) => c.id)).toEqual([...CATEGORY_ORDER]);
    expect(orderedIcons).toHaveLength(icons.length);
    expect(new Set(orderedIcons.map((i) => i.name)).size).toBe(icons.length);
    for (const group of categories) {
      for (const icon of group.icons) expect(icon.category).toBe(group.id);
    }
    expect(categories.find((c) => c.id === 'navigation')?.icons).toHaveLength(22);
  });

  it('labels categories in sentence case', () => {
    expect(categoryLabel('communication')).toBe('Communication');
  });

  it('resolves merki-icons to the package source', () => {
    expect(CalendarIcon.displayName).toBe('CalendarIcon');
  });
});
