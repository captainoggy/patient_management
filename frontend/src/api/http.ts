import { apiUrl } from "./config";
import { todayIsoDateLocal } from "../utils/dateOfBirth";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Set when the API is cross-origin; `document.cookie` on the SPA host cannot read API cookies. */
let serverCsrfToken: string | null = null;

export function setCsrfFromServer(token: string | null): void {
  serverCsrfToken = token;
}

export function getCsrfToken(): string | null {
  if (serverCsrfToken) {
    return serverCsrfToken;
  }
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const SAFE = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Client-Calendar-Date", todayIsoDateLocal());
  if (!SAFE.has(method)) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers.set("X-CSRFToken", csrf);
    }
  }
  const res = await fetch(apiUrl(path), { ...init, headers, credentials: "include" });
  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  if (!res.ok) {
    throw new ApiError(`HTTP ${res.status}`, res.status, parsed);
  }
  return parsed as T;
}
