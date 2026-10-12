import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';
import { SITE_URL } from './config';
import { iconByName, icons } from './data/icons';
import { allPaths, headFor, headTags, matchRoute } from './lib/routes';

export { SITE_URL };

/** Every page the build writes, in a stable order. /404 is added by prerender. */
export const paths = allPaths(icons.map((icon) => icon.name));

export function render(path: string): { html: string; head: string; status: number } {
  const route = matchRoute(path, iconByName);
  const html = renderToString(
    <StrictMode>
      <App initialPath={path} />
    </StrictMode>,
  );
  return {
    html,
    head: headTags(headFor(route, path, icons.length, SITE_URL)),
    status: route.kind === 'notfound' ? 404 : 200,
  };
}
