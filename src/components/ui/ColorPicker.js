import React from 'react';
import { COLOR_PRESETS } from '../../config/constants';

/**
 * Farbauswahl mit vordefinierten Farben + optionalem Color-Input.
 *
 * Props:
 *   value        - aktuelle Farbe (Hex)
 *   onChange      - Callback(newColor)
 *   showInput    - ob der native Color-Picker angezeigt wird (default: true)
 *   presets      - optionale eigene Presets (default: COLOR_PRESETS)
 *   size         - 'sm' | 'md' (default: 'sm')
 */
const ColorPicker = ({ value, onChange, showInput = true, presets = COLOR_PRESETS, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const inputSize = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {presets.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`${sizeClass} rounded-sm border-2 transition-transform
            ${value === color ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'}`}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
      {showInput && (
        <input
          type="color"
          value={value || '#6b7280'}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputSize} rounded cursor-pointer border-0 ml-1`}
        />
      )}
    </div>
  );
};

export default ColorPicker;
