import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * AuthContext – stellt Auth-Status und granulare Berechtigungen bereit.
 *
 * Permissions (direkt aus profiles-Flags):
 *   istTrainer        – erscheint als Trainer bei Mannschaften
 *   kannBuchen        – darf Buchungsanfragen stellen
 *   kannGenehmigen    – darf Anfragen genehmigen + eigene Buchungen auto-approved
 *   kannAdministrieren – Zugang zu Verwaltungsbereichen
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (authUser) => {
    if (!authUser) { setProfile(null); return; }
    try {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('id', authUser.id).single();
      if (error) { console.error('Profil-Ladefehler:', error.message); setProfile(null); }
      else setProfile(data);
    } catch (err) { console.error('Unerwarteter Fehler:', err); setProfile(null); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      loadProfile(u).finally(() => setLoading(false));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      loadProfile(u);
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    // Granulare Permission-Flags
    istTrainer:         profile?.ist_trainer         ?? false,
    kannBuchen:         profile?.kann_buchen         ?? false,
    kannGenehmigen:     profile?.kann_genehmigen     ?? false,
    kannAdministrieren: profile?.kann_administrieren ?? false,
    // Convenience: isAdmin bleibt als Alias für kann_administrieren
    isAdmin:            profile?.kann_administrieren ?? false,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden');
  return ctx;
}
