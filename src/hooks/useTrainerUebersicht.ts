/**
 * useTrainerUebersicht – öffentliche Trainer-Daten für Intranet-Übersicht.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TrainerUebersichtEntry, TrainerLizenzPublic, TrainerErfolgPublic } from '../types';

function mapTrainer(row: Record<string, unknown>): TrainerUebersichtEntry {
  const det = row.trainer_profile_details as Record<string, unknown> | null;
  return {
    id:        row.id as string,
    firstName: row.first_name as string,
    lastName:  row.last_name as string,
    email:     row.email as string,
    phone:     (row.phone as string) || '',
    bio:       (det?.bio as string)       || '',
    photoUrl:  (det?.photo_url as string) || null,
    lizenzen: ((row.trainer_lizenzen as Record<string, unknown>[]) || []).map((l): TrainerLizenzPublic => ({
      id:               l.id as string,
      bezeichnung:      l.bezeichnung as string,
      ausstellendeOrg:  (l.ausstellende_org as string)  || '',
      ausstellungsdatum: (l.ausstellungsdatum as string) || null,
      ablaufdatum:      (l.ablaufdatum as string)       || null,
    })),
    erfolge: ((row.trainer_erfolge as Record<string, unknown>[]) || []).map((e): TrainerErfolgPublic => ({
      id:         e.id as string,
      jahr:       e.jahr as number,
      mannschaft: e.mannschaft as string,
      titel:      e.titel as string,
      sortOrder:  (e.sort_order as number) || 0,
    })).sort((a, b) => b.jahr - a.jahr),
  };
}

export function useTrainerUebersicht() {
  const [trainers, setTrainers] = useState<TrainerUebersichtEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: e } = await supabase
        .from('profiles')
        .select(`
          id, first_name, last_name, email, phone,
          trainer_profile_details(bio, photo_url),
          trainer_lizenzen(id, bezeichnung, ausstellende_org, ausstellungsdatum, ablaufdatum),
          trainer_erfolge(id, jahr, mannschaft, titel, sort_order)
        `)
        .eq('ist_trainer', true)
        .order('last_name');
      if (e) throw e;
      setTrainers((data || []).map(mapTrainer));
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { trainers, loading, error };
}
