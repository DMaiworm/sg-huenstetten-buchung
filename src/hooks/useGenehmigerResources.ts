/**
 * useGenehmigerResources – Ressourcen-Zuweisungen für Genehmiger
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { GenehmigerResourceAssignment, DbDeleteResult } from '../types';

export function useGenehmigerResources() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<GenehmigerResourceAssignment[]>([]);
  const [loading, setLoading]         = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('genehmiger_resources').select('*');
      if (error) throw error;
      setAssignments((data as GenehmigerResourceAssignment[]) || []);
    } catch (err) { console.warn('Genehmiger-Ressourcen nicht geladen:', (err as Error).message); }
    setLoading(false);
  }, [user]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getResourcesForUser = useCallback((userId: string): string[] =>
    assignments.filter(a => a.user_id === userId).map(a => a.resource_id)
  , [assignments]);

  const getUsersForResource = useCallback((resourceId: string): string[] =>
    assignments.filter(a => a.resource_id === resourceId).map(a => a.user_id)
  , [assignments]);

  const addAssignment = useCallback(async (userId: string, resourceId: string): Promise<DbDeleteResult> => {
    try {
      const { data, error } = await supabase
        .from('genehmiger_resources')
        .insert({ user_id: userId, resource_id: resourceId })
        .select().single();
      if (error) throw error;
      setAssignments(prev => [...prev, data as GenehmigerResourceAssignment]);
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  const removeAssignment = useCallback(async (userId: string, resourceId: string): Promise<DbDeleteResult> => {
    try {
      const { error } = await supabase
        .from('genehmiger_resources')
        .delete()
        .eq('user_id', userId)
        .eq('resource_id', resourceId);
      if (error) throw error;
      setAssignments(prev => prev.filter(a => !(a.user_id === userId && a.resource_id === resourceId)));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  return { assignments, loading, getResourcesForUser, getUsersForResource, addAssignment, removeAssignment, refresh: fetchAll };
}
