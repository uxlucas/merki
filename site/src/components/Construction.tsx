import { Fragment, useMemo } from 'react';
import { iconPoints, innerSvg } from '../lib/points';

const LINES = Array.from({ length: 15 }, (_, i) => i + 1);

export interface ConstructionProps {
  /** The icon's optimized SVG, as in icons.json. */
  svg: string;
  size: number;
  keylines?: boolean;
  /** Anchors, plus the pale ink and thin centreline that make them readable. */
  points?: boolean;
  handles?: boolean;
  className?: string;
}

/** The icon over the 16px grid and the four keylines from spec §2, with optional anchor points and handles. */
export function Construction({ svg, size, keylines = true, points = false, handles = false, className }: ConstructionProps) {
  const pts = useMemo(() => iconPoints(svg), [svg]);
  const inner = useMemo(() => ({ __html: innerSvg(svg) }), [svg]);
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} className={`construction${className ? ` ${className}` : ''}`} aria-hidden="true" focusable="false">
      <g className="c-grid">
        {LINES.map((i) => (
          <Fragment key={i}>
            <line x1={i} y1={0} x2={i} y2={16} />
            <line x1={0} y1={i} x2={16} y2={i} />
          </Fragment>
        ))}
      </g>
      <g className="c-keylines" data-on={keylines}>
        <circle cx={8} cy={8} r={6} />
        <rect x={2.25} y={2.25} width={11.5} height={11.5} rx={2} />
        <rect x={3} y={1.75} width={10} height={12.5} rx={2} />
        <rect x={1.75} y={3} width={12.5} height={10} rx={2} />
      </g>
      {/* Our own build output, from icons.json. */}
      <g className={`c-ink${points ? ' pale' : ''}`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={inner} />
      {points && <g className="c-centre" dangerouslySetInnerHTML={inner} />}
      {handles && (
        <g className="c-handles">
          {pts.handles.map(([ax, ay, hx, hy], i) => (
            <Fragment key={i}>
              <line x1={ax} y1={ay} x2={hx} y2={hy} />
              <circle cx={hx} cy={hy} r={0.16} />
            </Fragment>
          ))}
        </g>
      )}
      {points && (
        <g className="c-anchors">
          {pts.anchors.map(([x, y], i) => (
            <rect key={i} x={x - 0.2} y={y - 0.2} width={0.4} height={0.4} rx={0.06} />
          ))}
        </g>
      )}
    </svg>
  );
}
