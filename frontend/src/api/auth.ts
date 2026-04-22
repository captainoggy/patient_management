import { apiUrl } from "./config";
import { apiFetch, ApiError, getCsrfToken } from "./http";

export type ClinicSummary = {
  id: number;
  name: string;
  slug: string;
};

export type SessionResponse =
  | { authenticated: true; clinic: ClinicSummary }
  | { authenticated: false };

export type LoginResponse = {
  clinic: ClinicSummary;
};

export async function fetchSession(): Promise<SessionResponse> {
  return apiFetch<SessionResponse>("/v1/auth/session/");
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
  return parsed as LoginResponse;
}

export async function logout(): Promise<void> {
  await apiFetch<null>("/v1/auth/logout/", { method: "POST" });
}
