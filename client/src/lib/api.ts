import type { Signal, Strategy, Settings, BalanceHistory, User } from "@shared/schema";

const API_BASE = "/api";

export async function fetchSignals(): Promise<Signal[]> {
  const res = await fetch(`${API_BASE}/signals`);
  if (!res.ok) throw new Error("Failed to fetch signals");
  return res.json();
}

export async function createSignal(signal: Omit<Signal, "id" | "userId" | "createdAt">): Promise<Signal> {
  const res = await fetch(`${API_BASE}/signals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(signal),
  });
  if (!res.ok) throw new Error("Failed to create signal");
  return res.json();
}

export async function updateSignalStatus(id: string, status: string): Promise<Signal> {
  const res = await fetch(`${API_BASE}/signals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update signal");
  return res.json();
}

export async function fetchStrategies(): Promise<Strategy[]> {
  const res = await fetch(`${API_BASE}/strategies`);
  if (!res.ok) throw new Error("Failed to fetch strategies");
  return res.json();
}

export async function updateStrategy(id: string, updates: Partial<Strategy>): Promise<Strategy> {
  const res = await fetch(`${API_BASE}/strategies/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update strategy");
  return res.json();
}

export async function fetchSettings(): Promise<Settings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

export async function fetchBalanceHistory(): Promise<BalanceHistory[]> {
  const res = await fetch(`${API_BASE}/balance-history`);
  if (!res.ok) throw new Error("Failed to fetch balance history");
  return res.json();
}

export async function fetchUser(): Promise<User> {
  const res = await fetch(`${API_BASE}/user`);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}
