import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import icons from 'virtual:merki-icons';
import { Lab } from './lab/Lab';
import './lab/lab.css';

const isLab = window.location.pathname.replace(/\/$/, '') === '/lab';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isLab ? (
      <Lab icons={icons} />
    ) : (
      <main className="lab">
        <p className="muted">
          Merki. The site comes in a later plan. <a href="/lab">Open /lab</a>
        </p>
      </main>
    )}
  </StrictMode>,
);
