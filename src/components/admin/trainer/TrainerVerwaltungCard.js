import React, { useState } from 'react';
import {
  ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle,
  Upload, Save,
} from 'lucide-react';
import { Button } from '../../ui';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../contexts/ToastContext';

// -----------------------------------------------------------------------
// Hilfsfunktionen
// -----------------------------------------------------------------------
function Ampel({ details }) {
  const fzOk       = details?.fuehrungszeugnisVerified;
  const unterlagenOk = details?.unterlagenVollstaendig;
  const chipOk     = !!details?.chipId;
  const score      = [fzOk, unterlagenOk, chipOk].filter(Boolean).length;

  if (score === 3) return (
    <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 rounded-full px-2 py-0.5 text-xs font-medium">
      <CheckCircle className="w-3.5 h-3.5" /> Vollständig
    </span>
  );
  if (score >= 1) return (
    <span className="inline-flex items-center gap-1 text-yellow-700 bg-yellow-50 rounded-full px-2 py-0.5 text-xs font-medium">
      <Clock className="w-3.5 h-3.5" /> Teilweise ({score}/3)
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 rounded-full px-2 py-0.5 text-xs font-medium">
      <AlertCircle className="w-3.5 h-3.5" /> Unvollständig
    </span>
  );
}

// -----------------------------------------------------------------------
// TrainerVerwaltungCard
// -----------------------------------------------------------------------
export default function TrainerVerwaltungCard({ trainer, onUpdate }) {
  const { showToast } = useToast();
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);

  const d = trainer.details || {};
  const [form, setForm] = useState({
    chipId:                  d.chipId                  || '',
    fuehrungszeugnisVerified: d.fuehrungszeugnisVerified || false,
    fuehrungszeugnisDate:    d.fuehrungszeugnisDate    || '',
    unterlagenVollstaendig:  d.unterlagenVollstaendig  || false,
    notizen:                 d.notizen                 || '',
  });
  const [formDirty, setFormDirty] = useState(false);

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setFormDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error: e } = await onUpdate(trainer.id, {
      chipId:                  form.chipId             || null,
      fuehrungszeugnisVerified: form.fuehrungszeugnisVerified,
      fuehrungszeugnisDate:    form.fuehrungszeugnisDate || null,
      unterlagenVollstaendig:  form.unterlagenVollstaendig,
      notizen:                 form.notizen            || null,
    });
    setSaving(false);
    if (e) { showToast('Fehler beim Speichern: ' + e, 'error'); return; }
    setFormDirty(false);
    showToast('Gespeichert', 'success');
  };

  // Führungszeugnis-Download (Signed URL generieren)
  const handleFzDownload = async () => {
    if (!d.fuehrungszeugnisUrl) return;
    const { data, error: e } = await supabase.storage
      .from('trainer-dokumente')
      .createSignedUrl(d.fuehrungszeugnisUrl, 60 * 5); // 5 Minuten
    if (e) { showToast('Fehler: ' + e.message, 'error'); return; }
    window.open(data.signedUrl, '_blank');
  };

  const fullName = `${trainer.firstName} ${trainer.lastName}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header – immer sichtbar */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {trainer.details?.photoUrl
            ? <img src={trainer.details.photoUrl} alt={fullName} className="w-full h-full object-cover" />
            : <span className="text-sm font-bold text-blue-600">
                {(trainer.firstName?.[0] || '') + (trainer.lastName?.[0] || '')}
              </span>
          }
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">{fullName}</p>
          <p className="text-xs text-gray-500 truncate">{trainer.email}</p>
        </div>
        {/* Ampel */}
        <Ampel details={trainer.details} />
        {/* Toggle */}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {/* Detail-Bereich */}
      {open && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5">
          {/* Stammdaten (read-only) */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Stammdaten</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400">E-Mail:</span> <span className="text-gray-800">{trainer.email}</span></div>
              {trainer.phone && <div><span className="text-gray-400">Tel.:</span> <span className="text-gray-800">{trainer.phone}</span></div>}
            </div>
            {/* Lizenzen */}
            {trainer.lizenzen?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1">Lizenzen:</p>
                <div className="flex flex-wrap gap-1">
                  {trainer.lizenzen.map(l => (
                    <span key={l.id} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {l.bezeichnung}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Führungszeugnis */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Führungszeugnis</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.fuehrungszeugnisVerified}
                    onChange={e => set('fuehrungszeugnisVerified', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Verifiziert</span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-500">Datum:</label>
                <input
                  type="date"
                  value={form.fuehrungszeugnisDate || ''}
                  onChange={e => set('fuehrungszeugnisDate', e.target.value || null)}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {d.fuehrungszeugnisUrl && (
                <button
                  onClick={handleFzDownload}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Upload className="w-3 h-3 rotate-180" /> Dokument ansehen
                </button>
              )}
              {!d.fuehrungszeugnisUrl && (
                <p className="text-xs text-gray-400 italic">Kein Dokument hochgeladen</p>
              )}
            </div>
          </div>

          {/* Chip-ID */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Chip / Schlüssel</h4>
            <input
              type="text"
              value={form.chipId}
              onChange={e => set('chipId', e.target.value)}
              placeholder="Chip-ID oder Schlüsselnummer"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Unterlagen */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.unterlagenVollstaendig}
                onChange={e => set('unterlagenVollstaendig', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Unterlagen vollständig</span>
            </label>
          </div>

          {/* Notizen (nur Admin sichtbar) */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Interne Notizen</h4>
            <textarea
              value={form.notizen}
              onChange={e => set('notizen', e.target.value)}
              rows={2}
              placeholder="Nur für Verwalter sichtbar..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Speichern */}
          {formDirty && (
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {saving ? 'Speichern...' : 'Änderungen speichern'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
