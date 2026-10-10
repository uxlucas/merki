import { svgPathBbox } from 'svg-path-bbox';
import svgpath from 'svgpath';
import type { SvgElement } from './parse.js';

export type BBox = readonly [minX: number, minY: number, maxX: number, maxY: number];

export interface GeometryValues {
  anchors: number[];
  handles: number[];
}

const EPSILON = 1e-6;

export const onQuarterGrid = (v: number): boolean => Math.abs(v * 4 - Math.round(v * 4)) < EPSILON;
export const hasAtMostTwoDecimals = (v: number): boolean => Math.abs(v * 100 - Math.round(v * 100)) < EPSILON;

function num(el: SvgElement, key: string): number {
  const raw = el.attrs[key];
  if (raw === undefined) return 0;
  const value = raw.trim() === '' ? Number.NaN : Number(raw);
  if (!Number.isFinite(value)) throw new Error(`<${el.tag}> ${key}="${raw}" is not a number`);
  return value;
}

// svgpath's typings omit `err` and `segments`, but both exist at runtime.
interface ParsedPath {
  err: string;
  segments: Array<[string, ...number[]]>;
  abs(): ParsedPath;
}

function checkedPath(d: string): ParsedPath {
  if (d.trim() === '') throw new Error('invalid path data: empty');
  const path = svgpath(d) as unknown as ParsedPath;
  if (path.err) throw new Error(`invalid path data: ${path.err}`);
  return path;
}

export function elementBBox(el: SvgElement): BBox {
  switch (el.tag) {
    case 'path': {
      const d = el.attrs.d ?? '';
      checkedPath(d);
      const [minX, minY, maxX, maxY] = svgPathBbox(d);
      return [minX, minY, maxX, maxY];
    }
    case 'circle': {
      const cx = num(el, 'cx');
      const cy = num(el, 'cy');
      const r = num(el, 'r');
      return [cx - r, cy - r, cx + r, cy + r];
    }
    case 'rect': {
      const x = num(el, 'x');
      const y = num(el, 'y');
      return [x, y, x + num(el, 'width'), y + num(el, 'height')];
    }
    case 'line': {
      const x1 = num(el, 'x1');
      const y1 = num(el, 'y1');
      const x2 = num(el, 'x2');
      const y2 = num(el, 'y2');
      return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
    }
    default:
      throw new Error(`no geometry for <${el.tag}>`);
  }
}

function pathValues(d: string): GeometryValues {
  const anchors: number[] = [];
  const handles: number[] = [];
  for (const [command, ...v] of checkedPath(d).abs().segments) {
    switch (command) {
      case 'M':
      case 'L':
      case 'T':
      case 'H':
      case 'V':
        anchors.push(...v);
        break;
      case 'C':
        handles.push(...v.slice(0, 4));
        anchors.push(...v.slice(4));
        break;
      case 'S':
      case 'Q':
        handles.push(...v.slice(0, 2));
        anchors.push(...v.slice(2));
        break;
      case 'A':
        anchors.push(v[0], v[1], v[5], v[6]);
        break;
      default:
        break;
    }
  }
  return { anchors, handles };
}

export function geometryValues(el: SvgElement): GeometryValues {
  switch (el.tag) {
    case 'path':
      return pathValues(el.attrs.d ?? '');
    case 'circle':
      return { anchors: ['cx', 'cy', 'r'].map((k) => num(el, k)), handles: [] };
    case 'rect':
      return { anchors: ['x', 'y', 'width', 'height', 'rx'].map((k) => num(el, k)), handles: [] };
    case 'line':
      return { anchors: ['x1', 'y1', 'x2', 'y2'].map((k) => num(el, k)), handles: [] };
    default:
      throw new Error(`no geometry for <${el.tag}>`);
  }
}
