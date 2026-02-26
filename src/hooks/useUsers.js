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
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        'https://zqjheewhgrmcwzjurjlg.supabase.co/functions/v1/invite-trainer',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ profileId: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }),
        }
      );
      const result = await response.json();
      if (!response.ok || result.error) return { error: result.error || 'Unbekannter Fehler' };
      setUsersState(p => p.map(u => u.id === userId
        ? { ...u, invitedAt: new Date().toISOString(), isPassive: false, kannBuchen: true }
        : u
      ));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, [users]);

  const setUsers = useCallback((v) => setUsersState(v), []);
  return { users, setUsers, loading, error, isDemo, createUser, updateUser, deleteUser, inviteUser, refreshUsers: fetchUsers };
}
