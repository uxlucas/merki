# Changelog

Merki is on `0.x` while it's being built. `1.0.0` is the first public release.

## Unreleased

### Icons

- 157 icons in ten categories: navigation, actions, status, people, objects, data, communication, system, text and billing.
- Added 11 high-frequency icons: `external-link`, `dashboard`, `grip-vertical`, `heart`, `save`, `circle-plus`, `funnel`, `zoom-in`, `zoom-out`, `map-pin` and `clipboard`.
- `sync` is its own icon, separate from `refresh`.
- Interior details and small glyphs (numerals, letterforms) may use a 1.25 stroke as an optical correction. Outer silhouettes stay 1.5.
- Solid shapes may sit at 30% opacity for inactive states, like the dimmed priority bars.

### Package

- `merki-icons`: React components named `*Icon`, with `size`, `color`, `absoluteStrokeWidth` and `title`.
- Raw SVGs at `merki-icons/svg/<name>.svg`.
- Decorative by default (`aria-hidden`). `title` gives an icon a name.
