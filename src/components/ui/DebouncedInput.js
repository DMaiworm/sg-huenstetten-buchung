import React, { useState, useRef, useEffect } from 'react';

/**
 * Input der erst nach einer Pause den Wert nach außen gibt.
 * Verhindert DB-Writes bei jedem Tastendruck.
 *
 * Props:
 *   value      - externer Wert
 *   onChange    - Callback(newValue) nach Debounce
 *   delay      - Debounce-Delay in ms (default: 800)
 *   ...rest    - alle weiteren Props werden an <input> weitergegeben
 */
const DebouncedInput = ({ value, onChange, delay = 800, ...rest }) => {
  const [local, setLocal] = useState(value);
  const timer = useRef(null);

  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), delay);
  };

  // Sync wenn sich der externe Wert ändert (z.B. nach DB-Refresh)
  useEffect(() => { setLocal(value); }, [value]);

  // Cleanup
  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  return <input type="text" value={local} onChange={handleChange} {...rest} />;
};

export default DebouncedInput;
