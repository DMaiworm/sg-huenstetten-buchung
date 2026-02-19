import React from 'react';

const VARIANTS = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  success: 'bg-green-600 text-white hover:bg-green-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent hover:bg-gray-100',
};

const SIZES = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

export const Button = ({ children, variant = 'primary', size = 'md', className = '', disabled, ...props }) => (
  <button
    className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors
      ${VARIANTS[variant] || VARIANTS.primary}
      ${SIZES[size] || SIZES.md}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${className}`}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

export default Button;
