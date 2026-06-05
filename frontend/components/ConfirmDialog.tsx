"use client";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="krr-dialog-backdrop" onClick={onCancel}>
      <div
        className="krr-dialog-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="krr-dialog-title"
      >
        <h3 className="krr-dialog-title" id="krr-dialog-title">{title}</h3>
        <p className="krr-dialog-msg">{message}</p>
        <div className="krr-dialog-actions">
          <button type="button" onClick={onCancel} className="krr-dialog-cancel">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn("krr-dialog-confirm", variant === "danger" && "krr-dialog-confirm--danger")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
