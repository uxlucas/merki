import { describe, expect, it } from 'vitest';
import { iconByName } from '../data/icons';
import { iconPoints, innerSvg, pathPoints } from './points';

describe('pathPoints', () => {
  it('reads lines, including implicit and relative ones', () => {
    expect(pathPoints('M2 2h4v4').anchors).toEqual([[2, 2], [6, 2], [6, 6]]);
    expect(pathPoints('M2 2 4 4').anchors).toEqual([[2, 2], [4, 4]]);
    expect(pathPoints('M1 1h2z m1 1h1').anchors).toEqual([[1, 1], [3, 1], [2, 2], [3, 2]]);
  });

  it('reads curves and their handles', () => {
    expect(pathPoints('M1 1c1 0 2 1 2 2')).toEqual({ anchors: [[1, 1], [3, 3]], handles: [[1, 1, 2, 1], [3, 3, 3, 2]] });
  });

  it('reflects the first handle of a smooth curve', () => {
    expect(pathPoints('M0 0C0 1 1 2 2 2S4 3 4 4').handles).toEqual([
      [0, 0, 0, 1],
      [2, 2, 1, 2],
      [2, 2, 3, 2],
      [4, 4, 4, 3],
    ]);
  });

  it('reads arcs as their end points, without handles', () => {
    expect(pathPoints('M4 8a4 4 0 0 1 8 0')).toEqual({ anchors: [[4, 8], [12, 8]], handles: [] });
  });

  it('refuses path data it does not understand', () => {
    expect(() => pathPoints('M1 1 L x')).toThrow(/path data/);
    expect(() => pathPoints('Z 1 2')).toThrow(/path data/);
  });
});

describe('iconPoints', () => {
  it('adds circles, rects and lines', () => {
    const svg = '<svg><circle cx="8" cy="8" r="2"/><rect x="1" y="1" width="4" height="4"/><line x1="1" y1="14" x2="5" y2="14"/></svg>';
    expect(iconPoints(svg).anchors).toEqual([
      [8, 6], [10, 8], [8, 10], [6, 8],
      [1, 1], [5, 1], [5, 5], [1, 5],
      [1, 14], [5, 14],
    ]);
  });

  it('uses the tangent points of rounded rects', () => {
    const svg = '<svg><rect x="2" y="2" width="12" height="12" rx="2"/></svg>';
    expect(iconPoints(svg).anchors).toHaveLength(8);
  });

  it('counts the real heart', () => {
    const heart = iconByName.get('heart')!;
    expect(iconPoints(heart.svg).anchors).toHaveLength(9);
    expect(iconPoints(heart.svg).handles).toHaveLength(14);
  });

  it('only finds anchors on the quarter grid in the real set', () => {
    for (const icon of iconByName.values()) {
      for (const [x, y] of iconPoints(icon.svg).anchors) {
        expect(Number.isInteger(x * 4) && Number.isInteger(y * 4), `${icon.name} ${x},${y}`).toBe(true);
      }
    }
  });
});

describe('innerSvg', () => {
  it('strips the root element', () => {
    expect(innerSvg('<svg a="1"><path d="M1 1"/></svg>\n')).toBe('<path d="M1 1"/>');
  });
});
