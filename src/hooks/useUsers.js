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
    // aktiv_fuer: Array von club_ids (via Junction-Tabelle trainer_verein_aktiv)
    aktivFuer:          (profile.trainer_verein_aktiv || []).map(r => r.club_id),
    stammvereinId:      profile.stammverein_id      || null,
    stammvereinAndere:  profile.stammverein_andere  ?? null,
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
    stammverein_id:      user.stammvereinId      || null,
    stammverein_andere:  user.stammvereinAndere  || null,
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
      const { data, error: e } = await supabase
        .from('profiles')
        .select('*, trainer_verein_aktiv(club_id)')
        .order('last_name');
      if (e) throw e;
      setUsersState((data || []).map(mapProfile));
      setIsDemo(false);
    } catch (err) { setUsersState([]); setIsDemo(true); setError(err.message); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = useCallback(async (userData) => {
    try {
      const { data, error: e } = await supabase
        .from('profiles')
        .insert(mapUserToDb(userData))
        .select('*, trainer_verein_aktiv(club_id)')
        .single();
      if (e) throw e;
      const u = mapProfile(data);
      setUsersState(p => [...p, u]);
      return { data: u, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateUser = useCallback(async (userId, userData) => {
    try {
      const { data, error: e } = await supabase
        .from('profiles')
        .update(mapUserToDb(userData))
        .eq('id', userId)
        .select('*, trainer_verein_aktiv(club_id)')
        .single();
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
      const { data: result, error: fnError } = await supabase.functions.invoke('invite-trainer', {
        body: { profileId: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      });
      if (fnError) return { error: fnError.message };
      if (result?.error) return { error: result.error };
      await fetchUsers();
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, [users, fetchUsers]);

  // Setzt die "Aktiv für"-Vereinszuordnungen eines Trainers (replace-all)
  const updateTrainerVereine = useCallback(async (trainerId, clubIds) => {
    try {
      // Alle bestehenden Einträge löschen
      const { error: delErr } = await supabase
        .from('trainer_verein_aktiv')
        .delete()
        .eq('trainer_id', trainerId);
      if (delErr) throw delErr;

      // Neue Einträge anlegen (falls vorhanden)
      if (clubIds && clubIds.length > 0) {
        const rows = clubIds.map(club_id => ({ trainer_id: trainerId, club_id }));
        const { error: insErr } = await supabase.from('trainer_verein_aktiv').insert(rows);
        if (insErr) throw insErr;
      }

      // Lokalen State aktualisieren
      setUsersState(prev => prev.map(u =>
        u.id === trainerId ? { ...u, aktivFuer: clubIds || [] } : u
      ));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  const setUsers = useCallback((v) => setUsersState(v), []);
  return {
    users, setUsers, loading, error, isDemo,
    createUser, updateUser, deleteUser, inviteUser,
    updateTrainerVereine,
    refreshUsers: fetchUsers,
  };
}
