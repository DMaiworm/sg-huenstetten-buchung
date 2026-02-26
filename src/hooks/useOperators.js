/**
 * useOperators – Betreiber laden (read-only)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useOperators() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading]     = useState(true);
  const fetchOperators = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('operators').select('*').order('name');
      if (error) throw error;
      setOperators(data || []);
    } catch { setOperators([]); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchOperators(); }, [fetchOperators]);
  return { operators, loading, refreshOperators: fetchOperators };
}
