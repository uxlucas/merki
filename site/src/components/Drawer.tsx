import { CodeIcon, CopyIcon, DownloadIcon, InboxIcon, RefreshIcon, TagIcon, XIcon } from 'merki-icons';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { categoryLabel, type SiteIcon } from '../data/icons';
import { DEFAULT_LOOK, customSvg, downloadSvg, isDefaultLook, jsxSnippet, type Look } from '../lib/copy';
import { Construction } from './Construction';
import { CopyButton } from './CopyButton';
import { Icon } from './Icon';

const SWATCHES: Array<{ label: string; value: string | null }> = [
  { label: 'Default', value: null },
  { label: 'Grey', value: '#71717a' },
  { label: 'Red', value: '#e11d48' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Violet', value: '#7c3aed' },
];
const TABS = ['Preview', 'Construction', 'In context'] as const;
type Tab = (typeof TABS)[number];

export function Drawer({ icon, onClose }: { icon: SiteIcon; onClose: () => void }) {
  const id = useId();
  const [tab, setTab] = useState<Tab>('Preview');
  const [look, setLook] = useState<Look>(DEFAULT_LOOK);
  const [keylines, setKeylines] = useState(true);
  const [points, setPoints] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // WAI-ARIA tabs: arrows move and select, Home/End jump. No animation on switch.
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: TABS.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const wrapped = (next + TABS.length) % TABS.length;
    setTab(TABS[wrapped]);
    tabRefs.current[wrapped]?.focus();
  };

  const swatchKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const nextIndex = (index + step + SWATCHES.length) % SWATCHES.length;
    setLook((l) => ({ ...l, color: SWATCHES[nextIndex].value }));
    (event.currentTarget.parentElement?.children[nextIndex] as HTMLElement | undefined)?.focus();
  };

  return (
    <>
      <div className="scrim" aria-hidden="true" onClick={onClose} />
      <aside className="drawer" aria-label={`${icon.name} icon`}>
        <header className="drawer-head">
          <div>
            <p className="drawer-crumb">{categoryLabel(icon.category)}</p>
            <h2 className="drawer-name">{icon.name}</h2>
            <ul className="drawer-tags" aria-label="Tags">
              {icon.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <XIcon size={16} />
          </button>
        </header>

        <div className="stage">
          {tab === 'Preview' && (
            <div className="preview">
              <Icon component={icon.component} size={look.size} color={look.color ?? undefined} />
            </div>
          )}
          {tab === 'Construction' && (
            <>
              <Construction svg={icon.svg} size={196} keylines={keylines} points={points} handles={points} />
              <div className="stage-toggles">
                <button type="button" className="pill" aria-pressed={keylines} onClick={() => setKeylines((on) => !on)}>Keylines</button>
                <button type="button" className="pill" aria-pressed={points} onClick={() => setPoints((on) => !on)}>Points</button>
              </div>
            </>
          )}
          {tab === 'In context' && (
            <div className="context">
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
          )}
        </div>

        <div className="tabs" role="tablist" aria-label="View">
          {TABS.map((name, index) => (
            <button
              key={name}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${index}`}
              aria-selected={tab === name}
              aria-controls={`${id}-panel`}
              tabIndex={tab === name ? 0 : -1}
              onClick={() => setTab(name)}
              onKeyDown={(event) => onTabKey(event, index)}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="tab-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${TABS.indexOf(tab)}`}>
          {tab === 'Preview' && (
            <div className="look">
              <div className="swatches" role="radiogroup" aria-label="Colour">
                {SWATCHES.map((swatch, index) => (
                  <button
                    key={swatch.label}
                    type="button"
                    role="radio"
                    aria-label={swatch.label}
                    aria-checked={look.color === swatch.value}
                    tabIndex={look.color === swatch.value ? 0 : -1}
                    className="swatch-dot"
                    style={{ ['--c' as string]: swatch.value ?? 'var(--fg)' }}
                    onClick={() => setLook((l) => ({ ...l, color: swatch.value }))}
                    onKeyDown={(event) => swatchKey(event, index)}
                  />
                ))}
                <span className="hex">{look.color ? look.color.toUpperCase() : 'currentColor'}</span>
              </div>
              <label className="size-row">
                <span>Size</span>
                <input
                  type="range"
                  min={16}
                  max={64}
                  step={1}
                  value={look.size}
                  aria-label="Size"
                  onChange={(event) => setLook((l) => ({ ...l, size: Number(event.target.value) }))}
                />
                <b>{look.size}px</b>
              </label>
            </div>
          )}
          {tab === 'Construction' && <p className="tab-note">The 16px grid and the four keylines every icon is drawn on.</p>}
          {tab === 'In context' && <p className="tab-note">At 16px, where it will live: a menu row, a button, an input.</p>}
        </div>

        <div className="actions">
          <CopyButton className="action primary" text={customSvg(icon.svg, look).trimEnd()} label="Copy SVG" icon={CopyIcon} />
          <CopyButton text={jsxSnippet(icon.component, look)} label="Copy JSX" icon={CodeIcon} />
          <button type="button" className="action square" aria-label="Download" onClick={() => downloadSvg(icon.name, customSvg(icon.svg, look))}>
            <DownloadIcon size={14} />
          </button>
          {!isDefaultLook(look) && (
            <button type="button" className="action square" aria-label="Reset" onClick={() => setLook(DEFAULT_LOOK)}>
              <RefreshIcon size={14} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
