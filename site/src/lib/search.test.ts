import { describe, expect, it } from 'vitest';
import { icons } from '../data/icons';
import { searchIcons } from './search';

const names = (query: string) => searchIcons(icons, query).map((icon) => icon.name);

describe('searchIcons', () => {
  it('returns everything for an empty query', () => {
    expect(searchIcons(icons, '')).toHaveLength(icons.length);
    expect(searchIcons(icons, '   ')).toHaveLength(icons.length);
  });

  it('ignores case and extra spaces', () => {
    expect(names('  CAL ')).toContain('calendar');
  });

  it('needs every word to match', () => {
    const result = names('arrow up');
    expect(result).toContain('arrow-up');
    expect(result).toContain('arrow-up-right');
    expect(result).not.toContain('arrow-down');
  });

  it('matches tags and aliases, and component names with or without hyphens', () => {
    expect(names('pulse')).toContain('activity');
    expect(names('CalendarIcon')).toEqual(['calendar']);
    expect(names('ArrowUpRightIcon')).toEqual(['arrow-up-right']);
    const dashed = names('arrow-up');
    expect(dashed).toContain('arrow-up');
    expect(dashed).toContain('arrow-up-right');
  });

  it('treats a standalone "icon" or "icons" as filler', () => {
    expect(names('calendar icon')).toContain('calendar');
    expect(names('icon')).toHaveLength(icons.length);
    expect(names('icons')).toHaveLength(icons.length);
    expect(names(' Icons icon ')).toHaveLength(icons.length);
  });

  it('does not match every icon on letters of the "Icon" suffix', () => {
    for (const query of ['i', 'c', 'o', 'n', 'ic', 'co', 'on', 'con']) {
      expect(names(query).length, query).toBeLessThan(icons.length);
    }
    expect(names('con').length).toBeLessThan(157);
    expect(names('on').length).toBeLessThan(157);
  });

  it('accepts a component name in any case', () => {
    expect(names('HOMEICON')).toContain('home');
  });

  it('returns nothing when nothing matches', () => {
    expect(names('zzzz')).toEqual([]);
  });
});
