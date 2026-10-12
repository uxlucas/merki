import {
  createElement,
  forwardRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
  type SVGProps,
} from 'react';

export type IconTag = 'path' | 'circle' | 'rect' | 'line';
export type IconNode = ReadonlyArray<readonly [IconTag, Readonly<Record<string, string>>]>;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'color' | 'strokeWidth'> {
  /** Width and height. Number (px) or any CSS length. Default 16. */
  size?: number | string;
  /** Sets the SVG `color`, which strokes and solid accents both follow. Default currentColor. */
  color?: string;
  /** Keep strokes at their 16px weight (1.5, or 1.25 on interior details) at any size. Solid accents still scale. */
  absoluteStrokeWidth?: boolean;
  /** Accessible name. Without it (or aria-label) the icon is hidden from screen readers. */
  title?: string;
}

export type MerkiIcon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;

const toPascal = (name: string): string =>
  name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

export function createIcon(name: string, node: IconNode): MerkiIcon {
  const Icon = forwardRef<SVGSVGElement, IconProps>(function MerkiIconComponent(
    { size = 16, color = 'currentColor', absoluteStrokeWidth = false, title, className, children, ...rest },
    ref,
  ) {
    const labelled = Boolean(title || rest['aria-label'] || rest['aria-labelledby']);
    const a11y = labelled
      ? { role: 'img', 'aria-label': title ?? rest['aria-label'] }
      : { 'aria-hidden': true, focusable: 'false' };

    return createElement(
      'svg',
      {
        ref,
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        ...(color === 'currentColor' ? {} : { color }),
        className: ['merki', `merki-${name}`, className].filter(Boolean).join(' '),
        ...a11y,
        ...rest,
        ...(title ? { 'aria-label': title } : {}),
        strokeWidth: 1.5,
      } as SVGProps<SVGSVGElement>,
      title ? createElement('title', null, title) : null,
      ...node.map(([tag, attrs], index) =>
        createElement(tag, {
          key: index,
          ...attrs,
          ...(absoluteStrokeWidth ? { vectorEffect: 'non-scaling-stroke' } : {}),
        }),
      ),
      children,
    );
  });
  Icon.displayName = `${toPascal(name)}Icon`;
  return Icon;
}
