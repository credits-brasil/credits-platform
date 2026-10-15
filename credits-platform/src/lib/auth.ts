const API_URL = import.meta.env.VITE_API_URL;

export const AUTH_TOKEN_KEY = "credits-platform-auth-token";
export const AUTH_REFRESH_TOKEN_KEY = "credits-platform-refresh-token";
export const AUTH_STORAGE_KEY = "credits-platform-authenticated";
export const AUTH_USER_KEY = "credits-platform-auth-user";

export function getStoredAuthTokens() {
  if (typeof window === "undefined") {
    return { accessToken: null as string | null, refreshToken: null as string | null };
  }

  return {
    accessToken: localStorage.getItem(AUTH_TOKEN_KEY),
    refreshToken: localStorage.getItem(AUTH_REFRESH_TOKEN_KEY),
  };
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export async function refreshUserSession(refreshToken: string) {
  const response = await fetch(`${API_URL}/api/auth/user/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Sessão expirada.");
  }

  const tokens = data?.tokens as { accessToken?: string; refreshToken?: string; expiresIn?: number } | undefined;
  if (!tokens?.accessToken || !tokens?.refreshToken) {
    throw new Error("Sessão expirada.");
  }

  localStorage.setItem(AUTH_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, tokens.refreshToken);
  localStorage.setItem(AUTH_STORAGE_KEY, "true");

  return tokens;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { accessToken, refreshToken } = getStoredAuthTokens();
  const headers = new Headers(init.headers || {});

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const firstResponse = await fetch(input, {
    ...init,
    headers,
  });

  if (firstResponse.status !== 401 || !refreshToken) {
    return firstResponse;
  }

  try {
    const refreshed = await refreshUserSession(refreshToken);
    const retryHeaders = new Headers(init.headers || {});
    retryHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`);

    return fetch(input, {
      ...init,
      headers: retryHeaders,
    });
  } catch {
    clearAuthSession();
    return firstResponse;
  }
}
