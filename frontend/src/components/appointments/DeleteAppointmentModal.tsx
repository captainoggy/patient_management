import { useEffect } from "react";
import { createPortal } from "react-dom";

import type { PatientAppointment } from "../../api/patients";
import { ModalBackdrop } from "../ModalBackdrop";

type Props = {
  appointment: PatientAppointment | null;
  patientName?: string | null;
  busy: boolean;
  whenLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteAppointmentModal({
  appointment,
  patientName,
  busy,
  whenLabel,
  onCancel,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!appointment) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [appointment, busy, onCancel]);

  if (!appointment) return null;

  const notesPreview =
    appointment.notes && appointment.notes.trim() ? appointment.notes.trim() : "No notes";

  return createPortal(
    <ModalBackdrop onDismiss={onCancel} dismissDisabled={busy}>
      <div
        className="modal stack"
        role="alertdialog"
        aria-labelledby="delete-appt-title"
        aria-describedby="delete-appt-desc"
        aria-modal="true"
        style={{ width: "min(400px, 100%)" }}
      >
        <div className="modal-header">
          <h2 id="delete-appt-title" className="modal-title">
            Delete this visit?
          </h2>
          <p id="delete-appt-desc" className="modal-desc">
            {patientName?.trim() ? (
              <>
                Visit for <strong>{patientName.trim()}</strong>
                <br />
              </>
            ) : null}
            <strong>{whenLabel}</strong>
            <br />
            <span className="muted" style={{ fontSize: "0.9rem" }}>
              {notesPreview}
            </span>
            <br />
            <span style={{ marginTop: "0.5rem", display: "inline-block" }}>
              This cannot be undone.
            </span>
          </p>
        </div>
        <div className="modal-footer" style={{ border: "none", marginTop: 0, paddingTop: 0 }}>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={busy}
            onClick={() => void onConfirm()}
          >
            {busy ? "Deleting…" : "Delete visit"}
          </button>
        </div>
      </div>
    </ModalBackdrop>,
    document.body,
  );
}
