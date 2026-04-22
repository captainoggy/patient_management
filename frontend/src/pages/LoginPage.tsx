import { FormEvent, useState } from "react";

import { login } from "../api/auth";
import { ApiError } from "../api/http";

type Props = {
  onAuthed: (clinic: import("../api/auth").ClinicSummary) => void;
};

export function LoginPage({ onAuthed }: Props) {
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo12345");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(username, password);
      onAuthed(res.clinic);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { detail?: string };
        setError(body?.detail ?? err.message);
      } else {
        setError("Sign-in failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card panel stack" style={{ padding: "2rem 1.75rem" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "1.5rem" }}>
            Patient Management
          </h1>
          <p className="page-subtitle">Sign in to your clinic workspace.</p>
        </div>
        <form className="stack" onSubmit={onSubmit}>
          <label className="field">
            Username
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="field">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          ) : null}
          <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="muted" style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.5 }}>
          Local demo: <strong style={{ color: "var(--text-secondary)" }}>demo</strong> /{" "}
          <strong style={{ color: "var(--text-secondary)" }}>demo12345</strong>
        </p>
      </div>
    </div>
  );
}
