import React, { useState } from 'react';
import { Button } from '../ui';

const EMPTY = { jahr: new Date().getFullYear(), mannschaft: '', titel: '' };

/**
 * ErfolgForm – Inline-Formular zum Anlegen/Bearbeiten eines Erfolgs.
 */
const ErfolgForm = ({ initial = null, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(initial || EMPTY);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.mannschaft.trim() || !form.titel.trim()) return;
    onSave({
      jahr:       Number(form.jahr),
      mannschaft: form.mannschaft.trim(),
      titel:      form.titel.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Jahr *</label>
          <input
            type="number"
            value={form.jahr}
            onChange={e => set('jahr', e.target.value)}
            min={1990} max={2099}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Mannschaft *</label>
          <input
            type="text"
            value={form.mannschaft}
            onChange={e => set('mannschaft', e.target.value)}
            placeholder="z.B. A-Junioren U19"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Titel / Erfolg *</label>
          <input
            type="text"
            value={form.titel}
            onChange={e => set('titel', e.target.value)}
            placeholder="z.B. Kreismeister"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" type="button" onClick={onCancel}>Abbrechen</Button>
        <Button variant="primary" size="sm" type="submit" disabled={loading}>
          {loading ? 'Speichern...' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
};

export default ErfolgForm;
