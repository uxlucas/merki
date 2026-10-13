# Changelog

Merki follows SemVer: an added or redrawn icon is a minor release (a redraw gets a line saying it looks different), a renamed or removed icon is a major one.

## 1.0.0 (2026-10-13)

The first public release.

### Icons

- 157 icons in ten categories: navigation, actions, status, people, objects, data, communication, system, text and billing.
- Drawn on a 16px grid with a 1.5 stroke. Interior details and small glyphs (numerals, letterforms) may use a 1.25 stroke as an optical correction; outer silhouettes stay 1.5.
- Solid shapes may sit at 30% opacity for inactive states, like the dimmed priority bars.

### Package

- `merki-icons`: React components named `*Icon`, with `size`, `color`, `absoluteStrokeWidth` and `title`.
- Raw SVGs at `merki-icons/svg/<name>.svg`, and a zip of them on each GitHub release.
- Decorative by default (`aria-hidden`). `title` gives an icon a name.
- No hooks or context, so the components work as React Server Components.

### Figma

- A Figma library with every icon as a component set at 16, 20 and 24, coloured by one `icon` variable with light and dark modes.
