import { BookIcon, LayoutGridIcon, PencilIcon } from 'merki-icons';
import { CRAFT_TOPICS } from '../craft/topics';
import { categories, icons } from '../data/icons';
import { Link } from '../lib/router';
import { GUIDE_PAGES, type GuideSlug } from '../lib/routes';

export type Active = 'index' | 'changelog' | GuideSlug | null;

export function Sidebar({ active, open, onNavigate }: { active: Active; open: boolean; onNavigate: () => void }) {
  const current = (key: Active) => (active === key ? 'page' : undefined);
  return (
    <nav className={`sidebar${open ? ' open' : ''}`} aria-label="Site">
      <Link to="/" className="side-item" aria-current={current('index')} onNavigate={onNavigate}>Index</Link>
      <Link to="/changelog" className="side-item" aria-current={current('changelog')} onNavigate={onNavigate}>Changelog</Link>

      <div className="side-sec">
        <div className="side-head"><LayoutGridIcon size={14} className="glyph-blue" /><span>Icons</span></div>
        <Link to="/#icons" className="side-item" onNavigate={onNavigate}>
          All <span className="side-count">{icons.length}</span>
        </Link>
        {categories.map((group) => (
          <Link key={group.id} to={`/#cat-${group.id}`} className="side-item" onNavigate={onNavigate}>
            {group.label} <span className="side-count">{group.icons.length}</span>
          </Link>
        ))}
      </div>

      <div className="side-sec">
        <div className="side-head"><PencilIcon size={14} className="glyph-orange" /><span>Craft</span></div>
        {CRAFT_TOPICS.map((topic) => (
          <Link key={topic.slug} to={`/#craft-${topic.slug}`} className="side-item" onNavigate={onNavigate}>{topic.title}</Link>
        ))}
      </div>

      <div className="side-sec">
        <div className="side-head"><BookIcon size={14} className="glyph-pink" /><span>Guide</span></div>
        {GUIDE_PAGES.map((page) => (
          <Link key={page.slug} to={`/guide/${page.slug}`} className="side-item" aria-current={current(page.slug)} onNavigate={onNavigate}>
            {page.title}
          </Link>
        ))}
      </div>
    </nav>
  );
}
