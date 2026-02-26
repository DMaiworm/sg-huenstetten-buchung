/**
 * useUsers – Profil-Verwaltung (CRUD + Einladung)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function mapProfile(profile) {
  return {
    id:                 profile.id,
    firstName:          profile.first_name,
    lastName:           profile.last_name,
    email:              profile.email,
    phone:              profile.phone || '',
    operatorId:         profile.operator_id,
    isPassive:          profile.is_passive          || false,
    invitedAt:          profile.invited_at          || null,
    istTrainer:         profile.ist_trainer         || false,
    kannBuchen:         profile.kann_buchen         || false,
    kannGenehmigen:     profile.kann_genehmigen     || false,
    kannAdministrieren: profile.kann_administrieren || false,
  };
}

function mapUserToDb(user) {
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
    kann_administrieren: user.kannAdministrieren || false,
  };
}

export function useUsers() {
  const [users, setUsersState] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [error,   setError]    = useState(null);
  const [isDemo,  setIsDemo]   = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: e } = await supabase.from('profiles').select('*').order('last_name');
      if (e) throw e;
      setUsersState((data || []).map(mapProfile));
      setIsDemo(false);
    } catch (err) { setUsersState([]); setIsDemo(true); setError(err.message); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = useCallback(async (userData) => {
    try {
      const { data, error: e } = await supabase.from('profiles').insert(mapUserToDb(userData)).select().single();
      if (e) throw e;
      const u = mapProfile(data);
      setUsersState(p => [...p, u]);
      return { data: u, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateUser = useCallback(async (userId, userData) => {
    try {
      const { data, error: e } = await supabase.from('profiles').update(mapUserToDb(userData)).eq('id', userId).select().single();
      if (e) throw e;
      const u = mapProfile(data);
      setUsersState(p => p.map(x => x.id === userId ? u : x));
      return { data: u, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const deleteUser = useCallback(async (userId) => {
    try {
      const { error: e } = await supabase.from('profiles').delete().eq('id', userId);
      if (e) throw e;
      setUsersState(p => p.filter(u => u.id !== userId));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  const inviteUser = useCallback(async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return { error: 'User nicht gefunden' };
    try {
      // supabase.functions.invoke() setzt Auth-Header automatisch korrekt (kein manueller fetch)
      const { data: result, error: fnError } = await supabase.functions.invoke('invite-trainer', {
        body: { profileId: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      });
      if (fnError) return { error: fnError.message };
      if (result?.error) return { error: result.error };
      // Benutzerliste neu laden – UUID kann sich durch den Invite-Prozess geändert haben
      await fetchUsers();
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, [users, fetchUsers]);

  const setUsers = useCallback((v) => setUsersState(v), []);
  return { users, setUsers, loading, error, isDemo, createUser, updateUser, deleteUser, inviteUser, refreshUsers: fetchUsers };
}
