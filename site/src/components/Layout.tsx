import { useState, type ReactNode } from 'react';
import { Sidebar, type Active } from './Sidebar';
import { TopNav } from './TopNav';

export function Layout({ active, top, children }: { active: Active; top?: ReactNode; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <TopNav menuOpen={menuOpen} onMenu={() => setMenuOpen((open) => !open)} />
      {top}
      <div className="index">
        <Sidebar active={active} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        <main className="main" id="main">
          {children}
        </main>
      </div>
    </>
  );
}
