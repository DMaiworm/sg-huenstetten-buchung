/**
 * useOperators – Betreiber laden (read-only)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useOperators() {
  const { user } = useAuth();
  const [operators, setOperators] = useState([]);
  const [loading, setLoading]     = useState(true);
  const fetchOperators = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('operators').select('*').order('name');
      if (error) throw error;
      setOperators(data || []);
    } catch { setOperators([]); }
    setLoading(false);
  }, [user]);
  useEffect(() => { fetchOperators(); }, [fetchOperators]);
  return { operators, loading, refreshOperators: fetchOperators };
}
