//src/components/toast.tsx
"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { AlertCircle, CheckCircle2, Trash2, X } from "lucide-react";

type ToastType = "success" | "error" | "danger";
type ToastItem = { id: number; type: ToastType; message: string };
type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  danger: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++nextId.current;
      setItems((prev) => [...prev.slice(-2), { id, type, message }]); // máximo 3 a la vez
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), type === "error" ? 6000 : 4000),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      danger: (m) => push("danger", m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 pb-[env(safe-area-inset-bottom)] sm:inset-x-auto sm:right-4 sm:items-end">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className={`toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-lg ring-1 ${
              t.type === "success"
                ? "bg-green-50 text-green-900 ring-green-200"
                : "bg-red-50 text-red-900 ring-red-200"
            }`}
          >
            {t.type === "success" && (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
            )}
            {t.type === "danger" && <Trash2 className="mt-0.5 size-5 shrink-0 text-red-600" />}
            {t.type === "error" && <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />}
            <p className="flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar aviso"
              className="-m-1 rounded p-1 opacity-60 hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}