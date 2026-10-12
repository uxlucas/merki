import { LayoutGridIcon, PencilIcon } from 'merki-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackToTop } from '../components/BackToTop';
import { Browser } from '../components/Browser';
import { Drawer } from '../components/Drawer';
import { Hero } from '../components/Hero';
import { Layout } from '../components/Layout';
import { WallBand } from '../components/WallBand';
import { CraftCards } from '../craft/CraftCards';
import { iconByName } from '../data/icons';
import { useRouter } from '../lib/router';

const fromGrid = () => Boolean((window.history.state as { fromGrid?: boolean } | null)?.fromGrid);

export function Home({ openIcon }: { openIcon: string | null }) {
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const icon = openIcon ? (iconByName.get(openIcon) ?? null) : null;

  const open = (name: string) => {
    // Switching icons while open replaces and keeps the entry's state, so Back/Close behaves as it did when the drawer opened.
    if (openIcon !== null) navigate(`/icons/${name}`, { replace: true, state: window.history.state });
    else navigate(`/icons/${name}`, { state: { fromGrid: true } });
  };
  const move = (name: string) => navigate(`/icons/${name}`, { replace: true, state: window.history.state });

  // back() settles asynchronously: a second Escape before it does must not step back again.
  const closing = useRef(false);
  useEffect(() => {
    closing.current = false;
  }, [openIcon]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const name = openIcon;
    if (fromGrid()) window.history.back();
    else navigate('/');
    if (name) requestAnimationFrame(() => document.querySelector<HTMLElement>(`.cell[data-name="${name}"]`)?.focus({ preventScroll: true }));
  }, [openIcon, navigate]);

  useEffect(() => {
    if (!openIcon) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openIcon, close]);

  return (
    <Layout active="index" top={<><Hero /><WallBand /></>}>
      <section id="icons" className="sec" aria-labelledby="icons-title">
        <h2 className="sec-title" id="icons-title"><LayoutGridIcon size={14} className="glyph-blue" />Icons</h2>
        <Browser query={query} onQuery={setQuery} selected={openIcon} onOpen={open} onMove={move} />
        {icon && <Drawer icon={icon} onClose={close} />}
      </section>
      <section id="craft" className="sec" aria-labelledby="craft-title">
        <h2 className="sec-title" id="craft-title"><PencilIcon size={14} className="glyph-orange" />Craft</h2>
        <p className="sec-lede">How the set is built, shown rather than told.</p>
        <CraftCards />
      </section>
      <BackToTop watch=".hero" />
    </Layout>
  );
}
