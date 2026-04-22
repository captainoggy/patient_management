import { useEffect, useState } from "react";

import type { ClinicSummary } from "./api/auth";
import { fetchSession } from "./api/auth";
import { LoginPage } from "./pages/LoginPage";
import { PatientsPage } from "./pages/PatientsPage";

export function App() {
  const [clinic, setClinic] = useState<ClinicSummary | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const s = await fetchSession();
        if (s.authenticated) {
          setClinic(s.clinic);
        }
      } catch {
        setClinic(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const handleAuthed = (c: ClinicSummary) => {
    setClinic(c);
  };

  const handleLogout = () => {
    setClinic(null);
  };

  if (!ready) {
    return (
      <div className="app-shell">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!clinic) {
    return <LoginPage onAuthed={handleAuthed} />;
  }

  return <PatientsPage clinic={clinic} onLogout={handleLogout} />;
}
