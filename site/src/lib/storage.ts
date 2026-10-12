function store(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function safeGet(key: string): string | null {
  try {
    return store()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string): void {
  try {
    store()?.setItem(key, value);
  } catch {
    // Storage is blocked: the choice still holds for this page view.
  }
}
