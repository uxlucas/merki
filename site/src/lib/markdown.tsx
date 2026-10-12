import { createElement, type ReactNode } from 'react';

export type Block =
  | { type: 'h'; level: 1 | 2 | 3; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] };

/** Just enough Markdown for CHANGELOG.md: #–### headings, paragraphs, "- " lists. */
export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] | null = null;
  const flushPara = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join(' ') });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push({ type: 'ul', items: list });
    list = null;
  };

  for (const raw of source.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushPara();
      flushList();
      blocks.push({ type: 'h', level: heading[1].length as 1 | 2 | 3, text: heading[2] });
      continue;
    }
    const item = /^[-*]\s+(.*)$/.exec(line);
    if (item) {
      flushPara();
      (list ??= []).push(item[1]);
      continue;
    }
    if (list && /^\s+\S/.test(raw)) {
      list[list.length - 1] += ` ${line.trim()}`;
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushPara();
  flushList();
  return blocks;
}

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\)(?:\))?)/g;
const SAFE_HREF = /^(https?:\/\/|\/|#)/;

export function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const token = match[0];
    if (token.startsWith('`')) out.push(<code key={key++}>{token.slice(1, -1)}</code>);
    else if (token.startsWith('**')) out.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(token)!;
      out.push(SAFE_HREF.test(link[2]) ? <a key={key++} href={link[2]}>{link[1]}</a> : link[1]);
    }
    last = start + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  return (
    <>
      {parseMarkdown(source).map((block, i) => {
        if (block.type === 'h') return createElement(`h${block.level}`, { key: i }, renderInline(block.text));
        if (block.type === 'p') return <p key={i}>{renderInline(block.text)}</p>;
        return (
          <ul key={i}>
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item)}</li>
            ))}
          </ul>
        );
      })}
    </>
  );
}
