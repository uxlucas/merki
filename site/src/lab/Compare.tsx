import { IconGlyph } from './IconGlyph';
import { REFERENCE_NAMES, type LabIcon } from './types';

export function Compare({ target, icons }: { target: LabIcon; icons: LabIcon[] }) {
  const category = target.meta?.category;
  const neighbours = icons.filter((i) => i.name !== target.name && category !== undefined && i.meta?.category === category);
  const references = REFERENCE_NAMES.map((name) => icons.find((i) => i.name === name)).filter(
    (i): i is LabIcon => i !== undefined && i.name !== target.name && !neighbours.includes(i),
  );
  const row = [target, ...neighbours, ...references];

  return (
    <section className="lab-section" aria-label={`Compare ${target.name}`}>
      <h2>Compare · {target.name}</h2>
      {[16, 24].map((size) => (
        <div key={size} className="compare-row">
          {row.map((icon) => (
            <figure key={icon.name} data-target={icon.name === target.name || undefined}>
              <IconGlyph svg={icon.svg} size={size} />
              <figcaption>{icon.name}</figcaption>
            </figure>
          ))}
        </div>
      ))}
    </section>
  );
}
