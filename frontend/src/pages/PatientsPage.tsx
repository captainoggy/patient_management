import { FormEvent, useCallback, useEffect, useState } from "react";

import type { ClinicSummary } from "../api/auth";
import { logout as logoutApi } from "../api/auth";
import { ApiError } from "../api/http";
import {
  createPatient,
  deletePatient,
  listPatients,
  type Patient,
  type PatientPayload,
  updatePatient,
} from "../api/patients";

type Props = {
  clinic: ClinicSummary;
  onLogout: () => void;
};

type EditorMode = "create" | "edit";

const emptyPayload: PatientPayload = {
  first_name: "",
  last_name: "",
  date_of_birth: "",
  email: "",
  phone: "",
};

export function PatientsPage({ clinic, onLogout }: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ mode: EditorMode; patient?: Patient } | null>(null);
  const [form, setForm] = useState<PatientPayload>(emptyPayload);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const rows = await listPatients();
      setPatients(rows);
    } catch {
      setError("Could not load patients.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setForm(emptyPayload);
    setEditor({ mode: "create" });
  }

  function openEdit(p: Patient) {
    setForm({
      first_name: p.first_name,
      last_name: p.last_name,
      date_of_birth: p.date_of_birth ?? "",
      email: p.email,
      phone: p.phone,
    });
    setEditor({ mode: "edit", patient: p });
  }

  function closeEditor() {
    setEditor(null);
  }

  async function onDelete(p: Patient) {
    if (!window.confirm(`Delete ${p.first_name} ${p.last_name}?`)) return;
    try {
      await deletePatient(p.id);
      await load();
    } catch {
      setError("Delete failed.");
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!editor) return;
    setSaving(true);
    setError(null);
    const payload: PatientPayload = {
      ...form,
      date_of_birth: form.date_of_birth || null,
    };
    try {
      if (editor.mode === "create") {
        await createPatient(payload);
      } else if (editor.patient) {
        await updatePatient(editor.patient.id, payload);
      }
      closeEditor();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? "Save failed. Check required fields." : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function doLogout() {
    try {
      await logoutApi();
    } finally {
      onLogout();
    }
  }

  return (
    <div className="app-shell">
      <header className="row-between" style={{ marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.25rem" }}>Patients</h1>
          <p className="muted" style={{ margin: 0 }}>
            {clinic.name}
          </p>
        </div>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            Add patient
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void doLogout()}>
            Sign out
          </button>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : patients.length === 0 ? (
          <p className="muted">No patients yet. Add one to get started.</p>
        ) : (
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
                        <button type="button" className="btn btn-ghost" onClick={() => openEdit(p)}>
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
        )}
      </section>

      {editor ? (
        <div className="modal-backdrop" role="presentation" onClick={closeEditor}>
          <div
            className="modal stack"
            role="dialog"
            aria-modal="true"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h2 style={{ margin: 0 }}>
              {editor.mode === "create" ? "New patient" : "Edit patient"}
            </h2>
            <form className="stack" onSubmit={(e) => void onSave(e)}>
              <div className="row" style={{ gap: "1rem" }}>
                <label className="field">
                  First name
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    required
                  />
                </label>
                <label className="field">
                  Last name
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                    required
                  />
                </label>
              </div>
              <label className="field">
                Date of birth
                <input
                  type="date"
                  value={form.date_of_birth ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
                />
              </label>
              <div className="row" style={{ gap: "1rem" }}>
                <label className="field">
                  Email
                  <input
                    type="email"
                    value={form.email ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </label>
                <label className="field">
                  Phone
                  <input
                    value={form.phone ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </label>
              </div>
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={closeEditor}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
