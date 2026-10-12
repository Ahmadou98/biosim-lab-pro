import type { DashboardSummary, ReleaseResult, SimulationSnapshot } from './types';
const BASE = '/api';
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!res.ok) {
    let message = `Erreur serveur (${res.status})`;
    try { const body = await res.json(); message = body.error || body.message || message; } catch { /* non-JSON failure */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}
const post = (path: string, body?: unknown) => request<SimulationSnapshot>(path, { method: 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
export const api = {
  state: () => request<SimulationSnapshot>('/simulation/state'),
  dashboard: () => request<DashboardSummary>('/dashboard'),
  createBatch: (scenario: string) => post(`/simulation/new?scenario=${encodeURIComponent(scenario)}`),
  start: () => post('/simulation/start'),
  pause: () => post('/simulation/pause'),
  advance: () => post('/simulation/advance'),
  updateParameters: (body: { temperatureSetpointIndex: number; agitationSetpointIndex: number; gasTransferSetpointIndex: number }) => post('/simulation/parameters', body),
  runTest: (testId: string) => post('/quality-tests', { testId }),
  createDeviation: (body: { title: string; severity: string; action: string }) => post('/deviations', body),
  updateDeviation: (id: number, status: string) => request<SimulationSnapshot>(`/deviations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  review: (checks: boolean[], justification: string) => request<ReleaseResult>('/release-review', { method: 'POST', body: JSON.stringify({ checks, justification }) }),
};
