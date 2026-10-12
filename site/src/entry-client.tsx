import '@fontsource-variable/inter';
import './styles/index.css';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import { shouldHydrate } from './lib/hydrate';

const root = document.getElementById('root')!;
const path = window.location.pathname;
const initialPath = path + window.location.hash;

if (import.meta.env.DEV && path.replace(/\/$/, '') === '/lab') {
  // The review lab only exists in dev. In production /lab is a 404.
  void Promise.all([import('./lab/Lab'), import('virtual:merki-icons'), import('./lab/lab.css')]).then(
    ([{ Lab }, { default: labIcons }]) =>
      createRoot(root).render(
        <StrictMode>
          <Lab icons={labIcons} />
        </StrictMode>,
      ),
  );
} else {
  const app = (
    <StrictMode>
      <App initialPath={initialPath} />
    </StrictMode>
  );
  // Prerendered pages hydrate. Render from scratch over the bare dev template and over the shared
  // 404 page, which Vercel serves at any unknown path and so can differ from what this path renders.
  if (shouldHydrate(root)) hydrateRoot(root, app);
  else createRoot(root).render(app);
}
