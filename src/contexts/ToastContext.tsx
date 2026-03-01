/**
 * ToastContext – globales In-App-Feedback (Erfolg, Fehler, Info).
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { Toast, ToastVariant } from '../types';

interface ToastContextValue {
  addToast: (message: string, type?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DAUER_MS = 4000;

const TOAST_STILE: Record<ToastVariant, { container: string; icon: React.ReactElement }> = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />,
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />,
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const stil = TOAST_STILE[toast.type] || TOAST_STILE.info;
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-md text-sm font-medium
        animate-[fadeInDown_0.2s_ease-out] ${stil.container}`}
      role="alert"
    >
      {stil.icon}
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-1"
        aria-label="Meldung schließen"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastVariant = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), TOAST_DAUER_MS);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast-Container – oben rechts, über allem anderen */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast muss innerhalb von ToastProvider verwendet werden');
  return ctx;
}
