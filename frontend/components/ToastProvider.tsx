"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X, Check, AlertTriangle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_STYLES: Record<ToastType, { border: string; iconBg: string; icon: React.ReactNode }> = {
  success: {
    border: "border-l-emerald-500",
    iconBg: "bg-emerald-500/10 text-emerald-500",
    icon: <Check className="w-3.5 h-3.5" />,
  },
  error: {
    border: "border-l-red-500",
    iconBg: "bg-red-500/10 text-red-500",
    icon: <X className="w-3.5 h-3.5" />,
  },
  info: {
    border: "border-l-primary",
    iconBg: "bg-primary/10 text-primary",
    icon: <Info className="w-3.5 h-3.5" />,
  },
  warning: {
    border: "border-l-amber-500",
    iconBg: "bg-amber-500/10 text-amber-500",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const s = TOAST_STYLES[toast.type];
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 px-4 py-3.5 rounded-lg border-l-[3px] text-sm",
        "bg-card shadow-lg shadow-black/5 pointer-events-auto animate-toast-in",
        "min-w-[320px] max-w-[440px] border border-border",
        s.border
      )}
    >
      <span className={cn("flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center", s.iconBg)}>
        {s.icon}
      </span>
      <span className="flex-1 text-foreground leading-snug text-[13px]">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
