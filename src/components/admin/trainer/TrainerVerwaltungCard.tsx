import React, { useState, useRef } from 'react';
import {
  ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle,
  Upload, Save, ShieldAlert,
} from 'lucide-react';
import { Button } from '../../ui';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../contexts/ToastContext';
import type { Team } from '../../../types';

interface TrainerDetails {
  chipId?: string | null;
  fuehrungszeugnisVerified?: boolean;
  fuehrungszeugnisDate?: string | null;
  fuehrungszeugnisUrl?: string | null;
  verhaltenskodexVerified?: boolean;
  verhaltenskodexUrl?: string | null;
  unterlagenVollstaendig?: boolean;
  notizen?: string | null;
  photoUrl?: string | null;
}

interface TrainerLizenz {
  id: string;
  bezeichnung: string;
}

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  operatorId?: string | null;
  details?: TrainerDetails | null;
  lizenzen?: TrainerLizenz[];
}

interface AmpelProps {
  details?: TrainerDetails | null;
  isJugend: boolean;
}

function Ampel({ details, isJugend }: AmpelProps) {
  const fzOk         = details?.fuehrungszeugnisVerified;
  const vkOk         = details?.verhaltenskodexVerified;
  const unterlagenOk = details?.unterlagenVollstaendig;
  const chipOk       = !!details?.chipId;
  const checks       = isJugend ? [vkOk, fzOk, unterlagenOk, chipOk] : [fzOk, unterlagenOk, chipOk];
  const total        = checks.length;
  const score        = checks.filter(Boolean).length;

  if (score === total) return (
    <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 rounded-full px-2 py-0.5 text-xs font-medium">
      <CheckCircle className="w-3.5 h-3.5" /> Vollständig
    </span>
  );
  if (score >= 1) return (
    <span className="inline-flex items-center gap-1 text-yellow-700 bg-yellow-50 rounded-full px-2 py-0.5 text-xs font-medium">
      <Clock className="w-3.5 h-3.5" /> Teilweise ({score}/{total})
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 rounded-full px-2 py-0.5 text-xs font-medium">
      <AlertCircle className="w-3.5 h-3.5" /> Unvollständig
    </span>
  );
}

interface TrainerVerwaltungCardProps {
  trainer: Trainer;
  onUpdate: (trainerId: string, data: any) => Promise<{ error?: string | null }>;
  onUpload: (trainerId: string, docType: 'fuehrungszeugnis' | 'verhaltenskodex', file: File) => Promise<{ error?: string | null }>;
  jugendteams?: Team[];
}

