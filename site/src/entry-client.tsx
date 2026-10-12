import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root')!;
const path = window.location.pathname;

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
      <App initialPath={path} />
    </StrictMode>
  );
  // Prerendered pages hydrate. The dev server serves the bare template, so render from scratch.
  if (root.firstElementChild) hydrateRoot(root, app);
  else createRoot(root).render(app);
}
