import type { DashboardSummary, ReleaseResult, SimulationSnapshot } from './types';

const BASE = '/api';
const CLIENT_ID_STORAGE_KEY = 'biosim-lab.client-id';

function createUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // UUID v4 fallback for older browsers without crypto.randomUUID().
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === 'x' ? value : (value & 0x3) | 0x8).toString(16);
  });
}

function browserClientId(): string {
  if (typeof window === 'undefined') return createUuid();

  try {
    const saved = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (saved && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved)) {
      return saved;
    }
    const generated = createUuid();
    window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    // Private browsing settings can block localStorage; the session still works until reload.
    return createUuid();
  }
}

// A browser-scoped workspace identifier, not a login credential.
// Full user authentication and role-based authorization are required before commercial release.
const CLIENT_ID = browserClientId();

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('X-Client-Id', CLIENT_ID);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = `Erreur serveur (${res.status})`;
    try {
      const body = await res.json();
      message = body.error || body.message || message;
    } catch { /* non-JSON failure */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

const post = (path: string, body?: unknown) => request<SimulationSnapshot>(path, {
  method: 'POST',
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

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
  updateDeviation: (id: number, status: string) => request<SimulationSnapshot>(`/deviations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  review: (checks: boolean[], justification: string) => request<ReleaseResult>('/release-review', {
    method: 'POST',
    body: JSON.stringify({ checks, justification }),
  }),
};
