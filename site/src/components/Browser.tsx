import { SearchIcon } from 'merki-icons';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { categories, icons, orderedIcons } from '../data/icons';
import { SIZES } from '../data/constants';
import { NAV_KEYS, columnsOf, moveInGroups, type NavKey } from '../lib/grid-nav';
import { usePrefs } from '../lib/prefs';
import { Link } from '../lib/router';
import { searchIcons } from '../lib/search';
import { Icon } from './Icon';

export interface BrowserProps {
  query: string;
  onQuery: (query: string) => void;
  /** The icon whose drawer is open, if any. */
  selected: string | null;
  onOpen: (name: string) => void;
  /** Arrow keys moved while a drawer is open: the drawer follows. */
  onMove: (name: string) => void;
}

export function Browser({ query, onQuery, selected, onOpen, onMove }: BrowserProps) {
  const { size, setSize } = usePrefs();
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(selected);
  useEffect(() => {
    if (selected) setActive(selected);
  }, [selected]);

  const groups = useMemo(() => {
    const hits = new Set(searchIcons(orderedIcons, query).map((icon) => icon.name));
    return categories
      .map((group) => ({ ...group, icons: group.icons.filter((icon) => hits.has(icon.name)) }))
      .filter((group) => group.icons.length > 0);
  }, [query]);

  // One tab stop for the whole grid (roving tabindex).
  const visible = groups.flatMap((group) => group.icons.map((icon) => icon.name));
  const tabStop = active && visible.includes(active) ? active : (visible[0] ?? null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable="true"]');
      const modified = event.ctrlKey || event.metaKey || event.altKey;
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing && !modified)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const onGridKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!NAV_KEYS.has(event.key) || event.altKey || event.metaKey || event.ctrlKey) return;
    const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-name]');
    if (!cell?.dataset.name) return;
    event.preventDefault();
    const next = moveInGroups(
      groups.map((group) => group.icons.map((icon) => icon.name)),
      cell.dataset.name,
      event.key as NavKey,
      columnsOf(cell.parentElement),
    );
    setActive(next);
    gridRef.current?.querySelector<HTMLElement>(`[data-name="${next}"]`)?.focus();
    if (selected && next !== selected) onMove(next);
  };

  return (
    <div className="browser">
      <div className="toolbar">
        <label className="search">
          <SearchIcon size={15} />
          <input
            ref={inputRef}
            type="search"
            aria-label="Search icons"
            placeholder={`Search ${icons.length} icons`}
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && query) {
                event.stopPropagation();
                onQuery('');
              }
            }}
          />
          <kbd aria-hidden="true">/</kbd>
        </label>
        <div className="seg" role="group" aria-label="Icon size">
          {SIZES.map((s) => (
            <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)}>
              {s}
            </button>
          ))}
        </div>
        <nav className="chips" aria-label="Categories">
          <Link to="/#icons">All</Link>
          {categories.map((group) => (
            <Link key={group.id} to={`/#cat-${group.id}`}>{group.label}</Link>
          ))}
        </nav>
      </div>

      <div ref={gridRef} onKeyDown={onGridKey}>
        {groups.length === 0 ? (
          <div className="empty">
            <p>No icons match “{query.trim()}”.</p>
            <button
              type="button"
              className="ctl"
              onClick={() => {
                onQuery('');
                inputRef.current?.focus();
              }}
            >
              Clear search
            </button>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.id} id={`cat-${group.id}`} className="cat" aria-labelledby={`cat-${group.id}-title`}>
              <h3 className="cat-h" id={`cat-${group.id}-title`}>
                {group.label} <span>{group.icons.length}</span>
              </h3>
              <div className="grid" data-size={size}>
                {group.icons.map((icon) => (
                  <button
                    key={icon.name}
                    type="button"
                    className="cell"
                    data-name={icon.name}
                    aria-label={icon.name}
                    aria-current={selected === icon.name ? 'true' : undefined}
                    tabIndex={icon.name === tabStop ? 0 : -1}
                    onFocus={() => setActive(icon.name)}
                    onClick={() => onOpen(icon.name)}
                  >
                    <Icon component={icon.component} size={size} />
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
