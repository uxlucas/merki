export type Pt = readonly [number, number];
/** A curve handle: the anchor it belongs to, then the control point. */
export type Handle = readonly [number, number, number, number];
export interface Points {
  anchors: Pt[];
  handles: Handle[];
}

const TOKEN = /[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g;

export function pathPoints(d: string): Points {
  const tokens = d.match(TOKEN) ?? [];
  const anchors: Pt[] = [];
  const handles: Handle[] = [];
  let i = 0;
  let cx = 0, cy = 0, sx = 0, sy = 0;
  let cmd = '';
  let lastCtrl: Pt | null = null;
  const fail = (): never => {
    throw new Error(`can't read path data: ${d}`);
  };
  const num = (): number => {
    const value = Number(tokens[i++]);
    return Number.isFinite(value) ? value : fail();
  };

  while (i < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i])) cmd = tokens[i++];
    else if (!cmd) fail();
    const C = cmd.toUpperCase();
    const rel = cmd !== C;
    const ox = rel ? cx : 0;
    const oy = rel ? cy : 0;

    switch (C) {
      case 'Z':
        cx = sx;
        cy = sy;
        lastCtrl = null;
        cmd = ''; // numbers straight after Z are invalid
        continue;
      case 'M':
        cx = ox + num();
        cy = oy + num();
        sx = cx;
        sy = cy;
        anchors.push([cx, cy]);
        cmd = rel ? 'l' : 'L'; // further pairs are line-tos
        lastCtrl = null;
        continue;
      case 'L':
        cx = ox + num();
        cy = oy + num();
        break;
      case 'H':
        cx = (rel ? cx : 0) + num();
        break;
      case 'V':
        cy = (rel ? cy : 0) + num();
        break;
      case 'C':
      case 'S': {
        let x1: number, y1: number;
        if (C === 'C') {
          x1 = ox + num();
          y1 = oy + num();
        } else {
          x1 = lastCtrl ? 2 * cx - lastCtrl[0] : cx;
          y1 = lastCtrl ? 2 * cy - lastCtrl[1] : cy;
        }
        const x2 = ox + num(), y2 = oy + num(), x = ox + num(), y = oy + num();
        handles.push([cx, cy, x1, y1], [x, y, x2, y2]);
        lastCtrl = [x2, y2];
        cx = x;
        cy = y;
        anchors.push([cx, cy]);
        continue;
      }
      case 'Q': {
        const x1 = ox + num(), y1 = oy + num();
        const x = ox + num(), y = oy + num();
        handles.push([cx, cy, x1, y1], [x, y, x1, y1]);
        cx = x;
        cy = y;
        break;
      }
      case 'A':
        num(); num(); num(); num(); num();
        cx = ox + num();
        cy = oy + num();
        break;
      default:
        fail();
    }
    lastCtrl = null;
    anchors.push([cx, cy]);
  }
  return { anchors, handles };
}

const attr = (tag: string, name: string): number => {
  const match = new RegExp(`\\s${name}="([^"]+)"`).exec(tag);
  return match ? Number(match[1]) : 0;
};

export function iconPoints(svg: string): Points {
  const anchors: Pt[] = [];
  const handles: Handle[] = [];
  for (const [tag] of svg.matchAll(/<(path|circle|rect|line)\b[^>]*>/g)) {
    if (tag.startsWith('<path')) {
      const d = /\sd="([^"]+)"/.exec(tag)?.[1] ?? '';
      const p = pathPoints(d);
      anchors.push(...p.anchors);
      handles.push(...p.handles);
    } else if (tag.startsWith('<circle')) {
      const [x, y, r] = [attr(tag, 'cx'), attr(tag, 'cy'), attr(tag, 'r')];
      anchors.push([x, y - r], [x + r, y], [x, y + r], [x - r, y]);
    } else if (tag.startsWith('<rect')) {
      const [x, y, w, h, r] = [attr(tag, 'x'), attr(tag, 'y'), attr(tag, 'width'), attr(tag, 'height'), attr(tag, 'rx')];
      anchors.push([x + r, y], [x + w - r, y], [x + w, y + r], [x + w, y + h - r], [x + w - r, y + h], [x + r, y + h], [x, y + h - r], [x, y + r]);
    } else {
      anchors.push([attr(tag, 'x1'), attr(tag, 'y1')], [attr(tag, 'x2'), attr(tag, 'y2')]);
    }
  }
  const key = (p: Pt) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`;
  return { anchors: [...new Map(anchors.map((p) => [key(p), p])).values()], handles };
}

/** The children of the root <svg>, as markup. */
export function innerSvg(svg: string): string {
  return svg.trim().replace(/^<svg\b[^>]*>/, '').replace(/<\/svg>$/, '');
}
