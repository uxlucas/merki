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

  it('orders the category chips canonically, not alphabetically', () => {
    const icons = [icon('calendar', 'objects'), icon('home', 'navigation')];
    render(<Lab icons={icons} fetchImpl={vi.fn(async () => reply({})) as unknown as typeof fetch} />);

    const chips = within(screen.getByRole('navigation', { name: 'Categories' })).getAllByRole('button');
    expect(chips.map((chip) => chip.firstChild?.textContent?.trim())).toEqual(['All', 'navigation', 'objects']);
  });

  it('puts billing after objects and unknown or uncategorized chips last', () => {
    const icons = [
      { ...icon('a', 'billing') },
      { ...icon('b', 'zzz') },
      { name: 'c', svg, meta: null },
      icon('d', 'objects'),
    ];
    render(<Lab icons={icons} fetchImpl={vi.fn(async () => reply({})) as unknown as typeof fetch} />);

    const chips = within(screen.getByRole('navigation', { name: 'Categories' })).getAllByRole('button');
    expect(chips.map((chip) => chip.firstChild?.textContent?.trim())).toEqual([
      'All',
      'objects',
      'billing',
      'zzz',
      'uncategorized',
    ]);
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

  it('shows the real reason when the dev server refuses a broken review file', async () => {
    const broken = {
      ok: false,
      status: 500,
      json: async () => ({ error: 'icons/_review.json is unreadable, fix it by hand: Unexpected end' }),
    } as Response;
    render(<Lab icons={ICONS} fetchImpl={vi.fn(async () => broken) as unknown as typeof fetch} />);
    fireEvent.click(screen.getByRole('button', { name: 'home at 16px' }));

    expect(await screen.findByText(/unreadable, fix it by hand/)).toBeTruthy();
    expect(screen.queryByText(/only work in the dev server/)).toBeNull();
  });

  it('shows the server reason when a save is rejected and keeps the typed note', async () => {
    const rejected = { ok: false, status: 400, json: async () => ({ error: 'invalid status: maybe' }) } as Response;
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => (init?.method === 'POST' ? rejected : reply({})));
    render(<Lab icons={ICONS} fetchImpl={fetchMock as unknown as typeof fetch} />);

    fireEvent.click(screen.getByRole('button', { name: 'home at 16px' }));
    const note = (await screen.findByLabelText('Note')) as HTMLTextAreaElement;
    fireEvent.change(note, { target: { value: 'too wide' } });
    fireEvent.click(screen.getByRole('button', { name: 'Needs work' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/Couldn't save: invalid status: maybe/);
    expect(note.value).toBe('too wide');
  });

  it('saves a typed note when the field loses focus, keeping the current status', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? reply({ home: { status: 'ok', note: 'door feels narrow', updatedAt: 'now' } })
        : reply({ home: { status: 'ok', note: '', updatedAt: 'then' } }),
    );
    render(<Lab icons={ICONS} fetchImpl={fetchMock as unknown as typeof fetch} />);

    fireEvent.click(screen.getByRole('button', { name: 'home at 16px' }));
    const field = await screen.findByLabelText('Note');
    fireEvent.change(field, { target: { value: 'door feels narrow' } });
    fireEvent.blur(field);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/__lab/review',
        expect.objectContaining({ body: JSON.stringify({ name: 'home', status: 'ok', note: 'door feels narrow' }) }),
      ),
    );
  });

  it('marks a new note as needs work when the icon had no review yet, and skips unchanged notes', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'POST' ? reply({ home: { status: 'needs-work', note: 'x', updatedAt: 'now' } }) : reply({}),
    );
    render(<Lab icons={ICONS} fetchImpl={fetchMock as unknown as typeof fetch} />);

    fireEvent.click(screen.getByRole('button', { name: 'home at 16px' }));
    const field = await screen.findByLabelText('Note');
    fireEvent.blur(field);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.change(field, { target: { value: 'x' } });
    fireEvent.blur(field);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/__lab/review',
        expect.objectContaining({ body: JSON.stringify({ name: 'home', status: 'needs-work', note: 'x' }) }),
      ),
    );
  });

  it('says what to do when there are no icons yet', () => {
    render(<Lab icons={[]} fetchImpl={vi.fn(async () => reply({})) as unknown as typeof fetch} />);
    expect(screen.getByText(/No icons yet/)).toBeTruthy();
  });

  it('filters every section by category', async () => {
    render(<Lab icons={ICONS} fetchImpl={vi.fn(async () => reply({})) as unknown as typeof fetch} />);

    fireEvent.click(screen.getByRole('button', { name: 'objects 1' }));

    expect(screen.getAllByRole('button', { name: / at 16px$/ })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'calendar at 16px' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'home at 16px' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'All 4' }));
    expect(screen.getAllByRole('button', { name: / at 16px$/ })).toHaveLength(4);
  });

  it('keeps compare and review in a side panel', async () => {
    const { container } = render(<Lab icons={ICONS} fetchImpl={vi.fn(async () => reply({})) as unknown as typeof fetch} />);

    fireEvent.click(screen.getByRole('button', { name: 'home at 16px' }));

    const aside = container.querySelector('aside.lab-aside');
    expect(aside).not.toBeNull();
    expect(aside!.querySelector('[aria-label="Compare home"]')).not.toBeNull();
    expect(aside!.querySelector('[aria-label="Review home"]')).not.toBeNull();
  });

  it('compares against the whole set even when filtered', async () => {
    render(<Lab icons={ICONS} fetchImpl={vi.fn(async () => reply({})) as unknown as typeof fetch} />);

    fireEvent.click(screen.getByRole('button', { name: 'navigation 3' }));
    fireEvent.click(screen.getByRole('button', { name: 'home at 16px' }));

    const compare = screen.getByRole('region', { name: 'Compare home' });
    expect(within(compare).getAllByText('calendar')).toHaveLength(2);
  });
});
