export type StoredAdminTokens = {
  accessToken: string;
  refreshToken: string;
};

const AUTH_STORAGE_KEY = "church-admin-auth";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredAuthTokens(): StoredAdminTokens | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredAdminTokens>;
    if (typeof parsed.accessToken !== "string" || typeof parsed.refreshToken !== "string") {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken
    };
  } catch {
    return null;
  }
}

export function setStoredAuthTokens(tokens: StoredAdminTokens) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearStoredAuthTokens() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function hasStoredAuthTokens() {
  return getStoredAuthTokens() !== null;
}
