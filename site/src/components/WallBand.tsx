import { orderedIcons } from '../data/icons';
import { Icon } from './Icon';

export const WALL_HIGHLIGHTS = new Set(['settings', 'calendar', 'user-arrow', 'refresh', 'circle-check', 'globe', 'thumbs-up', 'map-pin']);

export function WallBand() {
  return (
    <div className="wallband" aria-hidden="true">
      <div className="wall">
        {orderedIcons.map((icon) => (
          <span key={icon.name} className={WALL_HIGHLIGHTS.has(icon.name) ? 'hl' : undefined}>
            <Icon component={icon.component} size={24} />
          </span>
        ))}
      </div>
    </div>
  );
}
