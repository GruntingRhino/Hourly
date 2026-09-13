import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { ToastContext, type ToastType } from "./toastContext";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  // REPORT F-11: error toasts persist until dismissed (a 4 s timer is the
  // only signal an error ever gets, and it can vanish before a
  // screen-reader/keyboard user reaches it). Info/success keep the 4 s
  // timer, paused while hovered or keyboard-focused.
  const persistent = toast.type === "error";
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (persistent) return;
    clearTimer();
    timerRef.current = setTimeout(() => onRemove(toast.id), 4000);
  }, [clearTimer, onRemove, persistent, toast.id]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const colors = {
    success: "bg-[var(--ok-t)] text-white",
    error: "bg-[var(--er-t)] text-white",
    info: "bg-[var(--navy)] text-white",
  };

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      onFocus={clearTimer}
      onBlur={startTimer}
      className={`${colors[toast.type]} px-4 py-3 rounded-[3px]  text-sm font-medium animate-slide-up flex items-center justify-between gap-3`}
    >
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
        className="opacity-70 hover:opacity-100 text-lg leading-none"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}
