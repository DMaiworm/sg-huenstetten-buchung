import React, { useState, useRef, useMemo } from 'react';
import {
  Camera, Award, Trophy, CheckCircle, Clock, AlertCircle,
  Plus, Pencil, Trash2, Upload, Save, Mail, Phone, MapPin, ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrganizationContext';
import { useTrainerProfile } from '../../hooks/useTrainerProfile';
import { useToast } from '../../contexts/ToastContext';
import { Button, PageHeader } from '../ui';
import LizenzForm from './LizenzForm';
import ErfolgForm from './ErfolgForm';
import type { Club, Department, Team, TrainerAssignment } from '../../types';

// -----------------------------------------------------------------------
// Hilfsfunktionen
// -----------------------------------------------------------------------
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '–';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function StatusBadge({ ok, label }: { ok: boolean | undefined; label: string }) {
  if (ok) return (
    <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 rounded-full px-2 py-0.5 text-xs font-medium">
      <CheckCircle className="w-3.5 h-3.5" /> {label}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-yellow-700 bg-yellow-50 rounded-full px-2 py-0.5 text-xs font-medium">
      <Clock className="w-3.5 h-3.5" /> {label}
    </span>
  );
}

// -----------------------------------------------------------------------
// TrainerProfil – Self-Service-Seite für eingeloggte Trainer
// -----------------------------------------------------------------------
export default function TrainerProfil() {
  const { profile } = useAuth();
  const { clubs, departments, teams, trainerAssignments } = useOrg();
  const { addToast } = useToast();
  const {
    details, lizenzen, erfolge, loading, error,
    upsertProfile, updateContactInfo, uploadPhoto, uploadFuehrungszeugnis, uploadVerhaltenskodex,
    addLizenz, updateLizenz, deleteLizenz,
    addErfolg, updateErfolg, deleteErfolg,
  } = useTrainerProfile(profile?.id);

  // Jugendmannschaften, denen dieser Trainer zugeordnet ist
  const jugendteams = useMemo(() => {
    const myAssignments = (trainerAssignments || []).filter((ta: TrainerAssignment) => ta.userId === profile?.id);
    return myAssignments
      .map((ta: TrainerAssignment) => (teams || []).find((t: Team) => t.id === ta.teamId))
      .filter((t): t is Team => !!t?.istJugendmannschaft)
      .map(t => {
        const dept = (departments || []).find((d: Department) => d.id === t.departmentId);
        const club = dept ? (clubs || []).find((c: Club) => c.id === dept.clubId) : null;
        return { ...t, deptName: dept?.name, clubName: club?.name };
      });
  }, [trainerAssignments, teams, departments, clubs, profile?.id]);

  // Aktiv-für-Vereine aus Team-Zuordnungen ableiten
  const aktivFuer = useMemo(() => {
    const myAssignments = (trainerAssignments || []).filter((ta: TrainerAssignment) => ta.userId === profile?.id);
    const clubIds = new Set<string>();
    for (const ta of myAssignments) {
      const team = (teams || []).find((t: Team) => t.id === ta.teamId);
      if (!team) continue;
      const dept = (departments || []).find((d: Department) => d.id === team.departmentId);
      if (dept) clubIds.add(dept.clubId);
    }
    return Array.from(clubIds);
  }, [trainerAssignments, teams, departments, profile?.id]);

  // State
  const [bioEdit,      setBioEdit]      = useState(false);
  const [bioVal,       setBioVal]       = useState('');
  const [ibanEdit,     setIbanEdit]     = useState(false);
  const [ibanVal,      setIbanVal]      = useState('');
  const [kontaktEdit,  setKontaktEdit]  = useState(false);
  const [emailVal,     setEmailVal]     = useState('');
  const [phoneVal,     setPhoneVal]     = useState('');
  const [adresseEdit,  setAdresseEdit]  = useState(false);
  const [strasseVal,   setStrasseVal]   = useState('');
  const [plzVal,       setPlzVal]       = useState('');
  const [ortVal,       setOrtVal]       = useState('');
  const [saving,       setSaving]       = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const fzRef    = useRef<HTMLInputElement>(null);
  const vkRef    = useRef<HTMLInputElement>(null);

  // Lizenz-State
  const [showAddLizenz,   setShowAddLizenz]   = useState(false);
  const [editingLizenzId, setEditingLizenzId] = useState<string | null>(null);
  const [lizenzSaving,    setLizenzSaving]    = useState(false);

  // Erfolg-State
  const [showAddErfolg,   setShowAddErfolg]   = useState(false);
  const [editingErfolgId, setEditingErfolgId] = useState<string | null>(null);
  const [erfolgSaving,    setErfolgSaving]    = useState(false);

  // ---- Handler ----

  const startBioEdit = () => { setBioVal(details?.bio || ''); setBioEdit(true); };
  const saveBio = async () => {
    setSaving(true);
    const { error: e } = await upsertProfile({ bio: bioVal });
    setSaving(false);
    if (e) { addToast('Fehler beim Speichern: ' + e, 'error'); return; }
    setBioEdit(false);
    addToast('Bio gespeichert', 'success');
  };

  const startIbanEdit = () => { setIbanVal(details?.iban || ''); setIbanEdit(true); };
  const saveIban = async () => {
    setSaving(true);
    const { error: e } = await upsertProfile({ iban: ibanVal });
    setSaving(false);
    if (e) { addToast('Fehler beim Speichern: ' + e, 'error'); return; }
    setIbanEdit(false);
    addToast('IBAN gespeichert', 'success');
  };

  const startKontaktEdit = () => {
    setEmailVal(profile?.email || '');
    setPhoneVal(profile?.phone || '');
    setKontaktEdit(true);
  };
  const saveKontakt = async () => {
    setSaving(true);
    const { error: e } = await updateContactInfo({ email: emailVal, phone: phoneVal });
    setSaving(false);
    if (e) { addToast('Fehler beim Speichern: ' + e, 'error'); return; }
    setKontaktEdit(false);
    addToast('Kontaktdaten gespeichert', 'success');
  };

  const startAdresseEdit = () => {
    setStrasseVal(details?.adresseStrasse || '');
    setPlzVal(details?.adressePlz || '');
    setOrtVal(details?.adresseOrt || '');
    setAdresseEdit(true);
  };
  const saveAdresse = async () => {
    setSaving(true);
    const { error: e } = await upsertProfile({
      adresseStrasse: strasseVal || null,
      adressePlz:     plzVal     || null,
      adresseOrt:     ortVal     || null,
    });
    setSaving(false);
    if (e) { addToast('Fehler beim Speichern: ' + e, 'error'); return; }
    setAdresseEdit(false);
    addToast('Adresse gespeichert', 'success');
  };

  const toggleProfilVeroeffentlichen = async () => {
    setSaving(true);
    const { error: e } = await upsertProfile({ profilVeroeffentlichen: !(details?.profilVeroeffentlichen || false) });
    setSaving(false);
    if (e) addToast('Fehler: ' + e, 'error');
  };

  const toggleKontaktVeroeffentlichen = async () => {
    setSaving(true);
    const { error: e } = await upsertProfile({ kontaktVeroeffentlichen: !(details?.kontaktVeroeffentlichen || false) });
    setSaving(false);
    if (e) addToast('Fehler: ' + e, 'error');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const { error: err } = await uploadPhoto(file);
    setSaving(false);
    if (err) { addToast('Foto-Upload fehlgeschlagen: ' + err, 'error'); return; }
    addToast('Foto hochgeladen', 'success');
  };

  const handleFzUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const { error: err } = await uploadFuehrungszeugnis(file);
    setSaving(false);
    if (err) { addToast('Upload fehlgeschlagen: ' + err, 'error'); return; }
    addToast('Führungszeugnis hochgeladen', 'success');
  };

  const handleVkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const { error: err } = await uploadVerhaltenskodex(file);
    setSaving(false);
    if (err) { addToast('Upload fehlgeschlagen: ' + err, 'error'); return; }
    addToast('Verhaltenskodex hochgeladen', 'success');
  };

  // Lizenzen
  const handleAddLizenz = async (data: any) => {
    setLizenzSaving(true);
    const { error: e } = await addLizenz(data);
    setLizenzSaving(false);
    if (e) { addToast('Fehler: ' + e, 'error'); return; }
    setShowAddLizenz(false);
    addToast('Lizenz hinzugefügt', 'success');
  };
  const handleUpdateLizenz = async (id: string, data: any) => {
    setLizenzSaving(true);
    const { error: e } = await updateLizenz(id, data);
    setLizenzSaving(false);
    if (e) { addToast('Fehler: ' + e, 'error'); return; }
    setEditingLizenzId(null);
    addToast('Lizenz aktualisiert', 'success');
  };
  const handleDeleteLizenz = async (id: string) => {
    const { error: e } = await deleteLizenz(id);
    if (e) { addToast('Fehler: ' + e, 'error'); return; }
    addToast('Lizenz gelöscht', 'success');
  };

  // Erfolge
  const handleAddErfolg = async (data: any) => {
    setErfolgSaving(true);
    const { error: e } = await addErfolg(data);
    setErfolgSaving(false);
    if (e) { addToast('Fehler: ' + e, 'error'); return; }
    setShowAddErfolg(false);
    addToast('Erfolg hinzugefügt', 'success');
  };
  const handleUpdateErfolg = async (id: string, data: any) => {
    setErfolgSaving(true);
    const { error: e } = await updateErfolg(id, data);
    setErfolgSaving(false);
    if (e) { addToast('Fehler: ' + e, 'error'); return; }
    setEditingErfolgId(null);
    addToast('Erfolg aktualisiert', 'success');
  };
  const handleDeleteErfolg = async (id: string) => {
    const { error: e } = await deleteErfolg(id);
    if (e) { addToast('Fehler: ' + e, 'error'); return; }
    addToast('Erfolg gelöscht', 'success');
  };

  // ---- Render ----

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 text-red-600 py-10">
      <AlertCircle className="w-5 h-5" /> Fehler beim Laden: {error}
    </div>
  );

  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
  const hasAdresse = details?.adresseStrasse || details?.adressePlz || details?.adresseOrt;

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const editLinkCls = 'mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800';

  return (
    <div className="space-y-4">
      <PageHeader title="Mein Trainer-Profil" subtitle="Self-Service – du kannst dein Profil selbst pflegen" />

      <div className="flex flex-col md:flex-row gap-4 items-start">

        {/* ── LINKE SPALTE ── */}
        <div className="w-full md:w-72 flex-shrink-0 space-y-4">

          {/* Foto + Name + Vereine */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {details?.photoUrl
                  ? <img src={details.photoUrl} alt={fullName} className="w-full h-full object-cover" />
                  : <span className="text-3xl font-bold text-blue-600">
                      {(profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '')}
                    </span>
                }
              </div>
              <button
                onClick={() => photoRef.current?.click()}
                disabled={saving}
                className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 shadow"
                title="Foto hochladen"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{fullName}</h2>
            {aktivFuer.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {aktivFuer.map(clubId => {
                  const club = clubs.find((c: Club) => c.id === clubId);
                  return club ? (
                    <span key={clubId} className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {club.name}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Kontaktdaten */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Kontaktdaten</h3>
            {kontaktEdit ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> E-Mail
                  </label>
                  <input type="email" value={emailVal} onChange={e => setEmailVal(e.target.value)}
                    placeholder="email@beispiel.de" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Telefon
                  </label>
                  <input type="tel" value={phoneVal} onChange={e => setPhoneVal(e.target.value)}
                    placeholder="+49 151 12345678" className={inputCls} />
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={saveKontakt} disabled={saving}>
                    <Save className="w-3.5 h-3.5 mr-1" /> Speichern
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setKontaktEdit(false)}>Abbrechen</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {profile?.email
                    ? <span className="truncate">{profile.email}</span>
                    : <span className="text-gray-400 italic">Keine E-Mail hinterlegt</span>
                  }
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {profile?.phone
                    ? <span>{profile.phone}</span>
                    : <span className="text-gray-400 italic">Kein Telefon hinterlegt</span>
                  }
                </div>
                <button onClick={startKontaktEdit} className={editLinkCls}>
                  <Pencil className="w-3 h-3" /> Bearbeiten
                </button>
              </div>
            )}
            <label className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={details?.kontaktVeroeffentlichen || false}
                onChange={toggleKontaktVeroeffentlichen}
                disabled={saving}
                className="mt-0.5 w-4 h-4 rounded flex-shrink-0"
                style={{ accentColor: '#2563eb' }}
              />
              <span className="text-xs text-gray-600">Kontaktdaten auf Website veröffentlichen</span>
            </label>
          </div>

          {/* Postadresse */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Postadresse</h3>
            {adresseEdit ? (
              <div className="space-y-2">
                <input type="text" value={strasseVal} onChange={e => setStrasseVal(e.target.value)}
                  placeholder="Straße und Hausnummer" className={inputCls} />
                <div className="flex gap-2">
                  <input type="text" value={plzVal} onChange={e => setPlzVal(e.target.value)}
                    placeholder="PLZ" className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <input type="text" value={ortVal} onChange={e => setOrtVal(e.target.value)}
                    placeholder="Ort" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={saveAdresse} disabled={saving}>
                    <Save className="w-3.5 h-3.5 mr-1" /> Speichern
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setAdresseEdit(false)}>Abbrechen</Button>
                </div>
              </div>
            ) : (
              <div>
                {hasAdresse ? (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      {details!.adresseStrasse && <p>{details!.adresseStrasse}</p>}
                      {(details!.adressePlz || details!.adresseOrt) && (
                        <p>{details!.adressePlz} {details!.adresseOrt}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Noch nicht hinterlegt</p>
                )}
                <button onClick={startAdresseEdit} className={editLinkCls}>
                  <Pencil className="w-3 h-3" /> Bearbeiten
                </button>
              </div>
            )}
          </div>

          {/* IBAN */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Bankverbindung (IBAN)</h3>
            {ibanEdit ? (
              <div className="space-y-2">
                <input type="text" value={ibanVal} onChange={e => setIbanVal(e.target.value)}
                  placeholder="DE89 3704 0044 0532 0130 00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={saveIban} disabled={saving}>
                    <Save className="w-3.5 h-3.5 mr-1" /> Speichern
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setIbanEdit(false)}>Abbrechen</Button>
                </div>
              </div>
            ) : (
              <div>
                <span className="font-mono text-sm text-gray-800">
                  {details?.iban || <span className="text-gray-400 italic not-italic font-sans">Noch nicht hinterlegt</span>}
                </span>
                <div>
                  <button onClick={startIbanEdit} className={editLinkCls}>
                    <Pencil className="w-3 h-3" /> Bearbeiten
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── RECHTE SPALTE ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Bio + Profil veröffentlichen */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Über mich</h3>
            {bioEdit ? (
              <div className="space-y-2">
                <textarea
                  value={bioVal}
                  onChange={e => setBioVal(e.target.value)}
                  rows={4}
                  placeholder="Kurze Vorstellung, Trainergeschichte, Schwerpunkte..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={saveBio} disabled={saving}>
                    <Save className="w-3.5 h-3.5 mr-1" /> Speichern
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setBioEdit(false)}>Abbrechen</Button>
                </div>
              </div>
            ) : (
              <div>
                {details?.bio
                  ? <p className="text-sm text-gray-700 leading-relaxed">{details.bio}</p>
                  : <p className="text-sm text-gray-400 italic">Noch keine Bio hinterlegt.</p>
                }
                <button onClick={startBioEdit} className={editLinkCls}>
                  <Pencil className="w-3 h-3" /> Bio bearbeiten
                </button>
              </div>
            )}
            <label className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={details?.profilVeroeffentlichen || false}
                onChange={toggleProfilVeroeffentlichen}
                disabled={saving}
                className="mt-0.5 w-4 h-4 rounded flex-shrink-0"
                style={{ accentColor: '#2563eb' }}
              />
              <span className="text-sm text-gray-700">
                Ich bin damit einverstanden, dass dieses Profil auf der Vereinswebsite veröffentlicht wird.
              </span>
            </label>
          </div>

          {/* Status (Admin-Infos, read-only) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Status (vom Verein gepflegt)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-1">Unterlagen</p>
                <StatusBadge ok={details?.unterlagenVollstaendig} label={details?.unterlagenVollstaendig ? 'Vollständig' : 'Unvollständig'} />
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Chip / Schlüssel-ID</p>
                <p className="text-gray-800">{details?.chipId || <span className="text-gray-400">–</span>}</p>
              </div>
              {(profile?.stammverein_id || profile?.stammverein_andere) && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Stammverein (Abrechnung)</p>
                  <p className="text-gray-800 text-sm">
                    {profile.stammverein_id
                      ? clubs.find((c: Club) => c.id === profile.stammverein_id)?.name || '–'
                      : profile.stammverein_andere || '–'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Kindeswohl-Maßnahmen – nur für Jugendtrainer */}
          {jugendteams.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" /> Kindeswohl-Maßnahmen
              </h3>
              <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-800 leading-relaxed">
                  Durch deine Zuordnung zu{' '}
                  {jugendteams.length === 1
                    ? <strong>{jugendteams[0].name}</strong>
                    : <>den Mannschaften <strong>{jugendteams.map(t => t.name).join(', ')}</strong></>
                  }{' '}
                  bist du verpflichtet, an den Maßnahmen zur Sicherstellung des Kindeswohls mitzuwirken.
                </p>
              </div>

              <div className="space-y-4">
                {/* Verhaltenskodex */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">Verhaltenskodex</p>
                    <p className="text-xs text-gray-500 mt-0.5">Unterzeichnetes Dokument hochladen</p>
                    <div className="mt-1.5">
                      <StatusBadge
                        ok={details?.verhaltenskodexVerified}
                        label={details?.verhaltenskodexVerified ? 'Verifiziert' : details?.verhaltenskodexUrl ? 'Eingereicht' : 'Ausstehend'}
                      />
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => vkRef.current?.click()} disabled={saving} className="flex-shrink-0">
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {details?.verhaltenskodexUrl ? 'Erneut hochladen' : 'Hochladen'}
                  </Button>
                </div>

                <div className="border-t border-gray-100" />

                {/* Führungszeugnis */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">Polizeiliches Führungszeugnis</p>
                    <p className="text-xs text-gray-500 mt-0.5">Beantragen und Kopie hochladen</p>
                    <div className="mt-1.5">
                      <StatusBadge
                        ok={details?.fuehrungszeugnisVerified}
                        label={details?.fuehrungszeugnisVerified ? 'Verifiziert' : details?.fuehrungszeugnisUrl ? 'Eingereicht' : 'Ausstehend'}
                      />
                      {details?.fuehrungszeugnisDate && (
                        <span className="ml-2 text-xs text-gray-400">vom {formatDate(details.fuehrungszeugnisDate)}</span>
                      )}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => fzRef.current?.click()} disabled={saving} className="flex-shrink-0">
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {details?.fuehrungszeugnisUrl ? 'Erneut hochladen' : 'Hochladen'}
                  </Button>
                </div>
              </div>

              <input ref={vkRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleVkUpload} />
              <input ref={fzRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFzUpload} />
            </div>
          )}

          {/* Lizenzen & Zertifikate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-500" /> Lizenzen & Zertifikate
              </h3>
              {!showAddLizenz && (
                <Button variant="secondary" size="sm" onClick={() => setShowAddLizenz(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Hinzufügen
                </Button>
              )}
            </div>
            {showAddLizenz && (
              <div className="mb-4">
                <LizenzForm onSave={handleAddLizenz} onCancel={() => setShowAddLizenz(false)} loading={lizenzSaving} />
              </div>
            )}
            {lizenzen.length === 0 && !showAddLizenz && (
              <p className="text-sm text-gray-400 italic">Noch keine Lizenzen hinterlegt.</p>
            )}
            <div className="space-y-3">
              {lizenzen.map(l => (
                <div key={l.id}>
                  {editingLizenzId === l.id ? (
                    <LizenzForm
                      initial={{
                        bezeichnung:       l.bezeichnung,
                        ausstellendeOrg:   l.ausstellendeOrg,
                        ausstellungsdatum: l.ausstellungsdatum || '',
                        ablaufdatum:       l.ablaufdatum || '',
                      }}
                      onSave={data => handleUpdateLizenz(l.id, data)}
                      onCancel={() => setEditingLizenzId(null)}
                      loading={lizenzSaving}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{l.bezeichnung}</p>
                        {l.ausstellendeOrg && <p className="text-xs text-gray-500">{l.ausstellendeOrg}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {l.ausstellungsdatum && `Ausgestellt: ${formatDate(l.ausstellungsdatum)}`}
                          {l.ausstellungsdatum && l.ablaufdatum && ' · '}
                          {l.ablaufdatum && `Gültig bis: ${formatDate(l.ablaufdatum)}`}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setEditingLizenzId(l.id)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Bearbeiten">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteLizenz(l.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Löschen">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Erfolge */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" /> Erfolge
              </h3>
              {!showAddErfolg && (
                <Button variant="secondary" size="sm" onClick={() => setShowAddErfolg(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Hinzufügen
                </Button>
              )}
            </div>
            {showAddErfolg && (
              <div className="mb-4">
                <ErfolgForm onSave={handleAddErfolg} onCancel={() => setShowAddErfolg(false)} loading={erfolgSaving} />
              </div>
            )}
            {erfolge.length === 0 && !showAddErfolg && (
              <p className="text-sm text-gray-400 italic">Noch keine Erfolge hinterlegt.</p>
            )}
            <div className="space-y-3">
              {erfolge.map(e => (
                <div key={e.id}>
                  {editingErfolgId === e.id ? (
                    <ErfolgForm
                      initial={{ jahr: e.jahr, mannschaft: e.mannschaft, titel: e.titel }}
                      onSave={data => handleUpdateErfolg(e.id, data)}
                      onCancel={() => setEditingErfolgId(null)}
                      loading={erfolgSaving}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{e.titel}</p>
                        <p className="text-xs text-gray-500">{e.mannschaft} · {e.jahr}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setEditingErfolgId(e.id)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Bearbeiten">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteErfolg(e.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Löschen">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
