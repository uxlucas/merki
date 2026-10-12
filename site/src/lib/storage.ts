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

function session(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function safeSessionGet(key: string): string | null {
  try {
    return session()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function safeSessionSet(key: string, value: string): void {
  try {
    session()?.setItem(key, value);
  } catch {
    // Storage is blocked: fetch again next time.
  }
}
