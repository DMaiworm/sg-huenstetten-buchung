import React, { useState } from 'react';
import { Clock, Plus, X } from 'lucide-react';
import { DAYS_FULL } from '../../../config/constants';
import { Badge } from '../../ui/Badge';

const SlotPanel = ({ resourceId, slots, setSlots }) => {
  const [adding, setAdding] = useState(false);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startTime: '17:00', endTime: '21:00', validFrom: '', validUntil: '' });

  const resourceSlots = slots.filter(s => s.resourceId === resourceId);

  const handleAdd = (e) => {
    e.preventDefault();
    setSlots([...slots, { ...newSlot, resourceId, id: Date.now() }]);
    setAdding(false);
    setNewSlot({ dayOfWeek: 1, startTime: '17:00', endTime: '21:00', validFrom: '', validUntil: '' });
  };

  const handleDelete = (id) => setSlots(slots.filter(s => s.id !== id));

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-yellow-700" />
          <span className="text-xs font-bold text-yellow-900">Zeitfenster (Slots)</span>
          <span className="text-xs text-yellow-700">{resourceSlots.length} Slot{resourceSlots.length !== 1 ? 's' : ''}</span>
        </div>
        <button type="button" onClick={() => setAdding(!adding)}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer">
          <Plus className="w-3 h-3" /> Neuer Slot
        </button>
      </div>

      {resourceSlots.length === 0 && !adding && (
        <div className="text-xs text-yellow-700 italic">Keine Slots angelegt. Ressource ist ohne Slots nicht buchbar.</div>
      )}

      {resourceSlots.length > 0 && (
        <div className="flex flex-col gap-1 mb-2">
          {resourceSlots.map(slot => (
            <div key={slot.id} className="flex items-center gap-2 py-1.5 px-2 bg-white rounded border border-gray-200 text-xs">
              <Badge variant="info">{DAYS_FULL[slot.dayOfWeek]}</Badge>
              <span className="font-semibold">{slot.startTime} - {slot.endTime}</span>
              <span className="text-gray-400 text-xs">
                {slot.validFrom && slot.validUntil ? `${slot.validFrom} bis ${slot.validUntil}` : 'Unbegrenzt'}
              </span>
              <button type="button" onClick={() => handleDelete(slot.id)}
                className="ml-auto p-0.5 text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer rounded">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <form onSubmit={handleAdd} className="bg-white rounded border border-gray-200 p-2.5">
          <div className="grid grid-cols-5 gap-2 mb-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Wochentag</label>
              <select value={newSlot.dayOfWeek} onChange={e => setNewSlot({ ...newSlot, dayOfWeek: Number(e.target.value) })}
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded">
                {DAYS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Startzeit</label>
              <input type="time" value={newSlot.startTime} onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })}
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded" required />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Endzeit</label>
              <input type="time" value={newSlot.endTime} onChange={e => setNewSlot({ ...newSlot, endTime: e.target.value })}
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded" required />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Gültig ab</label>
              <input type="date" value={newSlot.validFrom} onChange={e => setNewSlot({ ...newSlot, validFrom: e.target.value })}
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Gültig bis</label>
              <input type="date" value={newSlot.validUntil} onChange={e => setNewSlot({ ...newSlot, validUntil: e.target.value })}
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded" />
            </div>
          </div>
          <div className="flex gap-1.5">
            <button type="submit" className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700">Anlegen</button>
            <button type="button" onClick={() => setAdding(false)} className="px-3 py-1 text-xs font-semibold bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Abbrechen</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SlotPanel;
