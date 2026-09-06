const TOKEN_KEY = "medflow_doctor_access";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  clinicIds: string[];
};

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(buildUrl(path), { ...init, headers, credentials: "include" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.message || "Request failed");
  }
  return body.data as T;
}
