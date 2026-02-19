import React from 'react';

/**
 * Button – wiederverwendbarer Button mit Varianten.
 * 
 * Kann sowohl über '../ui/Button' als auch '../ui/Badge' importiert werden
 * (Badge.js re-exportiert Button für Backward-Kompatibilität).
 */
const VARIANTS = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200',
  success:   'bg-green-600 hover:bg-green-700 text-white shadow-sm',
  danger:    'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200',
  ghost:     'hover:bg-gray-100 text-gray-500',
};

const SIZES = {
  sm: 'px-2.5 py-1.5 text-xs gap-1',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

export const Button = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => (
  <button
    className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
