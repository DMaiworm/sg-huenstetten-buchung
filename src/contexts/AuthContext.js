import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * AuthContext – stellt den aktuellen Auth-Status und das Profil bereit.
 *
 * Verwendung:
 *   const { user, profile, isAdmin, loading, signIn, signOut } = useAuth();
 *
 * - user:    Supabase Auth User (oder null)
 * - profile: Datensatz aus public.profiles (oder null)
 * - isAdmin: true wenn profile.role === 'admin'
 * - loading: true während der initiale Auth-Check läuft
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /** Lädt das Profil aus public.profiles für den eingeloggten User. */
  const loadProfile = async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      if (error) {
        console.error('Fehler beim Laden des Profils:', error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Unerwarteter Fehler beim Profil-Laden:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Initialen Session-Status prüfen
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      loadProfile(u).finally(() => setLoading(false));
    });

    // Auth State Changes (Login, Logout, Token-Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      loadProfile(u);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Meldet den User mit E-Mail und Passwort an.
   * @returns {{ error: string|null }}
   */
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  /** Meldet den aktuellen User ab. */
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    isAdmin: profile?.role === 'admin',
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook zum Zugriff auf den Auth-Context. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden');
  return ctx;
}
