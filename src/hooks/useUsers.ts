/**
 * useUsers – Profil-Verwaltung (CRUD + Einladung)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { User, UserCreateData, DbResult, DbDeleteResult } from '../types';

function mapProfile(profile: Record<string, unknown>): User {
  return {
    id:                 profile.id as string,
    firstName:          profile.first_name as string,
    lastName:           profile.last_name as string,
    email:              profile.email as string,
    phone:              (profile.phone as string) || '',
    operatorId:         (profile.operator_id as string) || null,
    isPassive:          (profile.is_passive as boolean)          || false,
    invitedAt:          (profile.invited_at as string)          || null,
    istTrainer:         (profile.ist_trainer as boolean)         || false,
    kannBuchen:         (profile.kann_buchen as boolean)         || false,
    kannGenehmigen:     (profile.kann_genehmigen as boolean)     || false,
    kannVerwalten:      (profile.kann_verwalten as boolean)      || false,
    kannAdministrieren: (profile.kann_administrieren as boolean) || false,
    stammvereinId:      (profile.stammverein_id as string)      || null,
    stammvereinAndere:  (profile.stammverein_andere as string)  ?? null,
  };
}

function mapUserToDb(user: UserCreateData): Record<string, unknown> {
  return {
    first_name:          user.firstName,
    last_name:           user.lastName,
    email:               user.email,
    phone:               user.phone || null,
    operator_id:         user.operatorId || null,
    is_passive:          user.isPassive          || false,
    ist_trainer:         user.istTrainer         || false,
    kann_buchen:         user.kannBuchen         || false,
    kann_genehmigen:     user.kannGenehmigen     || false,
    kann_verwalten:      user.kannVerwalten      || false,
    kann_administrieren: user.kannAdministrieren || false,
    stammverein_id:      user.stammvereinId      || null,
    stammverein_andere:  user.stammvereinAndere  || null,
  };
}

export function useUsers() {
  const { user } = useAuth();
  const [users, setUsersState] = useState<User[]>([]);
  const [loading, setLoading]  = useState(true);
  const [error,   setError]    = useState<string | null>(null);
  const [isDemo,  setIsDemo]   = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const { data, error: e } = await supabase
        .from('profiles')
        .select('*')
        .order('last_name');
      if (e) throw e;
      setUsersState((data || []).map(mapProfile));
      setIsDemo(false);
    } catch (err) { setUsersState([]); setIsDemo(true); setError((err as Error).message); }
    setLoading(false);
  }, [user]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = useCallback(async (userData: UserCreateData): Promise<DbResult<User>> => {
    try {
      const { data, error: e } = await supabase
        .from('profiles')
        .insert(mapUserToDb(userData))
        .select('*')
        .single();
      if (e) throw e;
      const u = mapProfile(data);
      setUsersState(p => [...p, u]);
      return { data: u, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const updateUser = useCallback(async (userId: string, userData: UserCreateData): Promise<DbResult<User>> => {
    try {
      const { data, error: e } = await supabase
        .from('profiles')
        .update(mapUserToDb(userData))
        .eq('id', userId)
        .select('*')
        .single();
      if (e) throw e;
      const u = mapProfile(data);
      setUsersState(p => p.map(x => x.id === userId ? u : x));
      return { data: u, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const deleteUser = useCallback(async (userId: string): Promise<DbDeleteResult> => {
    try {
      const { error: e } = await supabase.from('profiles').delete().eq('id', userId);
      if (e) throw e;
      setUsersState(p => p.filter(u => u.id !== userId));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  const inviteUser = useCallback(async (userId: string): Promise<DbDeleteResult> => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return { error: 'User nicht gefunden' };
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('invite-trainer', {
        body: { profileId: targetUser.id, email: targetUser.email, firstName: targetUser.firstName, lastName: targetUser.lastName },
      });
      if (fnError) return { error: fnError.message };
      if ((result as Record<string, unknown>)?.error) return { error: (result as Record<string, unknown>).error as string };
      await fetchUsers();
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, [users, fetchUsers]);

  const setUsers = useCallback((v: User[]) => setUsersState(v), []);
  return {
    users, setUsers, loading, error, isDemo,
    createUser, updateUser, deleteUser, inviteUser,
    refreshUsers: fetchUsers,
  };
}
