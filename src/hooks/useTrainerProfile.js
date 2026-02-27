/**
 * useTrainerProfile – Self-Service für eingeloggte Trainer
 *
 * Lädt und verwaltet:
 *   - trainer_profile_details (1:1 zu profiles)
 *   - trainer_lizenzen (1:n)
 *   - trainer_erfolge (1:n)
 *   - Foto-Upload in Supabase Storage "trainer-fotos"
 *   - Führungszeugnis-Upload in Supabase Storage "trainer-dokumente"
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function mapDetails(row) {
  if (!row) return null;
  return {
    id:                      row.id,
    bio:                     row.bio                     || '',
    photoUrl:                row.photo_url               || null,
    iban:                    row.iban                    || '',
    chipId:                  row.chip_id                 || '',
    fuehrungszeugnisUrl:     row.fuehrungszeugnis_url    || null,
    fuehrungszeugnisVerified: row.fuehrungszeugnis_verified || false,
    fuehrungszeugnisDate:    row.fuehrungszeugnis_datum  || null,
    unterlagenVollstaendig:  row.unterlagen_vollstaendig || false,
    notizen:                 row.notizen                 || '',
    profilVeroeffentlichen:  row.profil_veroeffentlichen  || false,
    kontaktVeroeffentlichen: row.kontakt_veroeffentlichen || false,
    createdAt:               row.created_at,
    updatedAt:               row.updated_at,
  };
}

function mapLizenz(row) {
  return {
    id:              row.id,
    trainerId:       row.trainer_id,
    bezeichnung:     row.bezeichnung,
    ausstellendeOrg: row.ausstellende_org  || '',
    ausstellungsdatum: row.ausstellungsdatum || null,
    ablaufdatum:     row.ablaufdatum       || null,
    createdAt:       row.created_at,
  };
}

function mapErfolg(row) {
  return {
    id:         row.id,
    trainerId:  row.trainer_id,
    jahr:       row.jahr,
    mannschaft: row.mannschaft,
    titel:      row.titel,
    sortOrder:  row.sort_order || 0,
    createdAt:  row.created_at,
  };
}

export function useTrainerProfile(userId) {
  const [details,   setDetails]   = useState(null);
  const [lizenzen,  setLizenzen]  = useState([]);
  const [erfolge,   setErfolge]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

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
      setError(err.message);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Profil anlegen oder aktualisieren (nur explizit übergebene Felder werden gesetzt)
  const upsertProfile = useCallback(async (data) => {
    if (!userId) return { error: 'Nicht eingeloggt' };
    try {
      const dbData = { id: userId, updated_at: new Date().toISOString() };
      if ('bio' in data)                     dbData.bio = data.bio ?? null;
      if ('photoUrl' in data)                dbData.photo_url = data.photoUrl ?? null;
      if ('iban' in data)                    dbData.iban = data.iban ?? null;
      if ('profilVeroeffentlichen' in data)  dbData.profil_veroeffentlichen  = data.profilVeroeffentlichen;
      if ('kontaktVeroeffentlichen' in data) dbData.kontakt_veroeffentlichen = data.kontaktVeroeffentlichen;
      const { data: row, error: e } = await supabase
        .from('trainer_profile_details')
        .upsert(dbData, { onConflict: 'id' })
        .select()
        .single();
      if (e) throw e;
      setDetails(mapDetails(row));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, [userId]);

  // Foto hochladen → photo_url in trainer_profile_details speichern
  const uploadPhoto = useCallback(async (file) => {
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
      setDetails(d => d ? { ...d, photoUrl } : { photoUrl });
      return { photoUrl, error: null };
    } catch (err) { return { error: err.message }; }
  }, [userId]);

  // Führungszeugnis hochladen (privates Bucket)
  const uploadFuehrungszeugnis = useCallback(async (file) => {
    if (!userId) return { error: 'Nicht eingeloggt' };
    try {
      const ext  = file.name.split('.').pop();
      const path = `${userId}/fuehrungszeugnis.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('trainer-dokumente')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      // Signed URL (60 Tage) zum Speichern
      const { data: signedData, error: signErr } = await supabase.storage
        .from('trainer-dokumente')
        .createSignedUrl(path, 60 * 60 * 24 * 60);
      if (signErr) throw signErr;
      const url = signedData.signedUrl;
      const { error: updErr } = await supabase
        .from('trainer_profile_details')
        .upsert({ id: userId, fuehrungszeugnis_url: path, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (updErr) throw updErr;
      setDetails(d => d ? { ...d, fuehrungszeugnisUrl: path } : { fuehrungszeugnisUrl: path });
      return { url, error: null };
    } catch (err) { return { error: err.message }; }
  }, [userId]);

  // Lizenzen
  const addLizenz = useCallback(async (data) => {
    if (!userId) return { error: 'Nicht eingeloggt' };
    try {
      const { data: row, error: e } = await supabase.from('trainer_lizenzen').insert({
        trainer_id:       userId,
        bezeichnung:      data.bezeichnung,
        ausstellende_org: data.ausstellendeOrg || null,
        ausstellungsdatum: data.ausstellungsdatum || null,
        ablaufdatum:      data.ablaufdatum || null,
      }).select().single();
      if (e) throw e;
      setLizenzen(prev => [mapLizenz(row), ...prev]);
      return { data: mapLizenz(row), error: null };
    } catch (err) { return { error: err.message }; }
  }, [userId]);

  const updateLizenz = useCallback(async (id, data) => {
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
    } catch (err) { return { error: err.message }; }
  }, []);

  const deleteLizenz = useCallback(async (id) => {
    try {
      const { error: e } = await supabase.from('trainer_lizenzen').delete().eq('id', id);
      if (e) throw e;
      setLizenzen(prev => prev.filter(l => l.id !== id));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  // Erfolge
  const addErfolg = useCallback(async (data) => {
    if (!userId) return { error: 'Nicht eingeloggt' };
    try {
      const { data: row, error: e } = await supabase.from('trainer_erfolge').insert({
        trainer_id: userId,
        jahr:       data.jahr,
        mannschaft: data.mannschaft,
        titel:      data.titel,
        sort_order: data.sortOrder || 0,
      }).select().single();
      if (e) throw e;
      setErfolge(prev => [mapErfolg(row), ...prev]);
      return { data: mapErfolg(row), error: null };
    } catch (err) { return { error: err.message }; }
  }, [userId]);

  const updateErfolg = useCallback(async (id, data) => {
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
    } catch (err) { return { error: err.message }; }
  }, []);

  const deleteErfolg = useCallback(async (id) => {
    try {
      const { error: e } = await supabase.from('trainer_erfolge').delete().eq('id', id);
      if (e) throw e;
      setErfolge(prev => prev.filter(x => x.id !== id));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  // Eigene Kontaktdaten (email, phone) in profiles aktualisieren
  const updateContactInfo = useCallback(async ({ email, phone }) => {
    if (!userId) return { error: 'Nicht eingeloggt' };
    try {
      const { error: e } = await supabase
        .from('profiles')
        .update({ email: email || null, phone: phone || null })
        .eq('id', userId);
      if (e) throw e;
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, [userId]);

  return {
    details, lizenzen, erfolge,
    loading, error,
    upsertProfile, updateContactInfo, uploadPhoto, uploadFuehrungszeugnis,
    addLizenz, updateLizenz, deleteLizenz,
    addErfolg, updateErfolg, deleteErfolg,
    refresh: fetchAll,
  };
}
