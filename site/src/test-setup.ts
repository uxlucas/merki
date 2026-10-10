import { configure } from '@testing-library/react';

// /lab tests wait on async fetch state; 1s flaked once while the dev server was busy.
configure({ asyncUtilTimeout: 3000 });
