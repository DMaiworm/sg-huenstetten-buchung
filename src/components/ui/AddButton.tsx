import React from 'react';
import { Plus } from 'lucide-react';

type AddButtonSize = 'sm' | 'md';

interface AddButtonProps {
  label: string;
  onClick: () => void;
  size?: AddButtonSize;
}

const SIZE_STYLES: Record<AddButtonSize, string> = {
  sm: 'py-1.5 text-xs',
  md: 'py-2 text-sm',
};

const AddButton: React.FC<AddButtonProps> = ({ label, onClick, size = 'sm' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full border-2 border-dashed border-gray-200 rounded-lg text-gray-400
      hover:text-blue-600 hover:border-blue-300
      flex items-center justify-center gap-1 transition-colors
      ${SIZE_STYLES[size]}`}
  >
    <Plus className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
    {label}
  </button>
);

export default AddButton;
