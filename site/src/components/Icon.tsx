import * as Merki from 'merki-icons';
import type { IconProps, MerkiIcon } from 'merki-icons';

const registry = Merki as unknown as Record<string, MerkiIcon | undefined>;

/** Renders a merki-icons component by its export name, e.g. "CalendarIcon". */
export function Icon({ component, ...props }: IconProps & { component: string }) {
  const Component = registry[component];
  if (!Component) throw new Error(`merki-icons has no export called ${component}`);
  return <Component {...props} />;
}
