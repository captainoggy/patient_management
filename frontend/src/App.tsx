import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import type { ClinicSummary } from "./api/auth";
import { fetchSession } from "./api/auth";
import { WorkspaceShell } from "./components/WorkspaceShell";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { LoginPage } from "./pages/LoginPage";
import { PatientDetailPage } from "./pages/PatientDetailPage";
import { PatientsPage } from "./pages/PatientsPage";
import { StaffDirectoryPage } from "./pages/StaffDirectoryPage";

function AppRoutes() {
  const navigate = useNavigate();
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
    navigate("/patients", { replace: true });
  };

  const handleLogout = () => {
    navigate("/", { replace: true });
    setClinic(null);
  };

  if (!ready) {
    return (
      <div className="auth-layout" aria-busy="true">
        <div className="loading-state">
          <div className="loading-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="muted">Starting…</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return <LoginPage onAuthed={handleAuthed} />;
  }

  return (
    <Routes>
      {/* path="/" layout is required so nested routes like patients/:id match; a pathless parent can break matching. */}
      <Route path="/" element={<WorkspaceShell clinic={clinic} onLogout={handleLogout} />}>
        <Route index element={<Navigate to="/patients" replace />} />
        <Route path="patients" element={<PatientsPage clinic={clinic} />} />
        <Route path="patients/:patientId" element={<PatientDetailPage clinic={clinic} />} />
        <Route path="staff" element={<StaffDirectoryPage clinicId={clinic.id} />} />
        <Route path="appointments" element={<AppointmentsPage clinicId={clinic.id} />} />
        <Route path="*" element={<Navigate to="/patients" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return <AppRoutes />;
}
