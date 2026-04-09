import { useEffect } from 'react';

export default function StatusToast({ status, onDismiss }) {
  useEffect(() => {
    if (!status?.text) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onDismiss?.();
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [status, onDismiss]);

  if (!status?.text) {
    return null;
  }

  const isError = status.type === 'error';

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      <div className={`toast ${isError ? 'toast--error' : 'toast--success'}`} role="status">
        <span>{status.text}</span>
        <button type="button" className="toast__close" onClick={onDismiss} aria-label="Bildirimi kapat">
          ×
        </button>
      </div>
    </div>
  );
}
