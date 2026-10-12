import { useState, type ReactNode } from 'react';
import { useRouter } from '../lib/router';
import { Sidebar, type Active } from './Sidebar';
import { TopNav } from './TopNav';

export function Layout({ active, top, children }: { active: Active; top?: ReactNode; children: ReactNode }) {
  const { path } = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <TopNav menuOpen={menuOpen} onMenu={() => setMenuOpen((open) => !open)} />
      {top}
      {/* data-path lets the client check that the prerendered page is the page for this URL before hydrating (lib/hydrate.ts). */}
      <div className="index" data-path={path}>
        <Sidebar active={active} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        <main className="main" id="main">
          {children}
        </main>
      </div>
    </>
  );
}
