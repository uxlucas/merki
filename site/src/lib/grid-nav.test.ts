import { describe, expect, it } from 'vitest';
import { moveInGroups } from './grid-nav';

// Two category cards, 3 columns: [a b c / d e] and [f g].
const groups = [['a', 'b', 'c', 'd', 'e'], ['f', 'g']];
const move = (from: string, key: Parameters<typeof moveInGroups>[2]) => moveInGroups(groups, from, key, 3);

describe('moveInGroups', () => {
  it('moves left and right through every icon, across cards', () => {
    expect(move('e', 'ArrowRight')).toBe('f');
    expect(move('f', 'ArrowLeft')).toBe('e');
    expect(move('a', 'ArrowLeft')).toBe('a');
    expect(move('g', 'ArrowRight')).toBe('g');
  });

  it('moves down a row, to the last icon of a short row, then into the next card', () => {
    expect(move('b', 'ArrowDown')).toBe('e');
    expect(move('c', 'ArrowDown')).toBe('e');
    expect(move('d', 'ArrowDown')).toBe('f');
    expect(move('e', 'ArrowDown')).toBe('g');
    expect(move('g', 'ArrowDown')).toBe('g');
  });

  it('moves up a row, and from a card into the last row of the one above', () => {
    expect(move('e', 'ArrowUp')).toBe('b');
    expect(move('f', 'ArrowUp')).toBe('d');
    expect(move('g', 'ArrowUp')).toBe('e');
    expect(move('a', 'ArrowUp')).toBe('a');
  });

  it('jumps to the ends of the card with Home and End', () => {
    expect(move('c', 'Home')).toBe('a');
    expect(move('c', 'End')).toBe('e');
  });

  it('starts at the first icon when the current one is gone', () => {
    expect(move('zz', 'ArrowRight')).toBe('a');
  });
});
