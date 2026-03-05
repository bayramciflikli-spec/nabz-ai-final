"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4500;

function generateId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const durationTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const t = durationTimers.current.get(id);
    if (t) clearTimeout(t);
    durationTimers.current.delete(id);
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType, duration = DEFAULT_DURATION) => {
      const id = generateId();
      const item: ToastItem = { id, message, type, duration, createdAt: Date.now() };
      setToasts((prev) => [...prev.slice(-4), item]);

      const t = setTimeout(() => removeToast(id), duration);
      durationTimers.current.set(id, t);

      return id;
    },
    [removeToast]
  );

  const toast = useCallback(
    () => ({
      success: (message: string, duration?: number) =>
        addToast(message, "success", duration ?? DEFAULT_DURATION),
      error: (message: string, duration?: number) =>
        addToast(message, "error", duration ?? DEFAULT_DURATION * 1.2),
      info: (message: string, duration?: number) =>
        addToast(message, "info", duration ?? DEFAULT_DURATION),
    }),
    [addToast]
  );

  useEffect(() => {
    return () => {
      durationTimers.current.forEach((t) => clearTimeout(t));
      durationTimers.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast: toast(), removeToast }}>
      {children}
      <ToastList toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastList({
  toasts,
  removeToast,
}: {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-[380px] z-[10000] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Bildirimler"
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} onDismiss={() => removeToast(item.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(onDismiss, 200);
  };

  const bg =
    item.type === "success"
      ? "bg-emerald-500/95 text-white border-emerald-400/30"
      : item.type === "error"
        ? "bg-red-500/95 text-white border-red-400/30"
        : "bg-slate-700/95 text-white border-slate-500/30";

  const icon =
    item.type === "success" ? (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ) : item.type === "error" ? (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ) : (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );

  return (
    <div
      role="alert"
      className={`
        pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm
        transition-all duration-200 ease-out
        ${bg}
        ${visible && !leaving ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      <span className="mt-0.5">{icon}</span>
      <p className="flex-1 text-sm font-medium leading-snug min-w-0">{item.message}</p>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Kapat"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue["toast"] & { removeToast: (id: string) => void } {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: (msg: string) => console.log("[toast success]", msg),
      error: (msg: string) => console.error("[toast error]", msg),
      info: (msg: string) => console.info("[toast info]", msg),
      removeToast: () => {},
    };
  }
  return { ...ctx.toast, removeToast: ctx.removeToast };
}
