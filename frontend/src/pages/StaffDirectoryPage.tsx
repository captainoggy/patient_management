import { useEffect, useState } from "react";

import { listClinicians, type Clinician } from "../api/clinicians";

type Props = {
  clinicId: number;
};

export function StaffDirectoryPage({ clinicId }: Props) {
  const [rows, setRows] = useState<Clinician[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setRows(null);
    void (async () => {
      try {
        const data = await listClinicians(clinicId);
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) setError("Could not load staff.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  return (
    <>
      <p className="workspace-tab-desc">
        Staff directory for this clinic. Each clinician belongs to one clinic; appointments can
        assign multiple clinicians.
      </p>

      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}

      <section className="panel">
        <div className="panel-body">
          {rows === null ? (
            <div className="loading-state">
              <div className="loading-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p className="muted">Loading staff…</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <p className="muted">No clinicians recorded for this clinic yet.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="patient-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id}>
                      <td className="name-cell">
                        {c.first_name} {c.last_name}
                      </td>
                      <td className="cell-muted">{c.role || "—"}</td>
                      <td className="cell-muted">{c.email || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
