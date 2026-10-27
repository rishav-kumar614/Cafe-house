import { useUI } from '../store/ui.js';

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismissToast);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          <span>{t.message}</span>
          <button type="button" className="toast-x" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
