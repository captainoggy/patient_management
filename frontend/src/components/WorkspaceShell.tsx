import { NavLink, Outlet, useLocation } from "react-router-dom";

import type { ClinicSummary } from "../api/auth";
import { logout as logoutApi } from "../api/auth";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

type Props = {
  clinic: ClinicSummary;
  onLogout: () => void;
};

function tabClassName({ isActive }: { isActive: boolean }): string {
  return isActive ? "app-tab is-active" : "app-tab";
}

function ShellOutlet() {
  const location = useLocation();
  return (
    <RouteErrorBoundary key={location.pathname}>
      <Outlet />
    </RouteErrorBoundary>
  );
}

export function WorkspaceShell({ clinic, onLogout }: Props) {
  async function doLogout() {
    try {
      await logoutApi();
    } finally {
      onLogout();
    }
  }

  return (
    <div className="app-shell">
      <header className="workspace-header">
        <div className="workspace-header-top">
          <div className="workspace-brand">
            <p className="workspace-kicker">Clinic workspace</p>
            <h1 className="workspace-title">{clinic.name}</h1>
          </div>
          <button
            type="button"
            className="btn btn-secondary workspace-signout"
            onClick={() => void doLogout()}
          >
            Sign out
          </button>
        </div>
        <nav className="app-tabs workspace-tabs-row" aria-label="Primary navigation">
          <NavLink to="/patients" className={tabClassName}>
            Patients
          </NavLink>
          <NavLink to="/staff" className={tabClassName} end>
            Staff
          </NavLink>
          <NavLink to="/appointments" className={tabClassName} end>
            Appointments
          </NavLink>
        </nav>
      </header>

      <ShellOutlet />
    </div>
  );
}
