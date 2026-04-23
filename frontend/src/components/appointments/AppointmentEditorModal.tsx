import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import type { Clinician } from "../../api/clinicians";
import { ModalBackdrop } from "../ModalBackdrop";
import type { PatientAppointment } from "../../api/patients";
import { datetimeLocalValueToIso, isoToDatetimeLocalValue } from "../../utils/datetimeLocal";

export type AppointmentEditorMode = "create" | "edit";

type Props = {
  mode: AppointmentEditorMode | null;
  patientId: number;
  /** e.g. "Taylor Brooks" — shown in the modal description when creating from the list. */
  patientDisplayName?: string | null;
  appointment: PatientAppointment | null;
  staff: Clinician[];
  saving: boolean;
  formError: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    scheduled_at: string;
    notes: string;
    clinician_ids: number[];
  }) => void | Promise<void>;
};

export function AppointmentEditorModal({
  mode,
  patientId,
  patientDisplayName,
  appointment,
  staff,
  saving,
  formError,
  onClose,
  onSubmit,
}: Props) {
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!mode) return;
    if (mode === "create") {
      const d = new Date();
      d.setMinutes(d.getMinutes() - (d.getMinutes() % 15));
      setWhen(isoToDatetimeLocalValue(d.toISOString()));
      setNotes("");
      setSelectedIds(new Set());
      return;
    }
    if (appointment) {
      setWhen(isoToDatetimeLocalValue(appointment.scheduled_at));
      setNotes(appointment.notes ?? "");
      const ids = new Set<number>();
      for (const c of appointment.clinicians ?? []) {
        if (c?.id) ids.add(c.id);
      }
      setSelectedIds(ids);
    }
  }, [mode, appointment]);

  useEffect(() => {
    if (!mode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, onClose]);

  if (!mode) return null;

  function toggleClinician(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!when.trim()) return;
    const scheduled_at = datetimeLocalValueToIso(when);
    void onSubmit({
      scheduled_at,
      notes: notes.trim(),
      clinician_ids: [...selectedIds],
    });
  }

  const title = mode === "create" ? "Add visit" : "Edit visit";
  const subject = patientDisplayName?.trim() || `patient #${patientId}`;

  return (
    <ModalBackdrop onDismiss={onClose}>
      <div
        className="modal stack"
        role="dialog"
        aria-labelledby="appt-modal-title"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 id="appt-modal-title" className="modal-title">
            {title}
          </h2>
          <p className="modal-desc">
            Schedule a visit for {subject}. Assign one or more staff from this clinic.
          </p>
        </div>

        {formError ? (
          <div className="alert alert-error modal-alert" role="alert" aria-live="polite">
            {formError}
          </div>
        ) : null}

        <form className="stack" noValidate onSubmit={(e) => void handleSubmit(e)}>
          <label className="field">
            Date &amp; time
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              required
            />
          </label>
          <label className="field">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional"
            />
          </label>

          <fieldset className="appt-staff-fieldset">
            <legend className="appt-staff-legend">Clinicians on this visit</legend>
            {staff.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                No staff in this clinic yet. Add clinicians under Staff or use Django admin.
              </p>
            ) : (
              <ul className="appt-staff-list">
                {staff.map((c) => (
                  <li key={c.id}>
                    <label className="appt-staff-label">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleClinician(c.id)}
                      />
                      <span>
                        {c.first_name} {c.last_name}
                        {c.role ? <span className="muted"> · {c.role}</span> : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : mode === "create" ? "Add visit" : "Save visit"}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}
