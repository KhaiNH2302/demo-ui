import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  message?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextType {
  toast: (options: ToastOptions | string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

type ToastListener = (toast: ToastItem) => void;
const toastListeners = new Set<ToastListener>();

type SecondToastArg =
  | string
  | {
      description?: string;
      duration?: number;
      action?: { label: string; onClick: () => void };
    };

function normalizeSecondArg(arg?: SecondToastArg): Partial<ToastOptions> {
  if (!arg) return {};
  if (typeof arg === 'string') return { description: arg };
  return arg;
}

export const toast = {
  success: (msg: string, descOrOpts?: SecondToastArg) => {
    emitToast({ title: msg, variant: 'success', ...normalizeSecondArg(descOrOpts) });
  },
  error: (msg: string, descOrOpts?: SecondToastArg) => {
    emitToast({ title: msg, variant: 'error', ...normalizeSecondArg(descOrOpts) });
  },
  info: (msg: string, descOrOpts?: SecondToastArg) => {
    emitToast({ title: msg, variant: 'info', ...normalizeSecondArg(descOrOpts) });
  },
  warning: (msg: string, descOrOpts?: SecondToastArg) => {
    emitToast({ title: msg, variant: 'warning', ...normalizeSecondArg(descOrOpts) });
  },
};

function emitToast(options: ToastOptions) {
  const toastId = options.id || `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const item: ToastItem = { ...options, id: toastId };
  toastListeners.forEach((fn) => fn(item));
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (opts: ToastOptions | string) => {
      const parsed: ToastOptions = typeof opts === 'string' ? { title: opts } : opts;
      const toastId = parsed.id || `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = { ...parsed, id: toastId };

      setToasts((prev) => [...prev.slice(-3), newToast]);

      const autoCloseDelay = parsed.duration || (parsed.variant === 'error' ? 6000 : 4000);
      setTimeout(() => {
        removeToast(toastId);
      }, autoCloseDelay);
    },
    [removeToast]
  );

  useEffect(() => {
    toastListeners.add(addToast);
    return () => {
      toastListeners.delete(addToast);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.variant === 'success';
          const isError = t.variant === 'error';
          const isWarning = t.variant === 'warning';

          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 bg-surface',
                isSuccess && 'border-tier-success-border bg-tier-success-bg text-neutral-900',
                isError && 'border-tier-danger-border bg-tier-danger-bg text-neutral-900',
                isWarning && 'border-tier-pending-border bg-tier-pending-bg text-neutral-900',
                !isSuccess && !isError && !isWarning && 'border-neutral-200 text-neutral-900'
              )}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="text-tier-success-text" size={18} />}
                {isError && <AlertCircle className="text-tier-danger-text" size={18} />}
                {isWarning && <AlertTriangle className="text-tier-pending-text" size={18} />}
                {!isSuccess && !isError && !isWarning && <Info className="text-brand-600" size={18} />}
              </div>
              <div className="flex-1 text-xs">
                <div className="font-semibold text-sm">{t.title || t.message}</div>
                {t.description && <div className="text-neutral-600 mt-1">{t.description}</div>}
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick();
                      removeToast(t.id);
                    }}
                    className="mt-2 inline-flex items-center px-2.5 py-1 rounded-md bg-surface border border-neutral-200 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 cursor-pointer"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-neutral-500 hover:text-neutral-900 p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
