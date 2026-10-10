// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Lab } from './Lab';
import type { LabIcon } from './types';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M2 2h12"/></svg>';
const icon = (name: string, category: string): LabIcon => ({ name, svg, meta: { category, tags: [], aliases: [] } });
const ICONS = [icon('home', 'navigation'), icon('inbox', 'navigation'), icon('search', 'navigation'), icon('calendar', 'objects')];

const reply = (data: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => data }) as Response;

afterEach(cleanup);

describe('Lab', () => {
  it('shows every icon at 16, 20 and 24', async () => {
    const fetchMock = vi.fn(async () => reply({}));
    render(<Lab icons={ICONS} fetchImpl={fetchMock as unknown as typeof fetch} />);

    for (const size of [16, 20, 24]) {
      expect(screen.getAllByRole('button', { name: new RegExp(` at ${size}px$`) })).toHaveLength(4);
    }
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/__lab/review'));
  });

  it('opens compare with the same category plus the reference icons, each once', async () => {
    render(<Lab icons={ICONS} fetchImpl={vi.fn(async () => reply({})) as unknown as typeof fetch} />);

    fireEvent.click(screen.getByRole('button', { name: 'home at 16px' }));

    const compare = screen.getByRole('region', { name: 'Compare home' });
    for (const name of ['home', 'inbox', 'search', 'calendar']) {
      expect(within(compare).getAllByText(name)).toHaveLength(2);
    }
  });

  it('saves a review note through the dev endpoint', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? reply({ home: { status: 'needs-work', note: 'too wide', updatedAt: 'now' } })
        : reply({}),
    );
    render(<Lab icons={ICONS} fetchImpl={fetchMock as unknown as typeof fetch} />);

    fireEvent.click(screen.getByRole('button', { name: 'home at 16px' }));
    fireEvent.change(await screen.findByLabelText('Note'), { target: { value: 'too wide' } });
    fireEvent.click(screen.getByRole('button', { name: 'Needs work' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/__lab/review',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'home', status: 'needs-work', note: 'too wide' }),
        }),
      ),
    );
    expect(await screen.findByText(/1 need work/)).toBeTruthy();
  });

  it('explains that notes need the dev server when the endpoint is missing', async () => {
    render(<Lab icons={ICONS} fetchImpl={vi.fn(async () => reply({}, false)) as unknown as typeof fetch} />);
    fireEvent.click(screen.getByRole('button', { name: 'home at 16px' }));
    expect(await screen.findByText(/only work in the dev server/)).toBeTruthy();
  });

  it('says what to do when there are no icons yet', () => {
    render(<Lab icons={[]} fetchImpl={vi.fn(async () => reply({})) as unknown as typeof fetch} />);
    expect(screen.getByText(/No icons yet/)).toBeTruthy();
  });
});
