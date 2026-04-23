import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Used for scrim click; scrim is disabled when `dismissDisabled` is true. */
  onDismiss: () => void;
  dismissDisabled?: boolean;
};

/**
 * Accessible modal shell: dimmed scrim is a real <button> (keyboard + screen readers),
 * panel content stays above it.
 */
export function ModalBackdrop({ children, onDismiss, dismissDisabled }: Props) {
  return (
    <div className="modal-backdrop">
      <button
        type="button"
        className="modal-scrim"
        aria-label="Close dialog"
        disabled={dismissDisabled}
        onClick={() => {
          if (!dismissDisabled) onDismiss();
        }}
      />
      {children}
    </div>
  );
}
