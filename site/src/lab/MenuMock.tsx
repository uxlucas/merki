import { IconGlyph } from './IconGlyph';
import type { LabIcon } from './types';

const label = (name: string) => name.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

export function MenuMock({ icons }: { icons: LabIcon[] }) {
  return (
    <section className="lab-section" aria-label="In a menu">
      <h2>In a menu</h2>
      <div className="menus">
        {(['light', 'dark'] as const).map((theme) => (
          <ul key={theme} className="menu" data-theme={theme}>
            {icons.map((icon) => (
              <li key={icon.name}>
                <IconGlyph svg={icon.svg} size={16} />
                <span>{label(icon.name)}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
