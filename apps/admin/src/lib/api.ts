import { clearStoredAuthTokens, getStoredAuthTokens, setStoredAuthTokens } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function refreshAccessToken() {
  const tokens = getStoredAuthTokens();
  if (!tokens?.refreshToken) {
    clearStoredAuthTokens();
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: tokens.refreshToken })
  });

  if (!response.ok) {
    clearStoredAuthTokens();
    return null;
  }

  const data = (await response.json()) as { accessToken?: string };
  if (typeof data.accessToken !== "string" || !data.accessToken) {
    clearStoredAuthTokens();
    return null;
  }

  setStoredAuthTokens({ accessToken: data.accessToken, refreshToken: tokens.refreshToken });
  return data.accessToken;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const tokens = getStoredAuthTokens();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (response.status === 401 && path !== "/api/auth/refresh") {
    const refreshedAccessToken = await refreshAccessToken();
    if (refreshedAccessToken) {
      const retry = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        credentials: "include",
        headers: {
          ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          Authorization: `Bearer ${refreshedAccessToken}`,
          ...(init?.headers ?? {})
        }
      });

      if (!retry.ok) {
        const message = await retry.text();
        throw new Error(message || `Request failed with ${retry.status}`);
      }

      if (retry.status === 204) {
        return undefined as T;
      }

      return retry.json() as Promise<T>;
    }
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
