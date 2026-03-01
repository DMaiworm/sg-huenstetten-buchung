import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '../types';

interface AuthContextValue {
  user: SupabaseUser | null;
  profile: Profile | null;
  istTrainer: boolean;
  kannBuchen: boolean;
  kannGenehmigen: boolean;
  kannVerwalten: boolean;
  kannAdministrieren: boolean;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (authUser: SupabaseUser | null) => {
    if (!authUser) { setProfile(null); return; }
    try {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('id', authUser.id).single();
      if (error) { console.error('Profil-Ladefehler:', error.message); setProfile(null); }
      else setProfile(data as Profile);
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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const value: AuthContextValue = {
    user,
    profile,
    istTrainer:         profile?.ist_trainer         ?? false,
    kannBuchen:         profile?.kann_buchen         ?? false,
    kannGenehmigen:     profile?.kann_genehmigen     ?? false,
    kannVerwalten:      (profile?.kann_verwalten || profile?.kann_administrieren) ?? false,
    kannAdministrieren: profile?.kann_administrieren ?? false,
    isAdmin:            profile?.kann_administrieren ?? false,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden');
  return ctx;
}
