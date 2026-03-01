import React, { useState, useRef, useEffect } from 'react';

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
}

const DebouncedInput: React.FC<DebouncedInputProps> = ({ value, onChange, delay = 800, ...rest }) => {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), delay);
  };

  // Sync wenn sich der externe Wert ändert (z.B. nach DB-Refresh)
  useEffect(() => { setLocal(value); }, [value]);

  // Cleanup
  useEffect(() => {
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  return <input type="text" value={local} onChange={handleChange} {...rest} />;
};

export default DebouncedInput;
