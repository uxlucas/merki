const LINES = Array.from({ length: 15 }, (_, i) => i + 1);

/** The 16px grid, the 1px padding and the four keylines from spec §2. */
export function KeylineOverlay() {
  return (
    <svg className="overlay" viewBox="0 0 16 16" aria-hidden="true">
      {LINES.map((i) => (
        <g key={i}>
          <line x1={i} y1={0} x2={i} y2={16} />
          <line x1={0} y1={i} x2={16} y2={i} />
        </g>
      ))}
      <rect className="pad" x={1} y={1} width={14} height={14} />
      <circle className="key" cx={8} cy={8} r={6} />
      <rect className="key" x={2.25} y={2.25} width={11.5} height={11.5} rx={2} />
      <rect className="key" x={3} y={1.75} width={10} height={12.5} rx={2} />
      <rect className="key" x={1.75} y={3} width={12.5} height={10} rx={2} />
    </svg>
  );
}
