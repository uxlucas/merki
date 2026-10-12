import { LayoutGridIcon, PencilIcon } from 'merki-icons';
import { Hero } from '../components/Hero';
import { Layout } from '../components/Layout';
import { WallBand } from '../components/WallBand';

export function Home({ openIcon }: { openIcon: string | null }) {
  return (
    <Layout active="index" top={<><Hero /><WallBand /></>}>
      <section id="icons" className="sec" aria-labelledby="icons-title">
        <h2 className="sec-title" id="icons-title"><LayoutGridIcon size={14} className="glyph-blue" />Icons</h2>
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
