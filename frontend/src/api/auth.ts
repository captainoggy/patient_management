import { apiUrl } from "./config";
import { apiFetch, ApiError, getCsrfToken, setCsrfFromServer } from "./http";

export type ClinicSummary = {
  id: number;
  name: string;
  slug: string;
};

export type SessionResponse =
  | { authenticated: true; clinic: ClinicSummary; csrf: string }
  | { authenticated: false; csrf: string };

export type LoginResponse = {
  clinic: ClinicSummary;
  csrf: string;
};

export async function fetchSession(): Promise<SessionResponse> {
  const s = await apiFetch<SessionResponse>("/v1/auth/session/");
  setCsrfFromServer(s.csrf);
  return s;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const csrf = getCsrfToken();
  if (csrf) {
    headers.set("X-CSRFToken", csrf);
  }
  const res = await fetch(apiUrl("/v1/auth/login/"), {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
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
  const body = parsed as LoginResponse;
  if (body.csrf) {
    setCsrfFromServer(body.csrf);
  }
  return body;
}

export async function logout(): Promise<void> {
  await apiFetch<null>("/v1/auth/logout/", { method: "POST" });
}
