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

export const toast = {
  success: (msg: string, desc?: string) => {
    emitToast({ title: msg, description: desc, variant: 'success' });
  },
  error: (msg: string, desc?: string) => {
    emitToast({ title: msg, description: desc, variant: 'error' });
  },
  info: (msg: string, desc?: string) => {
    emitToast({ title: msg, description: desc, variant: 'info' });
  },
  warning: (msg: string, desc?: string) => {
    emitToast({ title: msg, description: desc, variant: 'warning' });
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
                'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-right-full bg-[var(--surface-card)]',
                isSuccess && 'border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--text-main)]',
                isError && 'border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--text-main)]',
                isWarning && 'border-[var(--status-attention-border)] bg-[var(--status-attention-bg)] text-[var(--text-main)]',
                !isSuccess && !isError && !isWarning && 'border-[var(--border-subtle)] text-[var(--text-main)]'
              )}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="text-[var(--status-success-fg)]" size={18} />}
                {isError && <AlertCircle className="text-[var(--status-danger-fg)]" size={18} />}
                {isWarning && <AlertTriangle className="text-[var(--status-attention-fg)]" size={18} />}
                {!isSuccess && !isError && !isWarning && <Info className="text-primary" size={18} />}
              </div>
              <div className="flex-1 text-xs">
                <div className="font-semibold text-sm">{t.title || t.message}</div>
                {t.description && <div className="text-[var(--text-muted)] mt-1">{t.description}</div>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-main)] p-0.5"
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
