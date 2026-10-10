export function IconGlyph({ svg, size }: { svg: string; size: number }) {
  return (
    <span
      className="glyph"
      style={{ width: size, height: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
