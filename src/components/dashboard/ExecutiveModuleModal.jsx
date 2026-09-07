import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEscapeHandler } from '../../hooks/useEscapeHandler';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function ExecutiveModuleModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '1000px',
}) {
  const modalRef = useFocusTrap(isOpen);
  useEscapeHandler(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="executive-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        ref={modalRef}
        className="executive-modal-window"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="executive-modal-header">
          <div>
            <h2 className="executive-modal-title">{title}</h2>
            {subtitle ? <p className="executive-modal-subtitle">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="executive-modal-close-btn"
            onClick={onClose}
            aria-label="Kapat"
            title="Kapat"
          >
            <XMarkIcon width={22} height={22} />
          </button>
        </div>

        <div className="executive-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
