import { CATEGORIES, type Category, type IconMeta } from './categories.js';
import { elementBBox, geometryValues, hasAtMostTwoDecimals, onQuarterGrid } from './geometry.js';
import type { SvgElement } from './parse.js';

export type RuleId =
  | 'parse'
  | 'name'
  | 'metadata'
  | 'orphan'
  | 'viewbox'
  | 'root-attrs'
  | 'empty'
  | 'elements'
  | 'attributes'
  | 'color'
  | 'grid'
  | 'handles'
  | 'bounds';

export interface Violation {
  icon: string;
  rule: RuleId;
  detail: string;
}

export const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const REQUIRED_ROOT: Record<string, string> = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.5',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};
const OPTIONAL_ROOT = new Set(['xmlns']);

const ALLOWED_ATTRS: Record<string, ReadonlySet<string>> = {
  path: new Set(['d', 'fill', 'stroke', 'fill-rule']),
  circle: new Set(['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-dasharray', 'stroke-dashoffset']),
  rect: new Set(['x', 'y', 'width', 'height', 'rx', 'fill', 'stroke']),
  line: new Set(['x1', 'y1', 'x2', 'y2']),
};
const COLOR_VALUES = new Set(['currentColor', 'none']);
const HALF_STROKE = 0.75;
const LIMIT_MIN = 1;
const LIMIT_MAX = 15;
const EPSILON = 1e-6;

const fmt = (n: number): string => String(Math.round(n * 1000) / 1000);

export function lintName(name: string): Violation[] {
  return NAME_PATTERN.test(name)
    ? []
    : [{ icon: name, rule: 'name', detail: `"${name}" must be kebab-case (lowercase letters, digits, single dashes)` }];
}

export function lintMeta(name: string, metaJson: string | null): { violations: Violation[]; meta: IconMeta | null } {
  const fail = (detail: string) => ({ violations: [{ icon: name, rule: 'metadata' as const, detail }], meta: null });
  if (metaJson === null) return fail(`missing ${name}.json`);

  let data: unknown;
  try {
    data = JSON.parse(metaJson);
  } catch (error) {
    return fail(`${name}.json is not valid JSON: ${(error as Error).message}`);
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return fail(`${name}.json must be an object`);

  const record = data as Record<string, unknown>;
  if (!CATEGORIES.includes(record.category as Category)) {
    return fail(`category "${String(record.category)}" must be one of: ${CATEGORIES.join(', ')}`);
  }
  for (const key of ['tags', 'aliases'] as const) {
    const value = record[key];
    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
      return fail(`${key} must be an array of strings`);
    }
  }
  return {
    violations: [],
    meta: { category: record.category as Category, tags: record.tags as string[], aliases: record.aliases as string[] },
  };
}

export function lintSvg(name: string, root: SvgElement): Violation[] {
  const out: Violation[] = [];
  const add = (rule: RuleId, detail: string) => out.push({ icon: name, rule, detail });

  if (root.attrs.viewBox !== REQUIRED_ROOT.viewBox) {
    add('viewbox', `viewBox must be "0 0 16 16" (got ${root.attrs.viewBox === undefined ? 'nothing' : `"${root.attrs.viewBox}"`})`);
  }
  for (const [key, expected] of Object.entries(REQUIRED_ROOT)) {
    if (key === 'viewBox') continue;
    if (root.attrs[key] !== expected) {
      add('root-attrs', `<svg> ${key} must be "${expected}" (got ${root.attrs[key] === undefined ? 'nothing' : `"${root.attrs[key]}"`})`);
    }
  }
  for (const key of Object.keys(root.attrs)) {
    if (!(key in REQUIRED_ROOT) && !OPTIONAL_ROOT.has(key)) add('root-attrs', `<svg> has unexpected attribute "${key}"`);
  }

  if (root.children.length === 0) add('empty', 'the icon draws nothing');

  root.children.forEach((child, index) => {
    const label = `<${child.tag}> #${index + 1}`;
    const allowed = ALLOWED_ATTRS[child.tag];
    if (!allowed) {
      add('elements', `${label} is not allowed; use path, circle, rect or line`);
      return;
    }
    if (child.children.length > 0) add('elements', `${label} must not contain other elements`);

    for (const key of Object.keys(child.attrs)) {
      if (!allowed.has(key)) add('attributes', `${label}: attribute "${key}" is not allowed`);
    }
    for (const key of ['fill', 'stroke']) {
      const value = child.attrs[key];
      if (value !== undefined && !COLOR_VALUES.has(value)) add('color', `${label}: ${key}="${value}" must be currentColor or none`);
    }

    let values;
    let box;
    try {
      values = geometryValues(child);
      box = elementBBox(child);
    } catch (error) {
      add('parse', `${label}: ${(error as Error).message}`);
      return;
    }

    const offGrid = [...new Set(values.anchors.filter((v) => !onQuarterGrid(v)))];
    if (offGrid.length) add('grid', `${label}: ${offGrid.map(fmt).join(', ')} not on the 0.25 grid`);
    const fineHandles = [...new Set(values.handles.filter((v) => !hasAtMostTwoDecimals(v)))];
    if (fineHandles.length) add('handles', `${label}: handles ${fineHandles.map(fmt).join(', ')} need at most 2 decimals`);

    const stroked = (child.attrs.stroke ?? root.attrs.stroke) !== 'none';
    const pad = stroked ? HALF_STROKE : 0;
    const [minX, minY, maxX, maxY] = [box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad];
    const edges: string[] = [];
    if (minX < LIMIT_MIN - EPSILON) edges.push(`x=${fmt(minX)}`);
    if (minY < LIMIT_MIN - EPSILON) edges.push(`y=${fmt(minY)}`);
    if (maxX > LIMIT_MAX + EPSILON) edges.push(`x=${fmt(maxX)}`);
    if (maxY > LIMIT_MAX + EPSILON) edges.push(`y=${fmt(maxY)}`);
    if (edges.length) add('bounds', `${label} reaches ${edges.join(', ')}${stroked ? ' with its stroke' : ''} (allowed 1–15)`);
  });

  return out;
}
