import { CodeIcon, CopyIcon, DownloadIcon, InboxIcon, TagIcon, XIcon } from 'merki-icons';
import { useEffect, useState } from 'react';
import { categoryLabel, type SiteIcon } from '../data/icons';
import { clipboardSvg, downloadSvg, jsxSnippet, packageSvg } from '../lib/copy';
import { Construction } from './Construction';
import { CopyButton } from './CopyButton';
import { Icon } from './Icon';

export function Drawer({ icon, compact, onClose }: { icon: SiteIcon; compact: boolean; onClose: () => void }) {
  const [keylines, setKeylines] = useState(true);
  const [points, setPoints] = useState(false);
  // Phones: opened from the grid it's a short sheet; a direct visit shows everything.
  const [expanded, setExpanded] = useState(!compact);
  useEffect(() => setExpanded(!compact), [compact]);

  return (
    <>
      <div className="scrim" aria-hidden="true" onClick={onClose} />
      <aside className={`drawer${expanded ? ' expanded' : ''}`} aria-label={`${icon.name} icon`}>
        <header className="drawer-head">
          <div>
            <h2>{icon.name}</h2>
            <p>16 × 16 · {categoryLabel(icon.category)}</p>
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <XIcon size={16} />
          </button>
        </header>

        <div className="stage full-only">
          <Construction svg={icon.svg} size={260} keylines={keylines} points={points} handles={points} />
          <div className="stage-toggles">
            <button type="button" className="pill" aria-pressed={keylines} onClick={() => setKeylines((on) => !on)}>Keylines</button>
            <button type="button" className="pill" aria-pressed={points} onClick={() => setPoints((on) => !on)}>Points</button>
          </div>
        </div>
        <div className="stage compact-only">
          <Icon component={icon.component} size={120} />
        </div>

        <div className="sizes">
          {[16, 20, 24].map((s) => (
            <figure key={s}>
              <Icon component={icon.component} size={s} />
              <figcaption>{s}</figcaption>
            </figure>
          ))}
          <div className="swatch" role="group" aria-label="On the other theme">
            {[16, 20, 24].map((s) => (
              <Icon key={s} component={icon.component} size={s} />
            ))}
          </div>
        </div>

        <div className="context full-only" role="group" aria-label="In context">
          <div className="menu">
            <div className="menu-item"><InboxIcon /><span>Inbox</span></div>
            <div className="menu-item hover"><Icon component={icon.component} /><span>{icon.name}</span></div>
            <div className="menu-item"><TagIcon /><span>Labels</span></div>
          </div>
          <div className="context-col">
            <span className="ctx-btn"><Icon component={icon.component} />Action</span>
            <span className="ctx-input"><Icon component={icon.component} /><span>Search or type…</span></span>
          </div>
        </div>

        <div className="actions">
          <CopyButton className="action primary" text={clipboardSvg(icon.svg)} label="Copy SVG" icon={CopyIcon} />
          <CopyButton text={jsxSnippet(icon.component)} label="Copy JSX" icon={CodeIcon} />
          <button type="button" className="action" onClick={() => downloadSvg(icon.name, packageSvg(icon.svg))}>
            <DownloadIcon size={14} />
            <span>Download</span>
          </button>
        </div>

        <div className="meta">
          <span className="chip-cat">{categoryLabel(icon.category)}</span>
          {icon.tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>

        <button type="button" className="more ctl" onClick={() => setExpanded(true)}>All details</button>
      </aside>
    </>
  );
}
