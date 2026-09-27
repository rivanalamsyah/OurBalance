import { useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import type { Toast, ToastType } from '../../contexts/ToastContext';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={17} />,
  error: <AlertCircle size={17} />,
  warning: <AlertTriangle size={17} />,
  info: <Info size={17} />,
};

const DURATION_MS = 4000;

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    // Animate the progress bar from 100% → 0% over duration
    el.style.transition = 'none';
    el.style.width = '100%';
    // Force reflow so the transition starts from 100%
    void el.offsetWidth;
    el.style.transition = `width ${DURATION_MS}ms linear`;
    el.style.width = '0%';
  }, [toast.id]);

  return (
    <div
      className={`toast toast-${toast.type} animate-slide-in`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <span className="toast-icon">{icons[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => onRemove(toast.id)}
        aria-label="Tutup notifikasi"
      >
        <X size={14} />
      </button>
      {/* Auto-dismiss progress bar */}
      <div className="toast-progress-track">
        <div ref={progressRef} className={`toast-progress-bar toast-progress-${toast.type}`} />
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-label="Notifikasi" role="region">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}
