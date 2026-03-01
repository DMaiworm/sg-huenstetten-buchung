/**
 * useTrainerProfile – Self-Service für eingeloggte Trainer
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  TrainerProfileDetails, TrainerProfileUpsertData,
  TrainerLizenz, TrainerLizenzCreateData,
  TrainerErfolg, TrainerErfolgCreateData,
  DbResult, DbDeleteResult,
} from '../types';

function mapDetails(row: Record<string, unknown> | null): TrainerProfileDetails | null {
  if (!row) return null;
  return {
    id:                      row.id as string,
    bio:                     (row.bio as string)                     || '',
    photoUrl:                (row.photo_url as string)               || null,
    iban:                    (row.iban as string)                    || '',
    chipId:                  (row.chip_id as string)                 || '',
    fuehrungszeugnisUrl:     (row.fuehrungszeugnis_url as string)    || null,
    fuehrungszeugnisVerified: (row.fuehrungszeugnis_verified as boolean) || false,
    fuehrungszeugnisDate:    (row.fuehrungszeugnis_datum as string)  || null,
    verhaltenskodexUrl:      (row.verhaltenskodex_url as string)     || null,
    verhaltenskodexVerified: (row.verhaltenskodex_verified as boolean) || false,
    unterlagenVollstaendig:  (row.unterlagen_vollstaendig as boolean) || false,
    notizen:                 (row.notizen as string)                 || '',
    profilVeroeffentlichen:  (row.profil_veroeffentlichen as boolean)  || false,
    kontaktVeroeffentlichen: (row.kontakt_veroeffentlichen as boolean) || false,
    adresseStrasse:          (row.adresse_strasse as string)          || '',
    adressePlz:              (row.adresse_plz as string)              || '',
    adresseOrt:              (row.adresse_ort as string)              || '',
    createdAt:               row.created_at as string,
    updatedAt:               row.updated_at as string,
  };
}

function mapLizenz(row: Record<string, unknown>): TrainerLizenz {
  return {
    id:              row.id as string,
    trainerId:       row.trainer_id as string,
    bezeichnung:     row.bezeichnung as string,
    ausstellendeOrg: (row.ausstellende_org as string)  || '',
    ausstellungsdatum: (row.ausstellungsdatum as string) || null,
    ablaufdatum:     (row.ablaufdatum as string)       || null,
    createdAt:       row.created_at as string,
  };
}

function mapErfolg(row: Record<string, unknown>): TrainerErfolg {
  return {
    id:         row.id as string,
    trainerId:  row.trainer_id as string,
    jahr:       row.jahr as number,
    mannschaft: row.mannschaft as string,
    titel:      row.titel as string,
    sortOrder:  (row.sort_order as number) || 0,
    createdAt:  row.created_at as string,
  };
}

export function useTrainerProfile(userId: string | null | undefined) {
  const [details,   setDetails]   = useState<TrainerProfileDetails | null>(null);
  const [lizenzen,  setLizenzen]  = useState<TrainerLizenz[]>([]);
  const [erfolge,   setErfolge]   = useState<TrainerErfolg[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const [detRes, lizRes, erfRes] = await Promise.all([
        supabase.from('trainer_profile_details').select('*').eq('id', userId).maybeSingle(),
        supabase.from('trainer_lizenzen').select('*').eq('trainer_id', userId).order('ausstellungsdatum', { ascending: false }),
        supabase.from('trainer_erfolge').select('*').eq('trainer_id', userId).order('jahr', { ascending: false }),
      ]);
      if (detRes.error) throw detRes.error;
      if (lizRes.error) throw lizRes.error;
      if (erfRes.error) throw erfRes.error;
      setDetails(mapDetails(detRes.data));
      setLizenzen((lizRes.data || []).map(mapLizenz));
      setErfolge((erfRes.data || []).map(mapErfolg));
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const upsertProfile = useCallback(async (data: TrainerProfileUpsertData): Promise<DbDeleteResult> => {
    if (!userId) return { error: 'Nicht eingeloggt' };
    try {
      const dbData: Record<string, unknown> = { id: userId, updated_at: new Date().toISOString() };
      if ('bio' in data)                     dbData.bio = data.bio ?? null;
      if ('photoUrl' in data)                dbData.photo_url = data.photoUrl ?? null;
      if ('iban' in data)                    dbData.iban = data.iban ?? null;
      if ('profilVeroeffentlichen' in data)  dbData.profil_veroeffentlichen  = data.profilVeroeffentlichen;
      if ('kontaktVeroeffentlichen' in data) dbData.kontakt_veroeffentlichen = data.kontaktVeroeffentlichen;
      if ('adresseStrasse' in data)          dbData.adresse_strasse = data.adresseStrasse ?? null;
      if ('adressePlz'     in data)          dbData.adresse_plz     = data.adressePlz     ?? null;
      if ('adresseOrt'     in data)          dbData.adresse_ort     = data.adresseOrt     ?? null;
      const { data: row, error: e } = await supabase
        .from('trainer_profile_details')
        .upsert(dbData, { onConflict: 'id' })
        .select()
        .single();
      if (e) throw e;
      setDetails(mapDetails(row));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, [userId]);

  const uploadPhoto = useCallback(async (file: File): Promise<{ photoUrl?: string; error: string | null }> => {
    if (!userId) return { error: 'Nicht eingeloggt' };
    try {
      const ext  = file.name.split('.').pop();
      const path = `${userId}/profil.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('trainer-fotos')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('trainer-fotos').getPublicUrl(path);
      const photoUrl = urlData.publicUrl;
      const { error: updErr } = await supabase
        .from('trainer_profile_details')
        .upsert({ id: userId, photo_url: photoUrl, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (updErr) throw updErr;
      setDetails(d => d ? { ...d, photoUrl } : { photoUrl } as unknown as TrainerProfileDetails);
      return { photoUrl, error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, [userId]);

  const uploadFuehrungszeugnis = useCallback(async (file: File): Promise<{ url?: string; error: string | null }> => {
    if (!userId) return { error: 'Nicht eingeloggt' };
    try {
      const ext  = file.name.split('.').pop();
      const path = `${userId}/fuehrungszeugnis.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('trainer-dokumente')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: signedData, error: signErr } = await supabase.storage
        .from('trainer-dokumente')
        .createSignedUrl(path, 60 * 60 * 24 * 60);
      if (signErr) throw signErr;
      const url = signedData.signedUrl;
      const { error: updErr } = await supabase
        .from('trainer_profile_details')
        .upsert({ id: userId, fuehrungszeugnis_url: path, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (updErr) throw updErr;
      setDetails(d => d ? { ...d, fuehrungszeugnisUrl: path } : { fuehrungszeugnisUrl: path } as unknown as TrainerProfileDetails);
      return { url, error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, [userId]);

  const uploadVerhaltenskodex = useCallback(async (file: File): Promise<DbDeleteResult> => {
    if (!userId) return { error: 'Nicht eingeloggt' };
    try {
      const ext  = file.name.split('.').pop();
      const path = `${userId}/verhaltenskodex.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('trainer-dokumente')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { error: updErr } = await supabase
        .from('trainer_profile_details')
        .upsert({ id: userId, verhaltenskodex_url: path, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (updErr) throw updErr;
      setDetails(d => d ? { ...d, verhaltenskodexUrl: path } : { verhaltenskodexUrl: path } as unknown as TrainerProfileDetails);
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, [userId]);

  const addLizenz = useCallback(async (data: TrainerLizenzCreateData): Promise<DbResult<TrainerLizenz>> => {
    if (!userId) return { data: null, error: 'Nicht eingeloggt' };
    try {
      const { data: row, error: e } = await supabase.from('trainer_lizenzen').insert({
        trainer_id:       userId,
        bezeichnung:      data.bezeichnung,
        ausstellende_org: data.ausstellendeOrg || null,
        ausstellungsdatum: data.ausstellungsdatum || null,
        ablaufdatum:      data.ablaufdatum || null,
      }).select().single();
      if (e) throw e;
      const mapped = mapLizenz(row);
      setLizenzen(prev => [mapped, ...prev]);
      return { data: mapped, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, [userId]);

  const updateLizenz = useCallback(async (id: string, data: TrainerLizenzCreateData): Promise<DbDeleteResult> => {
    try {
      const { data: row, error: e } = await supabase.from('trainer_lizenzen').update({
        bezeichnung:      data.bezeichnung,
        ausstellende_org: data.ausstellendeOrg || null,
        ausstellungsdatum: data.ausstellungsdatum || null,
        ablaufdatum:      data.ablaufdatum || null,
      }).eq('id', id).select().single();
      if (e) throw e;
      setLizenzen(prev => prev.map(l => l.id === id ? mapLizenz(row) : l));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  const deleteLizenz = useCallback(async (id: string): Promise<DbDeleteResult> => {
    try {
      const { error: e } = await supabase.from('trainer_lizenzen').delete().eq('id', id);
      if (e) throw e;
      setLizenzen(prev => prev.filter(l => l.id !== id));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  const addErfolg = useCallback(async (data: TrainerErfolgCreateData): Promise<DbResult<TrainerErfolg>> => {
    if (!userId) return { data: null, error: 'Nicht eingeloggt' };
    try {
      const { data: row, error: e } = await supabase.from('trainer_erfolge').insert({
        trainer_id: userId,
        jahr:       data.jahr,
        mannschaft: data.mannschaft,
        titel:      data.titel,
        sort_order: data.sortOrder || 0,
      }).select().single();
      if (e) throw e;
      const mapped = mapErfolg(row);
      setErfolge(prev => [mapped, ...prev]);
      return { data: mapped, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, [userId]);

  const updateErfolg = useCallback(async (id: string, data: TrainerErfolgCreateData): Promise<DbDeleteResult> => {
    try {
      const { data: row, error: e } = await supabase.from('trainer_erfolge').update({
        jahr:       data.jahr,
        mannschaft: data.mannschaft,
        titel:      data.titel,
        sort_order: data.sortOrder || 0,
      }).eq('id', id).select().single();
      if (e) throw e;
      setErfolge(prev => prev.map(x => x.id === id ? mapErfolg(row) : x));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  const deleteErfolg = useCallback(async (id: string): Promise<DbDeleteResult> => {
    try {
      const { error: e } = await supabase.from('trainer_erfolge').delete().eq('id', id);
      if (e) throw e;
      setErfolge(prev => prev.filter(x => x.id !== id));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  const updateContactInfo = useCallback(async ({ email, phone }: { email?: string; phone?: string }): Promise<DbDeleteResult> => {
    if (!userId) return { error: 'Nicht eingeloggt' };
    try {
      const { error: e } = await supabase
        .from('profiles')
        .update({ email: email || null, phone: phone || null })
        .eq('id', userId);
      if (e) throw e;
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, [userId]);

  return {
    details, lizenzen, erfolge,
    loading, error,
    upsertProfile, updateContactInfo, uploadPhoto, uploadFuehrungszeugnis, uploadVerhaltenskodex,
    addLizenz, updateLizenz, deleteLizenz,
    addErfolg, updateErfolg, deleteErfolg,
    refresh: fetchAll,
  };
}
