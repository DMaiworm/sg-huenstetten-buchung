import React from 'react';
import { Plus } from 'lucide-react';

/**
 * Einheitlicher "Hinzufügen"-Button im Dashed-Border-Stil.
 * Wird in FacilityManagement, OrganizationManagement etc. verwendet.
 *
 * Props:
 *   label    - Button-Text (z.B. 'Neue Ressource')
 *   onClick  - Callback
 *   size     - 'sm' | 'md' (default: 'sm')
 */
const AddButton = ({ label, onClick, size = 'sm' }) => {
  const sizeStyles = {
    sm: 'py-1.5 text-xs',
    md: 'py-2 text-sm',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full border-2 border-dashed border-gray-200 rounded-lg text-gray-400
        hover:text-blue-600 hover:border-blue-300
        flex items-center justify-center gap-1 transition-colors
        ${sizeStyles[size] || sizeStyles.sm}`}
    >
      <Plus className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {label}
    </button>
  );
};

export default AddButton;
