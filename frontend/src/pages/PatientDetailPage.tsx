import { FormEvent, useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";
import { Link, useParams } from "react-router-dom";

import type { ClinicSummary } from "../api/auth";
import { createAppointment, deleteAppointment, updateAppointment } from "../api/appointments";
import { listClinicians, type Clinician } from "../api/clinicians";
import { AppointmentEditorModal } from "../components/appointments/AppointmentEditorModal";
import { DeleteAppointmentModal } from "../components/appointments/DeleteAppointmentModal";
import { PatientFormModal, type EditorState } from "../components/patients/PatientFormModal";
import { messageFromSaveError } from "../api/drfErrors";
import { ApiError } from "../api/http";
import {
  fetchPatientDetail,
  updatePatient,
  type PatientAppointment,
  type PatientDetail,
  type PatientPayload,
} from "../api/patients";
import { isDateOfBirthInFuture } from "../utils/dateOfBirth";

type Props = {
  clinic: ClinicSummary;
};

type ApptUiState = { mode: "create" } | { mode: "edit"; appt: PatientAppointment };

const emptyPayload: PatientPayload = {
  first_name: "",
  last_name: "",
  date_of_birth: "",
  email: "",
  phone: "",
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

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function sortClinicians(a: Clinician, b: Clinician): number {
  const ln = (a.last_name ?? "").localeCompare(b.last_name ?? "");
  if (ln !== 0) return ln;
  return (a.first_name ?? "").localeCompare(b.first_name ?? "");
}

export function PatientDetailPage({ clinic }: Props) {
  const { patientId } = useParams<{ patientId: string }>();
  const id = patientId ? Number.parseInt(patientId, 10) : Number.NaN;

  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [form, setForm] = useState<PatientPayload>(emptyPayload);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [staff, setStaff] = useState<Clinician[]>([]);
  const [apptUi, setApptUi] = useState<ApptUiState | null>(null);
  const [apptFormError, setApptFormError] = useState<string | null>(null);
  const [apptSaving, setApptSaving] = useState(false);
  const [deleteApptTarget, setDeleteApptTarget] = useState<PatientAppointment | null>(null);
  const [deleteApptBusy, setDeleteApptBusy] = useState(false);
  const [deleteApptError, setDeleteApptError] = useState<string | null>(null);

  const normalizeDetail = useCallback((data: PatientDetail): PatientDetail => {
    return {
      ...data,
      appointments: Array.isArray(data.appointments) ? data.appointments : [],
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(t);
  }, [notice]);

  const careTeam = useMemo(() => {
    if (!detail) return [];
    const map = new Map<number, Clinician>();
    const visits = Array.isArray(detail.appointments) ? detail.appointments : [];
    for (const a of visits) {
      const people = Array.isArray(a.clinicians) ? a.clinicians : [];
      for (const c of people) {
        if (c && typeof c.id === "number") {
          map.set(c.id, c);
        }
      }
    }
    return [...map.values()].sort(sortClinicians);
  }, [detail]);

  useEffect(() => {
    if (!detail) {
      setStaff([]);
      return;
    }
    void listClinicians(clinic.id)
      .then(setStaff)
      .catch(() => setStaff([]));
  }, [detail, clinic.id]);

  useEffect(() => {
    if (!Number.isFinite(id) || id < 1) {
      setLoading(false);
      setError("Invalid patient.");
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);

    void (async () => {
      try {
        const data = await fetchPatientDetail(id, clinic.id);
        if (cancelled) return;
        if (data == null || typeof data !== "object") {
          setError("Invalid response from server.");
          return;
        }
        setDetail(normalizeDetail(data as PatientDetail));
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setError("Patient not found.");
        } else {
          setError("Could not load this patient.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clinic.id, id, normalizeDetail]);

  const refreshDetail = useCallback(async () => {
    if (!Number.isFinite(id) || id < 1) return;
    try {
      const data = await fetchPatientDetail(id, clinic.id);
      if (data == null || typeof data !== "object") return;
      setDetail(normalizeDetail(data as PatientDetail));
    } catch {
      /* keep existing detail on refresh failure */
    }
  }, [clinic.id, id, normalizeDetail]);

  function openEdit() {
    if (!detail) return;
    setFormError(null);
    setNotice(null);
    setForm({
      first_name: detail.first_name,
      last_name: detail.last_name,
      date_of_birth: (() => {
        const raw = detail.date_of_birth ?? "";
        return raw && isDateOfBirthInFuture(raw) ? "" : raw;
      })(),
      email: detail.email,
      phone: detail.phone,
    });
    setEditor({ mode: "edit", patientId: detail.id });
  }

  function closeEditor() {
    setFormError(null);
    setEditor(null);
  }

  function patchForm(next: SetStateAction<PatientPayload>) {
    setFormError(null);
    setForm(next);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!editor || editor.mode !== "edit") return;
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
    const label = `${payload.first_name.trim()} ${payload.last_name.trim()}`;
    try {
      await updatePatient(editor.patientId, payload);
      closeEditor();
      setNotice(`${label} was updated successfully.`);
      await refreshDetail();
    } catch (err) {
      setFormError(messageFromSaveError(err));
    } finally {
      setSaving(false);
    }
  }

  function closeApptModal() {
    setApptUi(null);
    setApptFormError(null);
  }

  async function handleApptSave(payload: {
    scheduled_at: string;
    notes: string;
    clinician_ids: number[];
  }) {
    if (!detail || !apptUi) return;
    setApptFormError(null);
    setApptSaving(true);
    try {
      if (apptUi.mode === "create") {
        await createAppointment({
          patient: detail.id,
          scheduled_at: payload.scheduled_at,
          notes: payload.notes || undefined,
          clinician_ids: payload.clinician_ids,
        });
      } else {
        await updateAppointment(apptUi.appt.id, {
          scheduled_at: payload.scheduled_at,
          notes: payload.notes || undefined,
          clinician_ids: payload.clinician_ids,
        });
      }
      closeApptModal();
      setNotice("Visit saved.");
      await refreshDetail();
    } catch (err) {
      setApptFormError(messageFromSaveError(err));
    } finally {
      setApptSaving(false);
    }
  }

  function requestDeleteAppt(a: PatientAppointment) {
    setDeleteApptError(null);
    // Defer opening so the same pointer gesture cannot "click through" to the
    // modal's confirm button (ghost click).
    window.setTimeout(() => setDeleteApptTarget(a), 0);
  }

  function cancelDeleteAppt() {
    if (!deleteApptBusy) {
      setDeleteApptTarget(null);
      setDeleteApptError(null);
    }
  }

  async function confirmDeleteAppt() {
    if (!deleteApptTarget) return;
    setDeleteApptError(null);
    setDeleteApptBusy(true);
    try {
      await deleteAppointment(deleteApptTarget.id);
      setDeleteApptTarget(null);
      setDeleteApptError(null);
      setNotice("Visit removed.");
      await refreshDetail();
    } catch {
      setDeleteApptError("Could not delete this visit. Try again.");
    } finally {
      setDeleteApptBusy(false);
    }
  }

  return (
    <>
      <nav className="patient-show-nav">
        <Link to="/patients" className="text-link">
          ← Patients
        </Link>
      </nav>

      {error ? (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <div className="loading-state panel-padded" aria-busy="true">
          <div className="loading-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="muted">Loading…</p>
        </div>
      ) : null}

      {!loading && detail ? (
        <article className="panel patient-show">
          <header className="patient-show-hero panel-padded">
            <div className="patient-show-hero-top">
              <h1 className="patient-show-name">
                {detail.first_name} {detail.last_name}
              </h1>
              <button type="button" className="btn btn-secondary" onClick={openEdit}>
                Edit
              </button>
            </div>
            <dl className="patient-show-facts">
              <div>
                <dt>Email</dt>
                <dd>{detail.email || "—"}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{detail.phone || "—"}</dd>
              </div>
              <div>
                <dt>Date of birth</dt>
                <dd>{formatDob(detail.date_of_birth)}</dd>
              </div>
            </dl>
          </header>

          <section className="patient-show-block panel-padded">
            <h2 className="patient-show-h2">Care team</h2>
            {careTeam.length === 0 ? (
              <p className="muted patient-show-muted">
                No clinicians on this patient&apos;s visits yet.
              </p>
            ) : (
              <ul className="patient-show-team">
                {careTeam.map((c) => (
                  <li key={c.id}>
                    <strong>
                      {c.first_name} {c.last_name}
                    </strong>
                    {c.role ? <span className="patient-show-role"> · {c.role}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="patient-show-block patient-show-block--flush">
            <div className="patient-show-visits-head panel-padded">
              <h2 className="patient-show-h2 patient-show-h2--inline">Visits</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setApptFormError(null);
                  setApptUi({ mode: "create" });
                }}
              >
                Add visit
              </button>
            </div>
            {(detail.appointments ?? []).length === 0 ? (
              <p className="muted patient-show-muted panel-padded">No visits on file.</p>
            ) : (
              <div className="table-wrap">
                <table className="patient-table patient-table--in-show">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Clinicians</th>
                      <th>Notes</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.appointments ?? []).map((a) => {
                      const people = Array.isArray(a.clinicians) ? a.clinicians : [];
                      return (
                        <tr key={a.id}>
                          <td className="cell-muted">{formatWhen(a.scheduled_at ?? "")}</td>
                          <td className="cell-muted">
                            {people.length
                              ? people.map((c) => `${c.first_name} ${c.last_name}`).join(", ")
                              : "—"}
                          </td>
                          <td className="cell-muted">{a.notes || "—"}</td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setApptFormError(null);
                                  setApptUi({ mode: "edit", appt: a });
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger-ghost btn-sm"
                                onClick={() => requestDeleteAppt(a)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </article>
      ) : null}

      <PatientFormModal
        editor={editor}
        form={form}
        setForm={patchForm}
        saving={saving}
        formError={formError}
        onClose={closeEditor}
        onSubmit={(e) => void handleSave(e)}
      />

      <DeleteAppointmentModal
        appointment={deleteApptTarget}
        busy={deleteApptBusy}
        whenLabel={deleteApptTarget ? formatWhen(deleteApptTarget.scheduled_at ?? "") : ""}
        error={deleteApptError}
        onCancel={cancelDeleteAppt}
        onConfirm={() => void confirmDeleteAppt()}
      />

      {detail && apptUi ? (
        <AppointmentEditorModal
          mode={apptUi.mode}
          patientId={detail.id}
          patientDisplayName={`${detail.first_name} ${detail.last_name}`}
          appointment={apptUi.mode === "edit" ? apptUi.appt : null}
          staff={staff}
          saving={apptSaving}
          formError={apptFormError}
          onClose={closeApptModal}
          onSubmit={(p) => void handleApptSave(p)}
        />
      ) : null}
    </>
  );
}
