import type { MouseEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import type { Patient } from "../../api/patients";

type Props = {
  patients: Patient[];
  onEdit: (p: Patient) => void;
  onAddVisit: (p: Patient) => void;
  onDelete: (p: Patient) => void;
};

function formatDob(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PatientTable({ patients, onEdit, onAddVisit, onDelete }: Props) {
  const navigate = useNavigate();

  function goToPatient(id: number) {
    navigate(`/patients/${id}`);
  }

  function onRowClick(e: MouseEvent<HTMLTableRowElement>, id: number) {
    const el = e.target as HTMLElement;
    if (el.closest(".patient-row-actions") || el.closest("button")) {
      return;
    }
    goToPatient(id);
  }

  function onRowKeyDown(e: KeyboardEvent<HTMLTableRowElement>, id: number) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToPatient(id);
    }
  }

  return (
    <table className="patient-table">
      <thead>
        <tr>
          <th>Patient</th>
          <th>Contact</th>
          <th>Date of birth</th>
          <th>Appts</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {patients.map((p) => (
          <tr
            key={p.id}
            data-patient-id={p.id}
            className="patient-row-clickable"
            tabIndex={0}
            onClick={(e) => onRowClick(e, p.id)}
            onKeyDown={(e) => onRowKeyDown(e, p.id)}
          >
            <td>
              <span className="name-cell">
                {p.first_name} {p.last_name}
              </span>
              {p.email ? (
                <span className="name-meta">{p.email}</span>
              ) : (
                <span className="name-meta">No email on file</span>
              )}
            </td>
            <td className="cell-muted">{p.phone || "—"}</td>
            <td className="cell-muted">{formatDob(p.date_of_birth)}</td>
            <td>
              <span className="badge">{p.appointment_count}</span>
            </td>
            <td className="patient-row-actions">
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onAddVisit(p)}
                >
                  Add visit
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onEdit(p)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger-ghost btn-sm"
                  onClick={() => onDelete(p)}
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
