import { useEffect } from "react";

import type { Patient } from "../../api/patients";

type Props = {
  patient: Patient | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeletePatientModal({ patient, busy, onCancel, onConfirm }: Props) {
  useEffect(() => {
    if (!patient) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [patient, busy, onCancel]);

  if (!patient) return null;

  const name = `${patient.first_name} ${patient.last_name}`;

  return (
    <div className="modal-backdrop" role="presentation" onClick={busy ? undefined : onCancel}>
      <div
        className="modal stack"
        role="alertdialog"
        aria-labelledby="delete-patient-title"
        aria-describedby="delete-patient-desc"
        aria-modal="true"
        onClick={(ev) => ev.stopPropagation()}
        style={{ width: "min(400px, 100%)" }}
      >
        <div className="modal-header">
          <h2 id="delete-patient-title" className="modal-title">
            Remove patient?
          </h2>
          <p id="delete-patient-desc" className="modal-desc">
            <strong>{name}</strong> will be removed from this clinic. This cannot be undone.
          </p>
        </div>
        <div className="modal-footer" style={{ border: "none", marginTop: 0, paddingTop: 0 }}>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" disabled={busy} onClick={() => void onConfirm()}>
            {busy ? "Removing…" : "Remove patient"}
          </button>
        </div>
      </div>
    </div>
  );
}
