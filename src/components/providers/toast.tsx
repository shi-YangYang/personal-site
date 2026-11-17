"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error";

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ShowToast = (message: string, type?: ToastType) => void;

const ToastContext = createContext<ShowToast>(() => {});

export function useToast(): ShowToast {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback<ShowToast>((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const isSuccess = toast.type === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-[var(--shadow-elevated)] glass animate-toast-in",
        isSuccess
          ? "border-brand-primary/40 text-text-primary"
          : "border-red-400/40 text-text-primary",
      )}
    >
      <Icon
        size={16}
        className={cn("shrink-0", isSuccess ? "text-brand-glow" : "text-red-400")}
      />
      <span className="text-text-primary">{toast.message}</span>
    </div>
  );
}
