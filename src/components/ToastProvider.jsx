import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

let idSeq = 0;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, { type = 'success', duration = 2500 } = {}) => {
      const id = ++idSeq;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const api = {
    show,
    success: (msg, opts) => show(msg, { ...opts, type: 'success' }),
    error: (msg, opts) => show(msg, { ...opts, type: 'error' }),
    info: (msg, opts) => show(msg, { ...opts, type: 'info' }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed left-1/2 -translate-x-1/2 z-50 top-3 md:top-4 flex flex-col gap-2 w-[92%] max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const tone =
            t.type === 'error'
              ? 'bg-red-600 text-white'
              : t.type === 'info'
              ? 'bg-primaryDark text-white'
              : 'bg-emerald-600 text-white';
          const Icon =
            t.type === 'error'
              ? AlertCircle
              : t.type === 'info'
              ? Info
              : CheckCircle2;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-xl px-3 py-2 shadow-card text-sm font-medium flex items-center gap-2 ${tone}`}
            >
              <Icon size={16} />
              <span className="flex-1">{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
