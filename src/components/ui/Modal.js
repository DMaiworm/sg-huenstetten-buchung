import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Wiederverwendbarer Modal.
 *
 * Props:
 *   open       - boolean, ob der Modal sichtbar ist
 *   onClose    - Callback zum Schließen
 *   title      - Überschrift
 *   children   - Inhalt
 *   footer     - optionaler Footer-Bereich (Buttons etc.)
 *   maxWidth   - Tailwind max-w Klasse (default: 'max-w-2xl')
 */
const Modal = ({ open, onClose, title, children, footer, maxWidth = 'max-w-2xl' }) => {
  const overlayRef = useRef(null);

  // ESC zum Schließen
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Body-Scroll verhindern wenn offen
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={`bg-white rounded-xl shadow-xl ${maxWidth} w-full max-h-[95vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
