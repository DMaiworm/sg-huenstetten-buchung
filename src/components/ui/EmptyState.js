import React from 'react';

/**
 * Einheitlicher Leer-Zustand.
 *
 * Props:
 *   icon       - Lucide-Icon Komponente
 *   title      - Haupttext
 *   subtitle   - optionaler Untertext
 *   action     - optionaler CTA-Text
 *   onAction   - Callback für CTA
 */
const EmptyState = ({ icon: Icon, title, subtitle, action, onAction }) => (
  <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
    {Icon && <Icon className="w-10 h-10 text-gray-300 mx-auto mb-3" />}
    <p className="text-gray-400 mb-1">{title}</p>
    {subtitle && <p className="text-sm text-gray-400 mb-3">{subtitle}</p>}
    {action && onAction && (
      <button
        onClick={onAction}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        {action}
      </button>
    )}
  </div>
);

export default EmptyState;
