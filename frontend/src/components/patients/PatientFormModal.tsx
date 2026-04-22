import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useEffect } from "react";

import type { PatientPayload } from "../../api/patients";
import { todayIsoDateLocal } from "../../utils/dateOfBirth";

export type EditorState = { mode: "create" } | { mode: "edit"; patientId: number };

type Props = {
  editor: EditorState | null;
  form: PatientPayload;
  setForm: Dispatch<SetStateAction<PatientPayload>>;
  saving: boolean;
  formError: string | null;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
};

export function PatientFormModal({
  editor,
  form,
  setForm,
  saving,
  formError,
  onClose,
  onSubmit,
}: Props) {
  useEffect(() => {
    if (!editor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, onClose]);

  if (!editor) return null;

  const isCreate = editor.mode === "create";
  const dobMax = todayIsoDateLocal();

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal stack"
        role="dialog"
        aria-labelledby="patient-modal-title"
        aria-modal="true"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="patient-modal-title" className="modal-title">
            {isCreate ? "Add patient" : "Edit patient"}
          </h2>
          <p className="modal-desc">
            {isCreate
              ? "Required fields are marked. Everything else can be added later."
              : "Update details and save. Changes apply immediately."}
          </p>
        </div>

        {formError ? (
          <div className="alert alert-error modal-alert" role="alert">
            {formError}
          </div>
        ) : null}

        <form className="stack" noValidate onSubmit={(e) => void onSubmit(e)}>
          <div className="row" style={{ gap: "1rem" }}>
            <label className="field">
              First name
              <input
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                required
                autoFocus
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
              max={dobMax}
              value={form.date_of_birth ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
            />
            <span className="field-hint">Cannot be a future date.</span>
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
                inputMode="tel"
                value={form.phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : isCreate ? "Add patient" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
