// @vitest-environment jsdom
import { StrictMode, act } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { render } from './entry-server';
import { shouldHydrate } from './lib/hydrate';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
  delete document.documentElement.dataset.theme;
  vi.restoreAllMocks();
});

function mount(path: string) {
  window.localStorage.setItem('merki-size', '24');
  window.localStorage.setItem('merki-theme', 'dark');
  document.documentElement.dataset.theme = 'dark';
  window.history.replaceState(null, '', path);

  const container = document.createElement('div');
  container.innerHTML = render(path).html;
  document.body.append(container);
  return container;
}

describe('hydration', () => {
  it.each(['/', '/icons/calendar', '/guide/react', '/changelog'])('hydrates %s without mismatches, even with stored prefs', async (path) => {
    const container = mount(path);
    expect(shouldHydrate(container)).toBe(true);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const recoverable = vi.fn();

    let root: Root | undefined;
    await act(async () => {
      root = hydrateRoot(
        container,
        <StrictMode>
          <App initialPath={path} />
        </StrictMode>,
        { onRecoverableError: recoverable },
      );
    });

    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    if (path === '/') expect(container.querySelector('.grid')?.getAttribute('data-size')).toBe('24');

    await act(async () => root?.unmount());
    container.remove();
  });

  it('leaves the shared 404 page to a fresh client render instead of hydrating it', () => {
    const container = mount('/icons/nope');
    expect(container.querySelector('[data-notfound]')).not.toBeNull();
    expect(shouldHydrate(container)).toBe(false);
    container.remove();
  });
});
