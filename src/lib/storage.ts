// localStorage can throw (private mode, storage disabled); treat it as a convenience only.

export function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function writeFlag(key: string, value: boolean) {
  try {
    if (value) window.localStorage.setItem(key, '1');
    else window.localStorage.removeItem(key);
  } catch {
    // Ignore: the flag just won't be remembered.
  }
}

export function readString(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore: the value just won't be remembered.
  }
}
