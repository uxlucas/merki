import changelog from '../../../CHANGELOG.md?raw';
import { Layout } from '../components/Layout';
import { Markdown } from '../lib/markdown';

export function ChangelogPage() {
  return (
    <Layout active="changelog">
      <article className="prose">
        <Markdown source={changelog} />
      </article>
    </Layout>
  );
}
