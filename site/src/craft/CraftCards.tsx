import { BellIcon } from 'merki-icons';
import { useMemo, useState, type ReactNode } from 'react';
import { Construction } from '../components/Construction';
import { Icon } from '../components/Icon';
import { iconByName } from '../data/icons';
import { iconPoints } from '../lib/points';
import type { CraftSlug } from './topics';

const get = (name: string) => {
  const icon = iconByName.get(name);
  if (!icon) throw new Error(`craft cards need the ${name} icon`);
  return icon;
};

function CraftCard({ slug, title, line, stage, controls }: { slug: CraftSlug; title: string; line: string; stage: ReactNode; controls?: ReactNode }) {
  return (
    <article className="cc" id={`craft-${slug}`} aria-labelledby={`craft-${slug}-title`}>
      <div className="cc-stage">
        {stage}
        {controls && <div className="cc-ctrls">{controls}</div>}
      </div>
      <div className="cc-foot">
        <div>
          <h3 id={`craft-${slug}-title`}>{title}</h3>
          <p>{line}</p>
        </div>
        <span className="soon">Article soon</span>
      </div>
    </article>
  );
}

const KEYLINE_ICONS = ['calendar', 'settings', 'bell', 'user', 'inbox'];

function Keylines() {
  const [name, setName] = useState('calendar');
  return (
    <CraftCard
      slug="keylines"
      title="Keylines"
      line="Four shapes under every icon. Hover to see them."
      stage={<Construction svg={get(name).svg} size={170} keylines={false} className="kl-reveal" />}
      controls={KEYLINE_ICONS.map((n) => (
        <button key={n} type="button" className="ctl" aria-label={n} aria-pressed={n === name} onClick={() => setName(n)}>
          <Icon component={get(n).component} />
        </button>
      ))}
    />
  );
}

const px = (n: number) => `${Number(n.toFixed(2))}px`;

function OneStroke() {
  const [size, setSize] = useState(32);
  const [absolute, setAbsolute] = useState(false);
  const stroke = absolute ? 1.5 : (1.5 * size) / 16;
  return (
    <CraftCard
      slug="one-stroke"
      title="One stroke"
      line="Tuned for 16 and 20. Bigger, the stroke scales with the icon, or you pin it at 1.5."
      stage={
        <div className="st">
          <div className="st-icon"><BellIcon size={size} absoluteStrokeWidth={absolute} /></div>
          <p className="readout">{size}px · stroke <b>{px(stroke)}</b></p>
        </div>
      }
      controls={
        <>
          <input type="range" min={16} max={64} step={1} value={size} aria-label="Icon size" onChange={(e) => setSize(Number(e.target.value))} />
          <button type="button" className="ctl" aria-pressed={absolute} onClick={() => setAbsolute((on) => !on)}>
            {absolute ? 'absolute' : 'scaled'}
          </button>
        </>
      }
    />
  );
}

function LooksRight() {
  const [byEye, setByEye] = useState(false);
  return (
    <CraftCard
      slug="looks-right"
      title="Looks right"
      line="A circle drawn the same size as a square reads smaller."
      stage={
        <div className="lr">
          <svg viewBox="0 0 34 16" width={204} height={96} aria-hidden="true">
            <line className="lr-guide" x1={0} y1={2.25} x2={34} y2={2.25} />
            <line className="lr-guide" x1={0} y1={13.75} x2={34} y2={13.75} />
            <rect className="lr-shape" x={1.25} y={2.25} width={11.5} height={11.5} rx={2} />
            <circle className="lr-shape lr-circle" cx={25} cy={8} r={byEye ? 6 : 5.75} />
          </svg>
          <p className="readout">{byEye ? 'Equal by eye: circle 12, square 11.5' : 'Equal on paper: 11.5 and 11.5'}</p>
        </div>
      }
      controls={
        <>
          <button type="button" className="ctl" aria-pressed={!byEye} onClick={() => setByEye(false)}>On paper</button>
          <button type="button" className="ctl" aria-pressed={byEye} onClick={() => setByEye(true)}>By eye</button>
        </>
      }
    />
  );
}

const SOLID_ICONS = ['user', 'calendar', 'flag', 'tag', 'priority-high', 'circle-check', 'lock', 'thumbs-up'];

function SolidAccents() {
  const [on, setOn] = useState(true);
  return (
    <CraftCard
      slug="solid-accents"
      title="Solid accents"
      line="One solid part per icon gives it weight at 16px."
      stage={
        <div className={`solid${on ? '' : ' off'}`}>
          {SOLID_ICONS.map((n) => (
            <span key={n}><Icon component={get(n).component} size={28} /></span>
          ))}
        </div>
      }
      controls={
        <button type="button" className="ctl" aria-pressed={on} onClick={() => setOn((v) => !v)}>
          {on ? 'Accents on' : 'Accents off'}
        </button>
      }
    />
  );
}

const MENU = [
  { icon: 'inbox', label: 'Inbox', keys: 'G I' },
  { icon: 'user-arrow', label: 'Assign to…', keys: 'A' },
  { icon: 'calendar', label: 'Due date', keys: 'D' },
  { icon: 'tag', label: 'Labels', keys: 'L' },
  { icon: 'archive', label: 'Archive', keys: 'E' },
];

function InContext() {
  const [dark, setDark] = useState(false);
  return (
    <CraftCard
      slug="in-context"
      title="In context"
      line="Made for menus, not posters."
      stage={
        <div className="ctx-wrap" data-theme={dark ? 'dark' : 'light'}>
          <div className="menu">
            {MENU.map((item) => (
              <div key={item.label} className={`menu-item${item.icon === 'calendar' ? ' hover' : ''}`}>
                <Icon component={get(item.icon).component} />
                <span>{item.label}</span>
                <kbd>{item.keys}</kbd>
              </div>
            ))}
          </div>
        </div>
      }
      controls={
        <>
          <button type="button" className="ctl" aria-pressed={!dark} onClick={() => setDark(false)}>Light</button>
          <button type="button" className="ctl" aria-pressed={dark} onClick={() => setDark(true)}>Dark</button>
        </>
      }
    />
  );
}

function Points() {
  const heart = get('heart');
  const count = useMemo(() => iconPoints(heart.svg).anchors.length, [heart.svg]);
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  return (
    <CraftCard
      slug="points"
      title="Points"
      line={`Every anchor on a quarter-pixel grid. ${count} on heart.`}
      stage={
        <div className="pt" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          <Construction svg={heart.svg} size={210} keylines={false} points handles={pinned || hover} />
        </div>
      }
      controls={
        <button type="button" className="ctl" aria-pressed={pinned} onClick={() => setPinned((v) => !v)}>Show handles</button>
      }
    />
  );
}

export function CraftCards() {
  return (
    <div className="craft-grid">
      <Keylines />
      <OneStroke />
      <LooksRight />
      <SolidAccents />
      <InContext />
      <Points />
    </div>
  );
}
