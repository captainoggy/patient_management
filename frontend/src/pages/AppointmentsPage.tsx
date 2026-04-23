import { useEffect, useState } from "react";

import { listAppointments, type Appointment } from "../api/appointments";

type Props = {
  clinicId: number;
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AppointmentsPage({ clinicId }: Props) {
  const [rows, setRows] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setRows(null);
    void (async () => {
      try {
        const data = await listAppointments(clinicId);
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) setError("Could not load appointments.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  return (
    <>
      <p className="workspace-tab-desc">
        Visits for patients in this clinic. Each appointment belongs to one patient and can include
        multiple clinicians.
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
              <p className="muted">Loading appointments…</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <p className="muted">No appointments scheduled yet.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="patient-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Patient</th>
                    <th>Clinicians</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id}>
                      <td className="cell-muted">{formatWhen(a.scheduled_at)}</td>
                      <td className="name-cell">
                        {a.patient_first_name} {a.patient_last_name}
                      </td>
                      <td className="cell-muted">
                        {a.clinicians.length
                          ? a.clinicians.map((c) => `${c.first_name} ${c.last_name}`).join(", ")
                          : "—"}
                      </td>
                      <td className="cell-muted">{a.notes || "—"}</td>
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
