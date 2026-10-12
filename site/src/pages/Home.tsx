import { icons } from '../data/icons';

export function Home({ openIcon }: { openIcon: string | null }) {
  return (
    <main>
      <h1>{`${icons.length} icons for software people use all day.`}</h1>
      {openIcon && (
        <aside aria-label={`${openIcon} icon`}>
          <h2>{openIcon}</h2>
        </aside>
      )}
    </main>
  );
}
