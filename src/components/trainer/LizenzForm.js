import React, { useState } from 'react';
import { Button } from '../ui';

const EMPTY = {
  bezeichnung:      '',
  ausstellendeOrg:  '',
  ausstellungsdatum: '',
  ablaufdatum:      '',
};

/**
 * LizenzForm – Inline-Formular zum Anlegen/Bearbeiten einer Lizenz.
 */
const LizenzForm = ({ initial = null, onSave, onCancel, loading }) => {
  const [form, setForm] = useState(initial || EMPTY);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.bezeichnung.trim()) return;
    onSave({
      bezeichnung:       form.bezeichnung.trim(),
      ausstellendeOrg:   form.ausstellendeOrg.trim() || null,
      ausstellungsdatum: form.ausstellungsdatum || null,
      ablaufdatum:       form.ablaufdatum       || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Bezeichnung *</label>
          <input
            type="text"
            value={form.bezeichnung}
            onChange={e => set('bezeichnung', e.target.value)}
            placeholder="z.B. DFB-B-Lizenz"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ausstellende Organisation</label>
          <input
            type="text"
            value={form.ausstellendeOrg}
            onChange={e => set('ausstellendeOrg', e.target.value)}
            placeholder="z.B. DFB"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ausgestellt</label>
            <input
              type="date"
              value={form.ausstellungsdatum || ''}
              onChange={e => set('ausstellungsdatum', e.target.value || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gültig bis</label>
            <input
              type="date"
              value={form.ablaufdatum || ''}
              onChange={e => set('ablaufdatum', e.target.value || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
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

export default LizenzForm;
