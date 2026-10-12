import { Layout } from '../components/Layout';
import { GUIDE_PAGES, type GuideSlug } from '../lib/routes';

export function GuidePage({ slug }: { slug: GuideSlug }) {
  const page = GUIDE_PAGES.find((g) => g.slug === slug)!;
  return (
    <Layout active={slug}>
      <article className="prose">
        <h1>{page.title}</h1>
      </article>
    </Layout>
  );
}
