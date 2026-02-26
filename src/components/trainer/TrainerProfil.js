import React, { useState, useRef } from 'react';
import {
  Camera, Award, Trophy, CheckCircle, Clock, AlertCircle,
  Plus, Pencil, Trash2, Upload, Save,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTrainerProfile } from '../../hooks/useTrainerProfile';
import { useToast } from '../../contexts/ToastContext';
import { Button, PageHeader } from '../ui';
import LizenzForm from './LizenzForm';
import ErfolgForm from './ErfolgForm';

// -----------------------------------------------------------------------
// Hilfsfunktionen
// -----------------------------------------------------------------------
function formatDate(dateStr) {
  if (!dateStr) return '–';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function StatusBadge({ ok, label }) {
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
  const { showToast } = useToast();
  const {
    details, lizenzen, erfolge, loading, error,
    upsertProfile, uploadPhoto, uploadFuehrungszeugnis,
    addLizenz, updateLizenz, deleteLizenz,
    addErfolg, updateErfolg, deleteErfolg,
  } = useTrainerProfile(profile?.id);

  // Profil-Header State
  const [bioEdit, setBioEdit]   = useState(false);
  const [bioVal,  setBioVal]    = useState('');
  const [ibanEdit, setIbanEdit] = useState(false);
  const [ibanVal,  setIbanVal]  = useState('');
  const [saving,  setSaving]    = useState(false);
  const photoRef  = useRef(null);
  const fzRef     = useRef(null);

  // Lizenz-State
  const [showAddLizenz,   setShowAddLizenz]   = useState(false);
  const [editingLizenzId, setEditingLizenzId] = useState(null);
  const [lizenzSaving,    setLizenzSaving]    = useState(false);

  // Erfolg-State
  const [showAddErfolg,   setShowAddErfolg]   = useState(false);
  const [editingErfolgId, setEditingErfolgId] = useState(null);
  const [erfolgSaving,    setErfolgSaving]    = useState(false);

  // ---- Handler ----

  const startBioEdit = () => {
    setBioVal(details?.bio || '');
    setBioEdit(true);
  };

  const saveBio = async () => {
    setSaving(true);
    const { error: e } = await upsertProfile({ bio: bioVal, iban: details?.iban || null });
    setSaving(false);
    if (e) { showToast('Fehler beim Speichern: ' + e, 'error'); return; }
    setBioEdit(false);
    showToast('Bio gespeichert', 'success');
  };

  const startIbanEdit = () => {
    setIbanVal(details?.iban || '');
    setIbanEdit(true);
  };

  const saveIban = async () => {
    setSaving(true);
    const { error: e } = await upsertProfile({ bio: details?.bio || null, iban: ibanVal });
    setSaving(false);
    if (e) { showToast('Fehler beim Speichern: ' + e, 'error'); return; }
    setIbanEdit(false);
    showToast('IBAN gespeichert', 'success');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const { error: err } = await uploadPhoto(file);
    setSaving(false);
    if (err) { showToast('Foto-Upload fehlgeschlagen: ' + err, 'error'); return; }
    showToast('Foto hochgeladen', 'success');
  };

  const handleFzUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const { error: err } = await uploadFuehrungszeugnis(file);
    setSaving(false);
    if (err) { showToast('Upload fehlgeschlagen: ' + err, 'error'); return; }
    showToast('Führungszeugnis hochgeladen', 'success');
  };

  // Lizenzen
  const handleAddLizenz = async (data) => {
    setLizenzSaving(true);
    const { error: e } = await addLizenz(data);
    setLizenzSaving(false);
    if (e) { showToast('Fehler: ' + e, 'error'); return; }
    setShowAddLizenz(false);
    showToast('Lizenz hinzugefügt', 'success');
  };

  const handleUpdateLizenz = async (id, data) => {
    setLizenzSaving(true);
    const { error: e } = await updateLizenz(id, data);
    setLizenzSaving(false);
    if (e) { showToast('Fehler: ' + e, 'error'); return; }
    setEditingLizenzId(null);
    showToast('Lizenz aktualisiert', 'success');
  };

  const handleDeleteLizenz = async (id) => {
    const { error: e } = await deleteLizenz(id);
    if (e) { showToast('Fehler: ' + e, 'error'); return; }
    showToast('Lizenz gelöscht', 'success');
  };

  // Erfolge
  const handleAddErfolg = async (data) => {
    setErfolgSaving(true);
    const { error: e } = await addErfolg(data);
    setErfolgSaving(false);
    if (e) { showToast('Fehler: ' + e, 'error'); return; }
    setShowAddErfolg(false);
    showToast('Erfolg hinzugefügt', 'success');
  };

  const handleUpdateErfolg = async (id, data) => {
    setErfolgSaving(true);
    const { error: e } = await updateErfolg(id, data);
    setErfolgSaving(false);
    if (e) { showToast('Fehler: ' + e, 'error'); return; }
    setEditingErfolgId(null);
    showToast('Erfolg aktualisiert', 'success');
  };

  const handleDeleteErfolg = async (id) => {
    const { error: e } = await deleteErfolg(id);
    if (e) { showToast('Fehler: ' + e, 'error'); return; }
    showToast('Erfolg gelöscht', 'success');
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Mein Trainer-Profil" subtitle="Self-Service – du kannst dein Profil selbst pflegen" />

      {/* ---- Profil-Header ---- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start gap-5">
          {/* Foto */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
              {details?.photoUrl
                ? <img src={details.photoUrl} alt={fullName} className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-blue-600">
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

          {/* Name + Bio */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900">{fullName}</h2>
            <p className="text-sm text-gray-500 mb-3">{profile?.email}</p>

            {bioEdit ? (
              <div className="space-y-2">
                <textarea
                  value={bioVal}
                  onChange={e => setBioVal(e.target.value)}
                  rows={3}
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
              <div className="group relative">
                {details?.bio
                  ? <p className="text-sm text-gray-700 leading-relaxed">{details.bio}</p>
                  : <p className="text-sm text-gray-400 italic">Noch keine Bio hinterlegt.</p>
                }
                <button
                  onClick={startBioEdit}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <Pencil className="w-3 h-3" /> Bio bearbeiten
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- IBAN ---- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Bankverbindung (IBAN)</h3>
        {ibanEdit ? (
          <div className="space-y-2">
            <input
              type="text"
              value={ibanVal}
              onChange={e => setIbanVal(e.target.value)}
              placeholder="DE89 3704 0044 0532 0130 00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={saveIban} disabled={saving}>
                <Save className="w-3.5 h-3.5 mr-1" /> Speichern
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIbanEdit(false)}>Abbrechen</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-gray-800">
              {details?.iban || <span className="text-gray-400 italic not-italic font-sans">Noch nicht hinterlegt</span>}
            </span>
            <button
              onClick={startIbanEdit}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Pencil className="w-3 h-3" /> Bearbeiten
            </button>
          </div>
        )}
      </div>

      {/* ---- Status-Box (Admin-Infos, read-only für Trainer) ---- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Status (vom Verein gepflegt)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-1">Führungszeugnis</p>
            <StatusBadge ok={details?.fuehrungszeugnisVerified} label={details?.fuehrungszeugnisVerified ? 'Verifiziert' : 'Ausstehend'} />
            {details?.fuehrungszeugnisDate && (
              <p className="text-xs text-gray-400 mt-1">vom {formatDate(details.fuehrungszeugnisDate)}</p>
            )}
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Chip / Schlüssel-ID</p>
            <p className="text-gray-800">{details?.chipId || <span className="text-gray-400">–</span>}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-gray-500 text-xs mb-1">Unterlagen vollständig</p>
            <StatusBadge ok={details?.unterlagenVollstaendig} label={details?.unterlagenVollstaendig ? 'Vollständig' : 'Unvollständig'} />
          </div>
        </div>
        {/* Führungszeugnis hochladen */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Führungszeugnis hochladen (PDF oder Bild, nur für Admins sichtbar)</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fzRef.current?.click()}
            disabled={saving}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            {details?.fuehrungszeugnisUrl ? 'Erneut hochladen' : 'Jetzt hochladen'}
          </Button>
          <input ref={fzRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFzUpload} />
        </div>
      </div>

      {/* ---- Lizenzen & Zertifikate ---- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
            <LizenzForm
              onSave={handleAddLizenz}
              onCancel={() => setShowAddLizenz(false)}
              loading={lizenzSaving}
            />
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
                    ausstellungsdatum: l.ausstellungsdatum,
                    ablaufdatum:       l.ablaufdatum,
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
                    <button
                      onClick={() => setEditingLizenzId(l.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                      title="Bearbeiten"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLizenz(l.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                      title="Löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---- Erfolge ---- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
            <ErfolgForm
              onSave={handleAddErfolg}
              onCancel={() => setShowAddErfolg(false)}
              loading={erfolgSaving}
            />
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
                    <button
                      onClick={() => setEditingErfolgId(e.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                      title="Bearbeiten"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteErfolg(e.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                      title="Löschen"
                    >
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
  );
}
