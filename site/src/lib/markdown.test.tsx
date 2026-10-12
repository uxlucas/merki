import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Markdown, parseMarkdown } from './markdown';

describe('markdown', () => {
  it('reads headings, paragraphs and lists', () => {
    expect(parseMarkdown('# A\n\nOne\ntwo\n\n- x\n- y\n  more\n\n## B')).toEqual([
      { type: 'h', level: 1, text: 'A' },
      { type: 'p', text: 'One two' },
      { type: 'ul', items: ['x', 'y more'] },
      { type: 'h', level: 2, text: 'B' },
    ]);
  });

  it('renders code, bold and safe links, and drops unsafe links to text', () => {
    const html = renderToStaticMarkup(<Markdown source={'Use `x` **now**: [docs](/guide/react) [bad](javascript:alert(1))'} />);
    expect(html).toBe('<p>Use <code>x</code> <strong>now</strong>: <a href="/guide/react">docs</a> bad</p>');
  });

  it('escapes HTML in the source', () => {
    expect(renderToStaticMarkup(<Markdown source="<script>x</script>" />)).toBe('<p>&lt;script&gt;x&lt;/script&gt;</p>');
  });

  it('handles Windows line endings', () => {
    expect(parseMarkdown('# A\r\n\r\nB')).toEqual([{ type: 'h', level: 1, text: 'A' }, { type: 'p', text: 'B' }]);
  });
});
