// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Link, RouterProvider, useRouter } from './router';

function Where() {
  const { path, hash, navigate } = useRouter();
  return (
    <div>
      <p data-testid="path">{path}</p>
      <p data-testid="hash">{hash}</p>
      <button onClick={() => navigate('/icons/calendar', { state: { fromGrid: true } })}>open</button>
      <button onClick={() => navigate('/icons/bell', { replace: true })}>swap</button>
      <Link to="/guide/react">guide</Link>
      <Link to="/changelog">same page</Link>
      <Link to="/#craft">craft</Link>
      <Link to="/changelog" target="_blank">blank</Link>
      <Link to="/changelog" download>save</Link>
    </div>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

describe('router', () => {
  it('starts at the initial path', () => {
    render(<RouterProvider initialPath="/changelog/"><Where /></RouterProvider>);
    expect(screen.getByTestId('path').textContent).toBe('/changelog');
  });

  it('pushes, replaces and keeps history state', () => {
    render(<RouterProvider initialPath="/"><Where /></RouterProvider>);
    const before = window.history.length;
    fireEvent.click(screen.getByText('open'));
    expect(window.location.pathname).toBe('/icons/calendar');
    expect(window.history.state).toEqual({ fromGrid: true });
    expect(window.history.length).toBe(before + 1);
    fireEvent.click(screen.getByText('swap'));
    expect(window.location.pathname).toBe('/icons/bell');
    expect(window.history.length).toBe(before + 1);
    expect(screen.getByTestId('path').textContent).toBe('/icons/bell');
  });

  it('follows the back button', () => {
    render(<RouterProvider initialPath="/"><Where /></RouterProvider>);
    fireEvent.click(screen.getByText('open'));
    window.history.replaceState(null, '', '/');
    act(() => window.dispatchEvent(new PopStateEvent('popstate')));
    expect(screen.getByTestId('path').textContent).toBe('/');
  });

  it('routes plain link clicks in-app and leaves modified clicks to the browser', () => {
    render(<RouterProvider initialPath="/"><Where /></RouterProvider>);
    const link = screen.getByText('guide');
    expect(link.getAttribute('href')).toBe('/guide/react');
    const modified = fireEvent.click(link, { metaKey: true });
    expect(modified).toBe(true); // default not prevented
    expect(screen.getByTestId('path').textContent).toBe('/');
    fireEvent.click(link);
    expect(screen.getByTestId('path').textContent).toBe('/guide/react');
  });

  it('keeps the hash of a link', () => {
    render(<RouterProvider initialPath="/guide/react"><Where /></RouterProvider>);
    fireEvent.click(screen.getByText('craft'));
    expect(screen.getByTestId('path').textContent).toBe('/');
    expect(screen.getByTestId('hash').textContent).toBe('craft');
  });

  it('scrolls to the top instead of pushing a duplicate entry when a link points at the current page', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    window.history.replaceState(null, '', '/changelog');
    render(<RouterProvider initialPath="/changelog"><Where /></RouterProvider>);
    const before = window.history.length;
    const same = screen.getByText('same page');
    expect(fireEvent.click(same)).toBe(false); // handled in-app
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    expect(window.history.length).toBe(before);
    expect(screen.getByTestId('path').textContent).toBe('/changelog');
    // A different page still pushes.
    fireEvent.click(screen.getByText('guide'));
    expect(window.history.length).toBe(before + 1);
  });

  it('leaves target and download links to the browser', () => {
    render(<RouterProvider initialPath="/"><Where /></RouterProvider>);
    expect(fireEvent.click(screen.getByText('blank'))).toBe(true);
    expect(fireEvent.click(screen.getByText('save'))).toBe(true);
    expect(screen.getByTestId('path').textContent).toBe('/');
  });
});
