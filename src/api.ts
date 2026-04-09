/* eslint-disable @typescript-eslint/no-explicit-any */
// Единственный URL backend-функции
const BASE = "https://functions.poehali.dev/49e90f24-9d75-43e2-913b-dc53dadeacfd";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
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