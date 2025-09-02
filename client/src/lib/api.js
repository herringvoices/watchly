const API_BASE = import.meta.env.VITE_API_BASE || 'https://localhost:5001/api';

export async function apiFetch(path, { method = 'GET', body, headers = {}, ...rest } = {}) {
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
    ...rest,
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { const data = await res.json(); if (data?.message) msg = data.message; } catch { /* ignore */ }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}