export default function TrainerVerwaltungCard({ trainer, onUpdate, onUpload, jugendteams = [] }: TrainerVerwaltungCardProps) {
  const { addToast: showToast } = useToast();
  const [open,      setOpen]      = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const fzRef = useRef<HTMLInputElement>(null);
  const vkRef = useRef<HTMLInputElement>(null);

  const d = trainer.details || {};
  const isJugend = jugendteams.length > 0;

  const [form, setForm] = useState({
    chipId:                   d.chipId                   || '',
    fuehrungszeugnisVerified: d.fuehrungszeugnisVerified || false,
    fuehrungszeugnisDate:     d.fuehrungszeugnisDate     || '',
    verhaltenskodexVerified:  d.verhaltenskodexVerified  || false,
    unterlagenVollstaendig:   d.unterlagenVollstaendig   || false,
    notizen:                  d.notizen                  || '',
  });
  const [formDirty, setFormDirty] = useState(false);

  const set = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    setFormDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error: e } = await onUpdate(trainer.id, {
      chipId:                   form.chipId              || null,
      fuehrungszeugnisVerified: form.fuehrungszeugnisVerified,
      fuehrungszeugnisDate:     form.fuehrungszeugnisDate || null,
      verhaltenskodexVerified:  form.verhaltenskodexVerified,
      unterlagenVollstaendig:   form.unterlagenVollstaendig,
      notizen:                  form.notizen             || null,
    });
    setSaving(false);
    if (e) { showToast('Fehler beim Speichern: ' + e, 'error'); return; }
    setFormDirty(false);
    showToast('Gespeichert', 'success');
  };

  const handleDownload = async (urlPath: string) => {
    if (!urlPath) return;
    const { data, error: e } = await supabase.storage
      .from('trainer-dokumente')
      .createSignedUrl(urlPath, 60 * 5);
    if (e) { showToast('Fehler: ' + e.message, 'error'); return; }
    window.open(data.signedUrl, '_blank');
  };

  const handleUpload = async (docType: 'fuehrungszeugnis' | 'verhaltenskodex', file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const { error: e } = await onUpload(trainer.id, docType, file);
    setUploading(false);
    if (e) { showToast('Upload fehlgeschlagen: ' + e, 'error'); return; }
    const label = docType === 'fuehrungszeugnis' ? 'Führungszeugnis' : 'Verhaltenskodex';
    showToast(`${label} hochgeladen`, 'success');
  };

  const fullName = `${trainer.firstName} ${trainer.lastName}`;

  const vkOk         = d.verhaltenskodexVerified;
  const fzOk         = d.fuehrungszeugnisVerified;
  const unterlagenOk = d.unterlagenVollstaendig;
  const chipOk       = !!d.chipId;
  const checks       = isJugend ? [vkOk, fzOk, unterlagenOk, chipOk] : [fzOk, unterlagenOk, chipOk];
  const vollScore    = checks.filter(Boolean).length;
  const barColor     = vollScore === checks.length ? '#059669' : vollScore >= 1 ? '#F59E0B' : '#EF4444';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="h-1.5 flex-shrink-0" style={{ backgroundColor: barColor }} />
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {trainer.details?.photoUrl
            ? <img src={trainer.details.photoUrl} alt={fullName} className="w-full h-full object-cover" />
            : <span className="text-sm font-bold text-blue-600">
                {(trainer.firstName?.[0] || '') + (trainer.lastName?.[0] || '')}
              </span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">{fullName}</p>
          <p className="text-xs text-gray-500 truncate">{trainer.email}</p>
        </div>
        <Ampel details={trainer.details} isJugend={isJugend} />
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Stammdaten</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400">E-Mail:</span> <span className="text-gray-800">{trainer.email}</span></div>
              {trainer.phone && <div><span className="text-gray-400">Tel.:</span> <span className="text-gray-800">{trainer.phone}</span></div>}
            </div>
            {trainer.lizenzen && trainer.lizenzen.length > 0 && (
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

          {isJugend && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-amber-500" /> Kindeswohl-Maßnahmen
              </h4>
              <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1.5 mb-3 border border-amber-100">
                Erforderlich durch:{' '}
                <span className="font-medium">{jugendteams.map(t => t.name).join(', ')}</span>
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">Verhaltenskodex</p>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.verhaltenskodexVerified}
                        onChange={e => set('verhaltenskodexVerified', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">Verifiziert</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {d.verhaltenskodexUrl ? (
                        <button onClick={() => handleDownload(d.verhaltenskodexUrl!)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          <Upload className="w-3 h-3 rotate-180" /> Dokument ansehen
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Kein Dokument vorhanden</span>
                      )}
                      <button onClick={() => vkRef.current?.click()} disabled={uploading}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 disabled:opacity-50">
                        <Upload className="w-3 h-3" /> {d.verhaltenskodexUrl ? 'Ersetzen' : 'Hochladen'}
                      </button>
                      <input ref={vkRef} type="file" accept=".pdf,image/*" className="hidden"
                        onChange={e => { handleUpload('verhaltenskodex', e.target.files?.[0]); e.target.value = ''; }} />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">Führungszeugnis</p>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.fuehrungszeugnisVerified}
                        onChange={e => set('fuehrungszeugnisVerified', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">Verifiziert</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-500">Datum:</label>
                      <input type="date" value={form.fuehrungszeugnisDate || ''}
                        onChange={e => set('fuehrungszeugnisDate', e.target.value || null)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div className="flex items-center gap-2">
                      {d.fuehrungszeugnisUrl ? (
                        <button onClick={() => handleDownload(d.fuehrungszeugnisUrl!)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          <Upload className="w-3 h-3 rotate-180" /> Dokument ansehen
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Kein Dokument vorhanden</span>
                      )}
                      <button onClick={() => fzRef.current?.click()} disabled={uploading}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 disabled:opacity-50">
                        <Upload className="w-3 h-3" /> {d.fuehrungszeugnisUrl ? 'Ersetzen' : 'Hochladen'}
                      </button>
                      <input ref={fzRef} type="file" accept=".pdf,image/*" className="hidden"
                        onChange={e => { handleUpload('fuehrungszeugnis', e.target.files?.[0]); e.target.value = ''; }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Chip / Schlüssel</h4>
            <input type="text" value={form.chipId}
              onChange={e => set('chipId', e.target.value)}
              placeholder="Chip-ID oder Schlüsselnummer"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.unterlagenVollstaendig}
                onChange={e => set('unterlagenVollstaendig', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm font-medium text-gray-700">Unterlagen vollständig</span>
            </label>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Interne Notizen</h4>
            <textarea value={form.notizen}
              onChange={e => set('notizen', e.target.value)} rows={2}
              placeholder="Nur für Verwalter sichtbar..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
          </div>

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
