import { configure } from '@testing-library/react';

// /lab tests wait on async fetch state; 1s flaked once while the dev server was busy.
configure({ asyncUtilTimeout: 3000 });

// No test talks to the network: fetch rejects unless a test stubs it (vi.stubGlobal('fetch', …)).
// Plain assignment, not vi.stubGlobal, so a test's vi.unstubAllGlobals() can't bring the real fetch back.
globalThis.fetch = (async () => {
  throw new Error('network is disabled in tests');
}) as typeof fetch;
