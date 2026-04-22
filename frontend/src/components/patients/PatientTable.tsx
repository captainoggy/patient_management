import type { Patient } from "../../api/patients";

type Props = {
  patients: Patient[];
  onEdit: (p: Patient) => void;
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

export function PatientTable({ patients, onEdit, onDelete }: Props) {
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
          <tr key={p.id}>
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
            <td>
              <div className="row-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(p)}>
                  Edit
                </button>
                <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => onDelete(p)}>
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
