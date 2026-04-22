import { FormEvent, useState } from "react";

import { PatientFormModal, type EditorState } from "../components/patients/PatientFormModal";
import { PatientListPagination } from "../components/patients/PatientListPagination";
import { PatientTable } from "../components/patients/PatientTable";
import type { ClinicSummary } from "../api/auth";
import { logout as logoutApi } from "../api/auth";
import { ApiError } from "../api/http";
import {
  createPatient,
  deletePatient,
  type Patient,
  type PatientPayload,
  updatePatient,
} from "../api/patients";
import { usePatientsList } from "../hooks/usePatientsList";

type Props = {
  clinic: ClinicSummary;
  onLogout: () => void;
};

const emptyPayload: PatientPayload = {
  first_name: "",
  last_name: "",
  date_of_birth: "",
  email: "",
  phone: "",
};

export function PatientsPage({ clinic, onLogout }: Props) {
  const {
    patients,
    listCount,
    page: listPage,
    setPage: setListPage,
    listNext,
    listPrevious,
    loading,
    error,
    setError,
    reload,
  } = usePatientsList(clinic.id);

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [form, setForm] = useState<PatientPayload>(emptyPayload);
  const [saving, setSaving] = useState(false);

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
    setEditor({ mode: "edit", patientId: p.id });
  }

  function closeEditor() {
    setEditor(null);
  }

  async function handleDelete(p: Patient) {
    if (!window.confirm(`Delete ${p.first_name} ${p.last_name}?`)) return;
    try {
      await deletePatient(p.id);
      await reload();
    } catch {
      setError("Delete failed.");
    }
  }

  async function handleSave(e: FormEvent) {
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
      } else {
        await updatePatient(editor.patientId, payload);
      }
      closeEditor();
      await reload();
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
        ) : listCount === 0 ? (
          <p className="muted">No patients yet. Add one to get started.</p>
        ) : patients.length === 0 ? (
          <p className="muted">No rows on this page. Try another page.</p>
        ) : (
          <PatientTable patients={patients} onEdit={openEdit} onDelete={handleDelete} />
        )}
        <PatientListPagination
          listCount={listCount}
          page={listPage}
          hasPrevious={!!listPrevious}
          hasNext={!!listNext}
          onPrevious={() => setListPage((p) => Math.max(1, p - 1))}
          onNext={() => setListPage((p) => p + 1)}
        />
      </section>

      <PatientFormModal
        editor={editor}
        form={form}
        setForm={setForm}
        saving={saving}
        onClose={closeEditor}
        onSubmit={(e) => void handleSave(e)}
      />
    </div>
  );
}
