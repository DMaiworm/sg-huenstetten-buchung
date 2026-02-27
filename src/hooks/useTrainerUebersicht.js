/**
 * useTrainerUebersicht – öffentliche Trainer-Daten für Intranet-Übersicht.
 *
 * Lädt alle ist_trainer-Profile mit:
 *   - Öffentlichen Profil-Details (Bio, Foto)
 *   - Lizenzen & Zertifikate
 *   - Erfolge
 *   - Aktiv-für-Vereine
 *
 * Keine Admin-Felder (IBAN, Chip, FZ, Notizen).
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function mapTrainer(row) {
  const det = row.trainer_profile_details;
  return {
    id:        row.id,
    firstName: row.first_name,
    lastName:  row.last_name,
    email:     row.email,
    phone:     row.phone || '',
    // Öffentliche Profil-Details
    bio:       det?.bio       || '',
    photoUrl:  det?.photo_url || null,
    // Lizenzen
    lizenzen: (row.trainer_lizenzen || []).map(l => ({
      id:               l.id,
      bezeichnung:      l.bezeichnung,
      ausstellendeOrg:  l.ausstellende_org  || '',
      ausstellungsdatum: l.ausstellungsdatum || null,
      ablaufdatum:      l.ablaufdatum       || null,
    })),
    // Erfolge
    erfolge: (row.trainer_erfolge || []).map(e => ({
      id:         e.id,
      jahr:       e.jahr,
      mannschaft: e.mannschaft,
      titel:      e.titel,
      sortOrder:  e.sort_order || 0,
    })).sort((a, b) => b.jahr - a.jahr),
  };
}

export function useTrainerUebersicht() {
  const [trainers, setTrainers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

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
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { trainers, loading, error };
}
