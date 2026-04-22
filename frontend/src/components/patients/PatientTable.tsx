import type { Patient } from "../../api/patients";

type Props = {
  patients: Patient[];
  onEdit: (p: Patient) => void;
  onDelete: (p: Patient) => void;
};

export function PatientTable({ patients, onEdit, onDelete }: Props) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>DOB</th>
            <th>Appts</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id}>
              <td>
                {p.last_name}, {p.first_name}
              </td>
              <td>{p.email || "—"}</td>
              <td>{p.phone || "—"}</td>
              <td>{p.date_of_birth || "—"}</td>
              <td>{p.appointment_count}</td>
              <td>
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => onEdit(p)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => void onDelete(p)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
