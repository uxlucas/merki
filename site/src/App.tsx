import { useEffect, useRef } from 'react';
import { SITE_URL } from './config';
import { iconByName, icons } from './data/icons';
import { RouterProvider, scrollToId, useRouter } from './lib/router';
import { headFor, matchRoute } from './lib/routes';
import { ChangelogPage } from './pages/Changelog';
import { GuidePage } from './pages/Guide';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';

function Shell() {
  const { path, hash, key } = useRouter();
  const route = matchRoute(path, iconByName);
  // Home and an open icon are the same page: moving between them keeps the scroll position.
  const page = route.kind === 'icon' ? 'home' : route.kind;
  const lastPage = useRef(page);

  useEffect(() => {
    if (hash) scrollToId(hash);
    else if (lastPage.current !== page) window.scrollTo(0, 0);
    lastPage.current = page;
    document.title = headFor(route, path, icons.length, SITE_URL).title;
    // Runs once per navigation; route, path and page all derive from it.
  }, [key]);

  switch (route.kind) {
    case 'home':
      return <Home openIcon={null} />;
    case 'icon':
      return <Home openIcon={route.name} />;
    case 'guide':
      return <GuidePage slug={route.slug} />;
    case 'changelog':
      return <ChangelogPage />;
    case 'notfound':
      return <NotFound missingIcon={route.missingIcon} />;
  }
}

export function App({ initialPath }: { initialPath: string }) {
  return (
    <RouterProvider initialPath={initialPath}>
      <Shell />
    </RouterProvider>
  );
}
