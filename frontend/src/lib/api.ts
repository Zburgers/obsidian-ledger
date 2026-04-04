const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  register: (data: { email: string; password: string; name?: string }) =>
    request<{ id: string; email: string; name: string | null; role: string; is_active: boolean }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; refresh_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  refresh: (refresh_token: string) =>
    request<{ access_token: string; token_type: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),

  me: (token: string) =>
    request<{ id: string; email: string; name: string | null; role: string; is_active: boolean }>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
