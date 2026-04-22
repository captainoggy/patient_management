import { FormEvent, useState, type SetStateAction } from "react";

import { PatientFormModal, type EditorState } from "../components/patients/PatientFormModal";
import { PatientListPagination } from "../components/patients/PatientListPagination";
import { PatientTable } from "../components/patients/PatientTable";
import type { ClinicSummary } from "../api/auth";
import { logout as logoutApi } from "../api/auth";
import { messageFromSaveError } from "../api/drfErrors";
import { isDateOfBirthInFuture } from "../utils/dateOfBirth";
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
    pageSize,
    goToPage,
    setPageSize,
    totalPages,
    rangeStart,
    rangeEnd,
    loading,
    error,
    setError,
    reload,
  } = usePatientsList(clinic.id);

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [form, setForm] = useState<PatientPayload>(emptyPayload);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setFormError(null);
    setForm(emptyPayload);
    setEditor({ mode: "create" });
  }

  function openEdit(p: Patient) {
    setFormError(null);
    setForm({
      first_name: p.first_name,
      last_name: p.last_name,
      date_of_birth: (() => {
        const raw = p.date_of_birth ?? "";
        return raw && isDateOfBirthInFuture(raw) ? "" : raw;
      })(),
      email: p.email,
      phone: p.phone,
    });
    setEditor({ mode: "edit", patientId: p.id });
  }

  function closeEditor() {
    setFormError(null);
    setEditor(null);
  }

  function patchForm(next: SetStateAction<PatientPayload>) {
    setFormError(null);
    setForm(next);
  }

  async function handleDelete(p: Patient) {
    if (!window.confirm(`Remove ${p.first_name} ${p.last_name} from the directory?`)) return;
    try {
      await deletePatient(p.id);
      await reload();
    } catch {
      setError("Could not delete this patient. Try again.");
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!editor) return;
    setFormError(null);
    setSaving(true);
    const dob = form.date_of_birth?.trim() || null;
    if (dob && isDateOfBirthInFuture(dob)) {
      setFormError("Date of birth cannot be in the future.");
      setSaving(false);
      return;
    }
    const payload: PatientPayload = {
      ...form,
      date_of_birth: dob,
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
      setFormError(messageFromSaveError(err));
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
      <header className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">{clinic.name}</p>
        </div>
        <div className="toolbar">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            Add patient
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => void doLogout()}>
            Sign out
          </button>
        </div>
      </header>

      {error ? (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      <section className="panel">
        <div className="panel-body">
          {loading ? (
            <div className="loading-state" aria-busy="true">
              <div className="loading-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p className="muted">Loading patients…</p>
            </div>
          ) : listCount === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">
                ◎
              </div>
              <p className="muted" style={{ fontSize: "0.95rem", marginBottom: "1rem" }}>
                No patients in this clinic yet. Add someone to start building the directory.
              </p>
              <button type="button" className="btn btn-primary" onClick={openCreate}>
                Add first patient
              </button>
            </div>
          ) : patients.length === 0 ? (
            <div className="empty-state panel-padded">
              <p className="muted">No results on this page. Use the pager below or go back.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <PatientTable patients={patients} onEdit={openEdit} onDelete={handleDelete} />
            </div>
          )}
        </div>
        <PatientListPagination
          listCount={listCount}
          page={listPage}
          totalPages={totalPages}
          pageSize={pageSize}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onPageChange={goToPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      <PatientFormModal
        editor={editor}
        form={form}
        setForm={patchForm}
        saving={saving}
        formError={formError}
        onClose={closeEditor}
        onSubmit={(e) => void handleSave(e)}
      />
    </div>
  );
}
