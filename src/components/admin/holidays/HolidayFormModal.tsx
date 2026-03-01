import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import { Button } from '../../ui/Button';
import type { Holiday } from '../../../types';

interface HolidayFormData {
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  year: number;
}

interface HolidayFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: HolidayFormData) => void;
  holiday: Holiday | null;
}

const HolidayFormModal: React.FC<HolidayFormModalProps> = ({ open, onClose, onSave, holiday }) => {
  const isEditing = !!holiday;

  const [form, setForm] = useState<HolidayFormData>({
    name: '', type: 'feiertag', startDate: '', endDate: '', year: new Date().getFullYear(),
  });

  useEffect(() => {
    if (holiday) {
      setForm({ name: holiday.name, type: holiday.type, startDate: holiday.startDate, endDate: holiday.endDate, year: holiday.year });
    } else {
      setForm({ name: '', type: 'feiertag', startDate: '', endDate: '', year: new Date().getFullYear() });
    }
  }, [holiday, open]);

  const handleStartDateChange = (val: string) => {
    const update = { ...form, startDate: val, endDate: form.endDate };
    if (form.type === 'feiertag') update.endDate = val;
    if (val) update.year = parseInt(val.split('-')[0], 10);
    setForm(update);
  };

  const handleEndDateChange = (val: string) => {
    setForm({ ...form, endDate: val });
  };

  const handleTypeChange = (val: string) => {
    const update = { ...form, type: val, endDate: form.endDate };
    if (val === 'feiertag' && form.startDate) update.endDate = form.startDate;
    setForm(update);
  };

  const isValid = form.name && form.startDate && form.endDate && form.endDate >= form.startDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave(form);
  };

  return (
    <Modal open={open} onClose={onClose}
      title={isEditing ? 'Eintrag bearbeiten' : 'Neuer Ferien-/Feiertagseintrag'}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!isValid}>
            {isEditing ? 'Speichern' : 'Anlegen'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
          <div className="flex gap-3">
            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
              form.type === 'feiertag' ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
              <input type="radio" name="type" value="feiertag" checked={form.type === 'feiertag'}
                onChange={(e) => handleTypeChange(e.target.value)} className="sr-only" />
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-sm font-medium">Feiertag</span>
            </label>
            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
              form.type === 'schulferien' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
              <input type="radio" name="type" value="schulferien" checked={form.type === 'schulferien'}
                onChange={(e) => handleTypeChange(e.target.value)} className="sr-only" />
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-sm font-medium">Schulferien</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bezeichnung</label>
          <input type="text" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={form.type === 'feiertag' ? 'z.B. Karfreitag' : 'z.B. Sommerferien'} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.type === 'feiertag' ? 'Datum' : 'Von'}
            </label>
            <input type="date" value={form.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          {form.type === 'schulferien' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
              <input type="date" value={form.endDate}
                min={form.startDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default HolidayFormModal;
