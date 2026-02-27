/**
 * useTrainerVerwaltung – Admin-Hook für Trainer-Übersicht
 *
 * Lädt alle Trainer-Profile (ist_trainer = true) inkl. Details,
 * Lizenzen, Erfolgen und Team-Zuordnungen.
 * Admins ohne operator_id sehen alle; Verwalter mit operator_id sehen nur ihren Verein.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function mapTrainerDetails(row) {
  if (!row) return null;
  return {
    bio:                      row.bio                      || '',
    photoUrl:                 row.photo_url                || null,
    iban:                     row.iban                     || '',
    chipId:                   row.chip_id                  || '',
    fuehrungszeugnisUrl:      row.fuehrungszeugnis_url     || null,
    fuehrungszeugnisVerified: row.fuehrungszeugnis_verified || false,
    fuehrungszeugnisDate:     row.fuehrungszeugnis_datum   || null,
    verhaltenskodexUrl:       row.verhaltenskodex_url      || null,
    verhaltenskodexVerified:  row.verhaltenskodex_verified || false,
    unterlagenVollstaendig:   row.unterlagen_vollstaendig  || false,
    notizen:                  row.notizen                  || '',
  };
}

function mapTrainer(profile) {
  return {
    id:                 profile.id,
    firstName:          profile.first_name,
    lastName:           profile.last_name,
    email:              profile.email,
    phone:              profile.phone              || '',
    operatorId:         profile.operator_id,
    invitedAt:          profile.invited_at         || null,
    kannBuchen:         profile.kann_buchen        || false,
    kannGenehmigen:     profile.kann_genehmigen    || false,
    kannAdministrieren: profile.kann_administrieren|| false,
    details:            mapTrainerDetails(profile.trainer_profile_details),
    lizenzen:           (profile.trainer_lizenzen  || []).map(l => ({
      id:              l.id,
      bezeichnung:     l.bezeichnung,
      ausstellendeOrg: l.ausstellende_org  || '',
      ausstellungsdatum: l.ausstellungsdatum || null,
      ablaufdatum:     l.ablaufdatum       || null,
    })),
    erfolge: (profile.trainer_erfolge || []).map(e => ({
      id:         e.id,
      jahr:       e.jahr,
      mannschaft: e.mannschaft,
      titel:      e.titel,
      sortOrder:  e.sort_order || 0,
    })),
  };
}

export function useTrainerVerwaltung(operatorId = null) {
  const [trainers, setTrainers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

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

      // Verwalter sehen nur eigenen Verein
      if (operatorId) {
        query = query.eq('operator_id', operatorId);
      }

      const { data, error: e } = await query;
      if (e) throw e;
      setTrainers((data || []).map(mapTrainer));
    } catch (err) {
      setError(err.message);
      setTrainers([]);
    }
    setLoading(false);
  }, [operatorId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Admin-Felder aktualisieren (chip_id, verified, unterlagen, notizen, datum)
  const updateAdminFields = useCallback(async (trainerId, data) => {
    try {
      const dbData = {
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

      // Lokalen State aktualisieren
      setTrainers(prev => prev.map(t => {
        if (t.id !== trainerId) return t;
        return { ...t, details: { ...(t.details || {}), ...mapTrainerDetails({ ...{}, ...dbData }) } };
      }));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  // Dokument für Trainer hochladen (als Verwalter, z.B. eingescannte Papier-Dokumente)
  const uploadDocumentForTrainer = useCallback(async (trainerId, docType, file) => {
    // docType: 'fuehrungszeugnis' | 'verhaltenskodex'
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
        return { ...t, details: { ...(t.details || {}), [urlKey]: path } };
      }));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  return { trainers, loading, error, refresh: fetchAll, updateAdminFields, uploadDocumentForTrainer };
}
