import { IconGlyph } from './IconGlyph';
import { KeylineOverlay } from './KeylineOverlay';
import type { LabIcon } from './types';

export function GridView({ icons, onSelect }: { icons: LabIcon[]; onSelect: (name: string) => void }) {
  return (
    <section className="lab-section" aria-label="On the grid">
      <h2>On the grid · 8×</h2>
      <div className="zoom-list">
        {icons.map((icon) => (
          <figure key={icon.name} className="zoom">
            <button type="button" className="zoom-stage" aria-label={`Select ${icon.name}`} onClick={() => onSelect(icon.name)}>
              <KeylineOverlay />
              <IconGlyph svg={icon.svg} size={128} />
            </button>
            <figcaption>{icon.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
