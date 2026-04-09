// Управление авторизацией: токен, пользователь, API-запросы

const AUTH_URL = "https://functions.poehali.dev/efa3d0ba-df32-43e8-b802-a8c4e08bb9d4";
const TOKEN_KEY = "lexdesk_token";

// ── Хранение токена ──────────────────────────────────────────────────────────

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

// ── Тип пользователя ─────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  full_name: string;
  notify_email: string;
  notify_days_before: number[];
}

// ── Запросы к backend ────────────────────────────────────────────────────────

async function authRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${AUTH_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

export async function apiRegister(
  email: string,
  password: string,
  fullName: string
): Promise<User> {
  const data = await authRequest<{ token: string; user: User }>("/register", {
    method: "POST",
    body: JSON.stringify({ email, password, fullName }),
  });
  setToken(data.token);
  return data.user;
}

export async function apiLogin(
  email: string,
  password: string
): Promise<User> {
  const data = await authRequest<{ token: string; user: User }>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
}

export async function apiGetMe(): Promise<User> {
  const data = await authRequest<{ user: User }>("/me");
  return data.user;
}

export async function apiUpdateMe(updates: {
  fullName?: string;
  notifyEmail?: string;
  notifyDaysBefore?: number[];
  oldPassword?: string;
  newPassword?: string;
}): Promise<User> {
  const data = await authRequest<{ user: User }>("/me", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return data.user;
}

export async function apiLogout(): Promise<void> {
  const token = getToken();
  if (!token) return;
  try {
    await authRequest("/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}
