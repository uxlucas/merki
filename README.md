# Merki

An icon library that obsesses over details.

157 icons on a 16px grid with a 1.5 stroke, for React and plain SVG. Browse them at [merki.lucaslima.design](https://merki.lucaslima.design).

## Install

```sh
npm i merki-icons
```

Peer dependency: `react >= 18`.

## Usage

```tsx
import { CalendarIcon } from 'merki-icons'

<CalendarIcon />                               // 16px, currentColor
<CalendarIcon size={20} />
<CalendarIcon size={24} absoluteStrokeWidth />
<CalendarIcon title="Due date" />
<CalendarIcon className="text-muted" />
```

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `number \| string` | `16` | Sets width and height. |
| `color` | `string` | `'currentColor'` | Set as the SVG `color` attribute, so solid accents follow it as well as strokes. |
| `absoluteStrokeWidth` | `boolean` | `false` | Keeps the stroke at 1.5 screen px at any size, including CSS sizes like `"2rem"`. Solid accents still scale. |
| `title` | `string` | | Makes the icon accessible, see below. |

All other SVG props, and `ref`, go to the `<svg>`.

There is no `strokeWidth` prop. One weight is the identity of the set.

## Sizes

16, 20 and 24 px are the recommended sizes. Strokes scale with the size, unless you pass `absoluteStrokeWidth`.

## Accessibility

Icons are decorative by default: `aria-hidden="true"` and `focusable="false"`. For an icon-only control, pass `title`. The icon then gets `role="img"`, `aria-label` and a `<title>` child.

## Plain SVG

The optimized files are at `merki-icons/svg/<name>.svg`. Each GitHub release also attaches a zip of all the SVGs.

## Server components

The components use no hooks or context, so they work as React Server Components.

## Figma

A Figma library with every icon at 16, 20 and 24 is on the Figma Community (link coming with the 1.0 release). <!-- figma-community-link -->

## License

MIT, © 2026 Lucas Lima.

Made by [Lucas Lima](https://lucaslima.design).
