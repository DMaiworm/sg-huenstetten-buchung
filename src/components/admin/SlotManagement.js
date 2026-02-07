import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { RESOURCES, DAYS_FULL } from '../../config/constants';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Badge';

const SlotManagement = ({ slots, setSlots }) => {
  const [showForm, setShowForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    resourceId: 'halle-gross', dayOfWeek: 1, startTime: '17:00', endTime: '21:00', validFrom: '', validUntil: '',
  });

  const handleAddSlot = (e) => {
    e.preventDefault();
    setSlots([...slots, { ...newSlot, id: Date.now() }]);
    setShowForm(false);
  };

  const handleDeleteSlot = (id) => setSlots(slots.filter(s => s.id !== id));

  const limitedResources = RESOURCES.filter(r => r.type === 'limited');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Slot-Verwaltung</h2>
          <p className="text-gray-500">Verwalte die zugewiesenen Zeitfenster</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5 mr-2" />Neuer Slot
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAddSlot} className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-4">Neuen Slot anlegen</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ressource</label>
              <select value={newSlot.resourceId} onChange={(e) => setNewSlot({ ...newSlot, resourceId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                {limitedResources.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wochentag</label>
              <select value={newSlot.dayOfWeek} onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                {DAYS_FULL.map((day, i) => (<option key={i} value={i}>{day}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Startzeit</label>
              <input type="time" value={newSlot.startTime} onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endzeit</label>
              <input type="time" value={newSlot.endTime} onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gueltig ab</label>
              <input type="date" value={newSlot.validFrom} onChange={(e) => setNewSlot({ ...newSlot, validFrom: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gueltig bis</label>
              <input type="date" value={newSlot.validUntil} onChange={(e) => setNewSlot({ ...newSlot, validUntil: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit">Slot anlegen</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Abbrechen</Button>
          </div>
        </form>
      )}

      {limitedResources.map(resource => {
        const resourceSlots = slots.filter(s => s.resourceId === resource.id);
        return (
          <div key={resource.id} className="mb-8">
            <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: resource.color }} />
              {resource.name}
            </h3>
            {resourceSlots.length === 0 ? (
              <p className="text-gray-500 text-sm">Keine Slots angelegt</p>
            ) : (
              <div className="grid gap-2">
                {resourceSlots.map(slot => (
                  <div key={slot.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="info">{DAYS_FULL[slot.dayOfWeek]}</Badge>
                      <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
                      <span className="text-sm text-gray-500">
                        Gueltig: {slot.validFrom} bis {slot.validUntil}
                      </span>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteSlot(slot.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SlotManagement;
