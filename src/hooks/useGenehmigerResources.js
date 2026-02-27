/**
 * useGenehmigerResources – Ressourcen-Zuweisungen für Genehmiger
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useGenehmigerResources() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('genehmiger_resources').select('*');
      if (error) throw error;
      setAssignments(data || []);
    } catch (err) { console.warn('Genehmiger-Ressourcen nicht geladen:', err.message); }
    setLoading(false);
  }, [user]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getResourcesForUser = useCallback((userId) =>
    assignments.filter(a => a.user_id === userId).map(a => a.resource_id)
  , [assignments]);

  const getUsersForResource = useCallback((resourceId) =>
    assignments.filter(a => a.resource_id === resourceId).map(a => a.user_id)
  , [assignments]);

  const addAssignment = useCallback(async (userId, resourceId) => {
    try {
      const { data, error } = await supabase
        .from('genehmiger_resources')
        .insert({ user_id: userId, resource_id: resourceId })
        .select().single();
      if (error) throw error;
      setAssignments(prev => [...prev, data]);
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  const removeAssignment = useCallback(async (userId, resourceId) => {
    try {
      const { error } = await supabase
        .from('genehmiger_resources')
        .delete()
        .eq('user_id', userId)
        .eq('resource_id', resourceId);
      if (error) throw error;
      setAssignments(prev => prev.filter(a => !(a.user_id === userId && a.resource_id === resourceId)));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  return { assignments, loading, getResourcesForUser, getUsersForResource, addAssignment, removeAssignment, refresh: fetchAll };
}
