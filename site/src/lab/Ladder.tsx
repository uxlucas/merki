import { IconGlyph } from './IconGlyph';
import type { ReviewFile } from './review';
import { SIZES, type LabIcon } from './types';

interface Props {
  icons: LabIcon[];
  selected: string | null;
  reviews: ReviewFile;
  onSelect: (name: string) => void;
}

export function Ladder({ icons, selected, reviews, onSelect }: Props) {
  return (
    <section className="lab-section" aria-label="Sizes">
      <h2>Sizes</h2>
      {SIZES.map((size) => (
        <div className="ladder-row" key={size}>
          <span className="ladder-size">{size}</span>
          {icons.map((icon) => (
            <button
              key={icon.name}
              type="button"
              className="cell"
              title={icon.name}
              aria-label={`${icon.name} at ${size}px`}
              data-selected={selected === icon.name || undefined}
              data-review={reviews[icon.name]?.status}
              onClick={() => onSelect(icon.name)}
            >
              <IconGlyph svg={icon.svg} size={size} />
            </button>
          ))}
        </div>
      ))}
    </section>
  );
}
