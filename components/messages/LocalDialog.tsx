import React, { useRef } from "react";
import { GlassButton, GlassSurface } from "./Glass";
import { useModalFocus } from "./useModalFocus";
export function LocalDialog({
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  busy = false,
  destructive = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  busy?: boolean;
  destructive?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useModalFocus(panel, onClose, busy);
  return (
    <div className="dialog-backdrop">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="local-dialog"
      >
        <GlassSurface>
          <h2>{title}</h2>
          <div className="dialog-content">{children}</div>
          <div className="dialog-buttons">
            <GlassButton disabled={busy} onClick={onClose}>
              {onConfirm ? "Cancel" : "Done"}
            </GlassButton>
            {onConfirm && (
              <GlassButton
                disabled={busy}
                className={destructive ? "destructive" : ""}
                onClick={onConfirm}
              >
                {busy ? "Saving…" : confirmLabel}
              </GlassButton>
            )}
          </div>
        </GlassSurface>
      </div>
    </div>
  );
}
