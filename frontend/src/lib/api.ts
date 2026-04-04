const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

let getToken: (() => string | null) | null = null;

export function setTokenGetter(fn: () => string | null) {
  getToken = fn;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init?.headers && typeof init.headers === "object" && !Array.isArray(init.headers)) {
    Object.assign(headers, init.headers);
  }
  const token = getToken?.();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
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

  me: () =>
    request<{ id: string; email: string; name: string | null; role: string; is_active: boolean }>("/auth/me"),

  listUsers: () =>
    request<{ items: Array<{ id: string; email: string; name: string | null; role: string; is_active: boolean; is_deleted: boolean }>; total: number; page: number; page_size: number }>("/users"),

  createUser: (data: { email: string; password: string; name?: string; role?: string }) =>
    request<{ id: string; email: string; name: string | null; role: string; is_active: boolean }>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, data: { name?: string; role?: string; is_active?: boolean }) =>
    request<{ id: string; email: string; name: string | null; role: string; is_active: boolean }>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteUser: (id: string) =>
    request<void>(`/users/${id}`, { method: "DELETE" }),
};
