import { CalendarIcon, XIcon } from 'merki-icons';
import type { ReactNode } from 'react';
import { CodeBlock } from '../components/CodeBlock';
import { Layout } from '../components/Layout';
import { GUIDE_PAGES, type GuideSlug } from '../lib/routes';

function Install() {
  return (
    <>
      <p>Merki ships as one package: the React components and the raw SVGs.</p>
      <CodeBlock label="npm" code="npm i merki-icons" />
      <CodeBlock label="pnpm" code="pnpm add merki-icons" />
      <CodeBlock label="yarn" code="yarn add merki-icons" />
      <CodeBlock label="bun" code="bun add merki-icons" />
      <p>It needs React 18 or newer. It's ESM only and tree-shakeable, so you ship only the icons you import.</p>
    </>
  );
}

function ReactGuide() {
  return (
    <>
      <CodeBlock code={"import { CalendarIcon } from 'merki-icons'\n\n<CalendarIcon />"} />
      <h2>Props</h2>
      <table className="props">
        <thead>
          <tr><th>Prop</th><th>Type</th><th>Default</th></tr>
        </thead>
        <tbody>
          <tr><td><code>size</code></td><td>number or CSS length</td><td><code>16</code></td></tr>
          <tr><td><code>color</code></td><td>string</td><td><code>currentColor</code></td></tr>
          <tr><td><code>absoluteStrokeWidth</code></td><td>boolean</td><td><code>false</code></td></tr>
          <tr><td><code>title</code></td><td>string</td><td>none</td></tr>
        </tbody>
      </table>
      <p>Every other SVG prop, <code>className</code> included, goes onto the <code>&lt;svg&gt;</code>. Refs are forwarded.</p>

      <h2>Size</h2>
      <div className="demo-row">
        {[16, 20, 24].map((s) => (
          <figure key={s}><CalendarIcon size={s} /><figcaption>{s}</figcaption></figure>
        ))}
      </div>
      <CodeBlock code={'<CalendarIcon size={20} />'} />

      <h2>Stroke</h2>
      <p>
        The set is tuned for 16 and 20. Bigger, the stroke scales with the icon and reads heavier. <code>absoluteStrokeWidth</code> keeps
        it at 1.5 screen pixels, which reads thinner. Pick per use.
      </p>
      <div className="demo-row">
        <figure><CalendarIcon size={32} /><figcaption>scaled</figcaption></figure>
        <figure><CalendarIcon size={32} absoluteStrokeWidth /><figcaption>absolute</figcaption></figure>
      </div>
      <CodeBlock code={'<CalendarIcon size={32} absoluteStrokeWidth />'} />

      <h2>Color</h2>
      <p>Icons use <code>currentColor</code>, so they follow the text color. <code>color</code> sets it directly; solid accents follow it too.</p>
      <CodeBlock code={'<CalendarIcon color="#e11d74" />'} />

      <h2>Server components</h2>
      <p>The components use no hooks or context, so they render in React Server Components as-is.</p>
    </>
  );
}

function Svg() {
  return (
    <>
      <p>Not on React? Every icon is a plain SVG that uses <code>currentColor</code>.</p>
      <ul>
        <li>Copy or download it from any icon's panel.</li>
        <li>Take it from the package: <code>merki-icons/svg/&lt;name&gt;.svg</code>.</li>
      </ul>
      <CodeBlock code={"import calendar from 'merki-icons/svg/calendar.svg?raw'"} label="Vite" />
      <p>Inline the SVG to keep <code>currentColor</code>. As an <code>&lt;img&gt;</code> it can't inherit the text color.</p>
    </>
  );
}

function Accessibility() {
  return (
    <>
      <p>Icons are decorative by default: <code>aria-hidden="true"</code> and <code>focusable="false"</code>.</p>
      <h2>Name an icon</h2>
      <p>When the icon is the only thing carrying meaning, give it a <code>title</code>. It gets <code>role="img"</code>, an <code>aria-label</code> and a <code>&lt;title&gt;</code>.</p>
      <CodeBlock code={'<CalendarIcon title="Due date" />'} />
      <h2>Icon-only buttons</h2>
      <p>Label the button, not the icon.</p>
      <div className="demo-row">
        <button type="button" className="icon-btn" aria-label="Close"><XIcon size={16} /></button>
      </div>
      <CodeBlock code={'<button aria-label="Close">\n  <XIcon />\n</button>'} />
    </>
  );
}

const CONTENT: Record<GuideSlug, () => ReactNode> = {
  install: Install,
  react: ReactGuide,
  svg: Svg,
  accessibility: Accessibility,
};

export function GuidePage({ slug }: { slug: GuideSlug }) {
  const page = GUIDE_PAGES.find((g) => g.slug === slug)!;
  const Body = CONTENT[slug];
  return (
    <Layout active={slug}>
      <article className="prose">
        <h1>{page.title}</h1>
        <Body />
      </article>
    </Layout>
  );
}
