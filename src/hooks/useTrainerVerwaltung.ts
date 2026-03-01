/**
 * useTrainerVerwaltung – Admin-Hook für Trainer-Übersicht
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  TrainerVerwaltungEntry, TrainerVerwaltungDetails,
  TrainerLizenzPublic, TrainerErfolgPublic,
  TrainerAdminFieldsUpdate, DbDeleteResult,
} from '../types';

function mapTrainerDetails(row: Record<string, unknown> | null): TrainerVerwaltungDetails | null {
  if (!row) return null;
  return {
    bio:                      (row.bio as string)                      || '',
    photoUrl:                 (row.photo_url as string)                || null,
    iban:                     (row.iban as string)                     || '',
    chipId:                   (row.chip_id as string)                  || '',
    fuehrungszeugnisUrl:      (row.fuehrungszeugnis_url as string)     || null,
    fuehrungszeugnisVerified: (row.fuehrungszeugnis_verified as boolean) || false,
    fuehrungszeugnisDate:     (row.fuehrungszeugnis_datum as string)   || null,
    verhaltenskodexUrl:       (row.verhaltenskodex_url as string)      || null,
    verhaltenskodexVerified:  (row.verhaltenskodex_verified as boolean) || false,
    unterlagenVollstaendig:   (row.unterlagen_vollstaendig as boolean)  || false,
    notizen:                  (row.notizen as string)                  || '',
  };
}

function mapTrainer(profile: Record<string, unknown>): TrainerVerwaltungEntry {
  return {
    id:                 profile.id as string,
    firstName:          profile.first_name as string,
    lastName:           profile.last_name as string,
    email:              profile.email as string,
    phone:              (profile.phone as string)              || '',
    operatorId:         (profile.operator_id as string)        || null,
    invitedAt:          (profile.invited_at as string)         || null,
    kannBuchen:         (profile.kann_buchen as boolean)        || false,
    kannGenehmigen:     (profile.kann_genehmigen as boolean)    || false,
    kannAdministrieren: (profile.kann_administrieren as boolean)|| false,
    details:            mapTrainerDetails(profile.trainer_profile_details as Record<string, unknown> | null),
    lizenzen:           ((profile.trainer_lizenzen as Record<string, unknown>[])  || []).map((l): TrainerLizenzPublic => ({
      id:              l.id as string,
      bezeichnung:     l.bezeichnung as string,
      ausstellendeOrg: (l.ausstellende_org as string)  || '',
      ausstellungsdatum: (l.ausstellungsdatum as string) || null,
      ablaufdatum:     (l.ablaufdatum as string)       || null,
    })),
    erfolge: ((profile.trainer_erfolge as Record<string, unknown>[]) || []).map((e): TrainerErfolgPublic => ({
      id:         e.id as string,
      jahr:       e.jahr as number,
      mannschaft: e.mannschaft as string,
      titel:      e.titel as string,
      sortOrder:  (e.sort_order as number) || 0,
    })),
  };
}

export function useTrainerVerwaltung(operatorId: string | null = null) {
  const [trainers, setTrainers] = useState<TrainerVerwaltungEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          trainer_profile_details(*),
          trainer_lizenzen(*),
          trainer_erfolge(*)
        `)
        .eq('ist_trainer', true)
        .order('last_name');

      if (operatorId) {
        query = query.eq('operator_id', operatorId);
      }

      const { data, error: e } = await query;
      if (e) throw e;
      setTrainers((data || []).map(mapTrainer));
    } catch (err) {
      setError((err as Error).message);
      setTrainers([]);
    }
    setLoading(false);
  }, [operatorId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateAdminFields = useCallback(async (trainerId: string, data: TrainerAdminFieldsUpdate): Promise<DbDeleteResult> => {
    try {
      const dbData: Record<string, unknown> = {
        id: trainerId,
        updated_at: new Date().toISOString(),
      };
      if (data.chipId                  !== undefined) dbData.chip_id                  = data.chipId || null;
      if (data.fuehrungszeugnisVerified !== undefined) dbData.fuehrungszeugnis_verified = data.fuehrungszeugnisVerified;
      if (data.fuehrungszeugnisDate    !== undefined) dbData.fuehrungszeugnis_datum   = data.fuehrungszeugnisDate || null;
      if (data.verhaltenskodexVerified !== undefined) dbData.verhaltenskodex_verified  = data.verhaltenskodexVerified;
      if (data.unterlagenVollstaendig  !== undefined) dbData.unterlagen_vollstaendig  = data.unterlagenVollstaendig;
      if (data.notizen                 !== undefined) dbData.notizen                  = data.notizen || null;

      const { error: e } = await supabase
        .from('trainer_profile_details')
        .upsert(dbData, { onConflict: 'id' });
      if (e) throw e;

      setTrainers(prev => prev.map(t => {
        if (t.id !== trainerId) return t;
        return { ...t, details: { ...(t.details || {} as TrainerVerwaltungDetails), ...mapTrainerDetails(dbData) } as TrainerVerwaltungDetails };
      }));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  const uploadDocumentForTrainer = useCallback(async (trainerId: string, docType: 'fuehrungszeugnis' | 'verhaltenskodex', file: File): Promise<DbDeleteResult> => {
    try {
      const ext  = file.name.split('.').pop();
      const path = `${trainerId}/${docType}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('trainer-dokumente')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const urlField = docType === 'fuehrungszeugnis' ? 'fuehrungszeugnis_url' : 'verhaltenskodex_url';
      const { error: updErr } = await supabase
        .from('trainer_profile_details')
        .upsert({ id: trainerId, [urlField]: path, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (updErr) throw updErr;
      const urlKey = docType === 'fuehrungszeugnis' ? 'fuehrungszeugnisUrl' : 'verhaltenskodexUrl';
      setTrainers(prev => prev.map(t => {
        if (t.id !== trainerId) return t;
        return { ...t, details: { ...(t.details || {} as TrainerVerwaltungDetails), [urlKey]: path } as TrainerVerwaltungDetails };
      }));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  return { trainers, loading, error, refresh: fetchAll, updateAdminFields, uploadDocumentForTrainer };
}
