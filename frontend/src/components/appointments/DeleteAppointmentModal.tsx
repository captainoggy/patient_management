import { useEffect } from "react";
import { createPortal } from "react-dom";

import type { PatientAppointment } from "../../api/patients";
import { ModalBackdrop } from "../ModalBackdrop";

type Props = {
  appointment: PatientAppointment | null;
  busy: boolean;
  whenLabel: string;
  /** Shown when the API delete fails; same pattern as form errors, not a browser alert. */
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteAppointmentModal({
  appointment,
  busy,
  whenLabel,
  error = null,
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
            Delete visit?
          </h2>
          <p id="delete-appt-desc" className="modal-desc">
            <strong>The visit on {whenLabel}</strong> will be permanently deleted. This cannot be
            undone.
          </p>
        </div>
        {error ? (
          <div className="alert alert-error modal-alert" role="alert" aria-live="assertive">
            {error}
          </div>
        ) : null}
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
