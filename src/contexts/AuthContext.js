import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * AuthContext – stellt Auth-Status, Profil und Berechtigungen bereit.
 *
 * - user:        Supabase Auth User
 * - profile:     Datensatz aus public.profiles
 * - isAdmin:     role === 'admin'
 * - isGenehmiger: role === 'genehmiger' || role === 'admin'
 * - canApprove:  true wenn Admin oder Genehmiger
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
    isAdmin:      profile?.role === 'admin',
    isGenehmiger: profile?.role === 'genehmiger' || profile?.role === 'admin',
    canApprove:   profile?.role === 'admin' || profile?.role === 'genehmiger',
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
