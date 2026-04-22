import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { PatientPayload } from "../../api/patients";

export type EditorState = { mode: "create" } | { mode: "edit"; patientId: number };

type Props = {
  editor: EditorState | null;
  form: PatientPayload;
  setForm: Dispatch<SetStateAction<PatientPayload>>;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
};

export function PatientFormModal({ editor, form, setForm, saving, onClose, onSubmit }: Props) {
  if (!editor) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal stack"
        role="dialog"
        aria-modal="true"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h2 style={{ margin: 0 }}>
          {editor.mode === "create" ? "New patient" : "Edit patient"}
        </h2>
        <form className="stack" onSubmit={(e) => void onSubmit(e)}>
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
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
