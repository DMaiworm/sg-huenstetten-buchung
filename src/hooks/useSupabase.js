import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Fallback: Wenn Supabase nicht erreichbar, Demo-Daten nutzen
const DEMO_USERS_FALLBACK = [
  { id: 'demo-1', first_name: 'Max', last_name: 'Müller', email: 'max.mueller@sg-huenstetten.de', phone: '0171-1234567', role: 'trainer', operator_id: null },
  { id: 'demo-2', first_name: 'Anna', last_name: 'Schmidt', email: 'anna.schmidt@sg-huenstetten.de', phone: '0172-2345678', role: 'trainer', operator_id: null },
  { id: 'demo-3', first_name: 'Tom', last_name: 'Weber', email: 'tom.weber@sg-huenstetten.de', phone: '0173-3456789', role: 'trainer', operator_id: null },
  { id: 'demo-4', first_name: 'Lisa', last_name: 'Braun', email: 'lisa.braun@sg-huenstetten.de', phone: '0174-4567890', role: 'trainer', operator_id: null },
  { id: 'demo-5', first_name: 'Hans', last_name: 'Meier', email: 'hans.meier@sg-huenstetten.de', phone: '0175-5678901', role: 'trainer', operator_id: null },
  { id: 'demo-6', first_name: 'Peter', last_name: 'König', email: 'peter.koenig@sg-huenstetten.de', phone: '0176-6789012', role: 'admin', operator_id: 'a0000000-0000-0000-0000-000000000001' },
  { id: 'demo-7', first_name: 'Sandra', last_name: 'Fischer', email: 'sandra.fischer@tv-idstein.de', phone: '0177-7890123', role: 'extern', operator_id: null },
  { id: 'demo-8', first_name: 'Michael', last_name: 'Wagner', email: 'm.wagner@tsv-wallrabenstein.de', phone: '0178-8901234', role: 'extern', operator_id: null },
];

/**
 * Konvertiert ein Supabase-Profil in das Legacy-User-Format
 * damit bestehende Komponenten weiterhin funktionieren
 */
function profileToLegacyUser(profile) {
  return {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    phone: profile.phone || '',
    role: profile.role,
    operatorId: profile.operator_id,
    // Legacy-Felder für Abwärtskompatibilität (werden schrittweise entfernt)
    club: '',
    team: '',
  };
}

/**
 * Konvertiert Legacy-User-Format zurück in Supabase-Profil
 */
function legacyUserToProfile(user) {
  return {
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    operator_id: user.operatorId || null,
  };
}

export function useUsers() {
  const [users, setUsersState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  // Users laden
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('last_name', { ascending: true });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setUsersState(data.map(profileToLegacyUser));
        setIsDemo(false);
      } else {
        // Keine Daten in DB → Fallback auf Demo-Daten
        setUsersState(DEMO_USERS_FALLBACK.map(profileToLegacyUser));
        setIsDemo(true);
      }
    } catch (err) {
      console.warn('Supabase nicht erreichbar, nutze Demo-Daten:', err.message);
      setUsersState(DEMO_USERS_FALLBACK.map(profileToLegacyUser));
      setIsDemo(true);
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // User erstellen
  const createUser = useCallback(async (userData) => {
    if (isDemo) {
      const newUser = { ...userData, id: 'demo-' + Date.now() };
      setUsersState(prev => [...prev, newUser]);
      return { data: newUser, error: null };
    }

    try {
      const profile = legacyUserToProfile(userData);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        email_confirm: true,
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
        },
      });

      if (authError) {
        // Fallback: Direkt in profiles einfügen (für Prototyp ohne vollen Auth-Flow)
        const { data, error: insertError } = await supabase
          .from('profiles')
          .insert({ ...profile, id: crypto.randomUUID() })
          .select()
          .single();

        if (insertError) throw insertError;
        const legacyUser = profileToLegacyUser(data);
        setUsersState(prev => [...prev, legacyUser]);
        return { data: legacyUser, error: null };
      }

      await fetchUsers();
      return { data: authData, error: null };
    } catch (err) {
      console.error('Fehler beim Erstellen:', err);
      return { data: null, error: err.message };
    }
  }, [isDemo, fetchUsers]);

  // User aktualisieren
  const updateUser = useCallback(async (userId, userData) => {
    if (isDemo) {
      setUsersState(prev => prev.map(u => u.id === userId ? { ...userData, id: userId } : u));
      return { data: userData, error: null };
    }

    try {
      const profile = legacyUserToProfile(userData);
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) throw updateError;
      const legacyUser = profileToLegacyUser(data);
      setUsersState(prev => prev.map(u => u.id === userId ? legacyUser : u));
      return { data: legacyUser, error: null };
    } catch (err) {
      console.error('Fehler beim Aktualisieren:', err);
      return { data: null, error: err.message };
    }
  }, [isDemo]);

  // User löschen
  const deleteUser = useCallback(async (userId) => {
    if (isDemo) {
      setUsersState(prev => prev.filter(u => u.id !== userId));
      return { error: null };
    }

    try {
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;
      setUsersState(prev => prev.filter(u => u.id !== userId));
      return { error: null };
    } catch (err) {
      console.error('Fehler beim Löschen:', err);
      return { data: null, error: err.message };
    }
  }, [isDemo]);

  // setUsers für Abwärtskompatibilität
  const setUsers = useCallback((newUsersOrUpdater) => {
    if (typeof newUsersOrUpdater === 'function') {
      setUsersState(newUsersOrUpdater);
    } else {
      setUsersState(newUsersOrUpdater);
    }
  }, []);

  return {
    users,
    setUsers,
    loading,
    error,
    isDemo,
    createUser,
    updateUser,
    deleteUser,
    refreshUsers: fetchUsers,
  };
}

export function useOperators() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOperators = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .order('name');

      if (error) throw error;
      setOperators(data || []);
    } catch (err) {
      console.warn('Operators nicht geladen:', err.message);
      setOperators([{
        id: 'a0000000-0000-0000-0000-000000000001',
        name: 'SG Hünstetten',
        type: 'verein',
        primary_color: '#2563eb',
      }]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  return { operators, loading, refreshOperators: fetchOperators };
}
