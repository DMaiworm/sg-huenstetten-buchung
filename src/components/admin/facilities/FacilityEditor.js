import React, { useState } from 'react';
import { Building2, Save, X, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';

const FacilityEditor = ({ facility, onSave, onCancel, onDelete, isNew }) => {
  const [form, setForm] = useState({ ...facility });

  return (
    <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50/30">
      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Building2 className="w-4 h-4 text-blue-600" />
        {isNew ? 'Neue Anlage' : 'Anlage bearbeiten'}
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Name der Anlage</label>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="z.B. Biogrund Sportpark" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Straße</label>
          <input type="text" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hausnr.</label>
          <input type="text" value={form.houseNumber} onChange={e => setForm({ ...form, houseNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">PLZ</label>
          <input type="text" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ort</label>
          <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="primary" size="sm" onClick={() => onSave(form)}><Save className="w-4 h-4 mr-1" />Speichern</Button>
        <Button variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4 mr-1" />Abbrechen</Button>
        {!isNew && (
          <Button variant="danger" size="sm" className="ml-auto" onClick={() => onDelete(facility.id)}>
            <Trash2 className="w-4 h-4 mr-1" />Anlage löschen
          </Button>
        )}
      </div>
    </div>
  );
};

export default FacilityEditor;
