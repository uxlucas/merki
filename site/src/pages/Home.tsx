import { LayoutGridIcon, PencilIcon } from 'merki-icons';
import { useState } from 'react';
import { Browser } from '../components/Browser';
import { Hero } from '../components/Hero';
import { Layout } from '../components/Layout';
import { WallBand } from '../components/WallBand';
import { useRouter } from '../lib/router';

export function Home({ openIcon }: { openIcon: string | null }) {
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  return (
    <Layout active="index" top={<><Hero /><WallBand /></>}>
      <section id="icons" className="sec" aria-labelledby="icons-title">
        <h2 className="sec-title" id="icons-title"><LayoutGridIcon size={14} className="glyph-blue" />Icons</h2>
        <Browser
          query={query}
          onQuery={setQuery}
          selected={openIcon}
          onOpen={(name) => navigate(`/icons/${name}`, { state: { fromGrid: true } })}
          onMove={(name) => navigate(`/icons/${name}`, { replace: true, state: window.history.state })}
        />
      </section>
      <section id="craft" className="sec" aria-labelledby="craft-title">
        <h2 className="sec-title" id="craft-title"><PencilIcon size={14} className="glyph-orange" />Craft</h2>
        <p className="sec-lede">How the set is built, shown rather than told.</p>
      </section>
      {openIcon && (
        <aside aria-label={`${openIcon} icon`}>
          <h2>{openIcon}</h2>
        </aside>
      )}
    </Layout>
  );
}
