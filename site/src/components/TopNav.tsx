import { MenuIcon, MoonIcon, SunIcon, XIcon } from 'merki-icons';
import { useEffect } from 'react';
import { Link } from '../lib/router';
import { toggleTheme, watchSystemTheme } from '../lib/theme';
import { Logo } from './Logo';

function ThemeToggle() {
  useEffect(() => watchSystemTheme(), []);
  // Both glyphs render; CSS shows the one for the current theme, so server and client markup match.
  return (
    <button type="button" className="icon-btn theme-toggle" aria-label="Toggle theme" onClick={() => toggleTheme()}>
      <SunIcon className="sun" size={15} />
      <MoonIcon className="moon" size={15} />
    </button>
  );
}

export function TopNav({ menuOpen, onMenu }: { menuOpen: boolean; onMenu: () => void }) {
  return (
    <header className="topnav">
      <Logo />
      <nav className="topnav-links" aria-label="Main">
        <Link to="/#icons" className="nav-text">Icons</Link>
        <Link to="/#craft" className="nav-text">Craft</Link>
        <Link to="/guide/install" className="nav-text">Guide</Link>
        <ThemeToggle />
        <button type="button" className="icon-btn menu-btn" aria-label="Menu" aria-expanded={menuOpen} onClick={onMenu}>
          {menuOpen ? <XIcon size={16} /> : <MenuIcon size={16} />}
        </button>
      </nav>
    </header>
  );
}
