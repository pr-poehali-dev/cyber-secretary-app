/* eslint-disable @typescript-eslint/no-explicit-any */
// URL backend-функций
const BASE = "https://functions.poehali.dev/49e90f24-9d75-43e2-913b-dc53dadeacfd";
const BILLING_BASE = "https://functions.poehali.dev/dbb5e1ba-a1e9-4938-8746-f96ad8f8de53";

// Retry при сетевых ошибках (cold start): 3 попытки с задержкой 1.5s
async function request<T>(path: string, options?: RequestInit, attempt = 0): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${path} — ${text}`);
    }
    return res.json();
  } catch (err: any) {
    // Повторяем только при сетевых ошибках (Failed to fetch), не при HTTP-ошибках
    if (attempt < 3 && err?.message?.includes("fetch")) {
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      return request<T>(path, options, attempt + 1);
    }
    throw err;
  }
}

// ── Clients ──────────────────────────────────────────────────────────────────

export function fetchClients() {
  return request<any[]>("/clients");
}

export function createClient(data: Record<string, any>) {
  return request<any>("/clients", { method: "POST", body: JSON.stringify(data) });
}

export function updateClient(id: number, data: Record<string, any>) {
  return request<any>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function addClientHistory(clientId: number, note: string, eventDate: string) {
  return request<any>(`/clients/${clientId}/history`, {
    method: "POST",
    body: JSON.stringify({ note, eventDate }),
  });
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export function fetchTasks(date?: string) {
  const qs = date ? `?date=${date}` : "";
  return request<any[]>(`/tasks${qs}`);
}

export function createTask(data: Record<string, any>) {
  return request<any>("/tasks", { method: "POST", body: JSON.stringify(data) });
}

export function patchTaskDone(id: number, done: boolean) {
  return request<any>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ done }) });
}

// ── Investigations ────────────────────────────────────────────────────────────

export function fetchInvestigations() {
  return request<any[]>("/investigations");
}

export function fetchInvestigationsByClient(clientName: string) {
  return request<any[]>(`/investigations?client=${encodeURIComponent(clientName)}`);
}

export function createInvestigation(data: Record<string, any>) {
  return request<any>("/investigations", { method: "POST", body: JSON.stringify(data) });
}

export function patchInvestigationDone(id: number, done: boolean) {
  return request<any>(`/investigations/${id}`, { method: "PATCH", body: JSON.stringify({ done }) });
}

// ── Deadlines ─────────────────────────────────────────────────────────────────

export function fetchDeadlines() {
  return request<any[]>("/deadlines");
}

export function createDeadline(data: Record<string, any>) {
  return request<any>("/deadlines", { method: "POST", body: JSON.stringify(data) });
}

// ── Типы следственных действий ────────────────────────────────────────────────

export interface InvestigationType {
  id: number;
  name: string;
  rate: number;
  sort_order: number;
}

export function fetchInvestigationTypes() {
  return request<InvestigationType[]>("/investigation-types");
}

export function createInvestigationType(data: { name: string; rate: number; sort_order?: number }) {
  return request<InvestigationType>("/investigation-types", { method: "POST", body: JSON.stringify(data) });
}

export function updateInvestigationType(id: number, data: { name: string; rate: number; sort_order?: number }) {
  return request<InvestigationType>(`/investigation-types/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteInvestigationType(id: number) {
  return request<any>(`/investigation-types/${id}`, { method: "DELETE" });
}

// ── Billing ───────────────────────────────────────────────────────────────────

async function billingRequest<T>(path: string, options?: RequestInit, attempt = 0): Promise<T> {
  const token = localStorage.getItem("lexdesk_token") ?? "";
  try {
    const r = await fetch(`${BILLING_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...options,
    });
    return r.json();
  } catch (err: any) {
    if (attempt < 3 && err?.message?.includes("fetch")) {
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      return billingRequest<T>(path, options, attempt + 1);
    }
    throw err;
  }
}

export function fetchSubscriptionStatus() {
  return billingRequest<any>("/");
}

export function fetchBillingSettings() {
  return billingRequest<any>("/settings");
}

export function submitPaymentRequest(comment: string) {
  return billingRequest<any>("/request", { method: "POST", body: JSON.stringify({ comment }) });
}

// Admin
export function adminFetchUsers() {
  return billingRequest<any[]>("/admin/users");
}

export function adminUpdateUser(id: number, data: Record<string, any>) {
  return billingRequest<any>(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function adminFetchSettings() {
  return billingRequest<any>("/admin/settings");
}

export function adminUpdateSettings(data: Record<string, any>) {
  return billingRequest<any>("/admin/settings", { method: "PUT", body: JSON.stringify(data) });
}