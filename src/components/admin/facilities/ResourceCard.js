import React, { useState } from 'react';
import { ChevronDown, ChevronRight, SplitSquareHorizontal, Plus, Trash2, Settings } from 'lucide-react';
import { COLOR_PRESETS } from '../../../config/constants';
import { generateId } from '../../../config/facilityConfig';
import SubResourceRow from './SubResourceRow';
import SlotPanel from './SlotPanel';

const ResourceCard = ({ resource, onUpdate, onDelete, showSlots, slots, onAddSlot, onDeleteSlot }) => {
  const [expanded, setExpanded] = useState(false);
  const [slotsOpen, setSlotsOpen] = useState(false);
  const slotCount = slots ? slots.filter(s => s.resourceId === resource.id).length : 0;

  const handleSubAdd = () => {
    const idx = (resource.subResources || []).length + 1;
    const newSub = { id: generateId('sub'), name: `${resource.name} - Teil ${idx}`, color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)] };
    onUpdate({ ...resource, subResources: [...(resource.subResources || []), newSub] });
  };

  const handleSubUpdate = (idx, updated) => {
    const subs = [...(resource.subResources || [])]; subs[idx] = updated;
    onUpdate({ ...resource, subResources: subs });
  };

  const handleSubDelete = (idx) => {
    const subs = (resource.subResources || []).filter((_, i) => i !== idx);
    onUpdate({ ...resource, subResources: subs, splittable: subs.length > 0 });
  };

  const handleToggleSplittable = (val) => {
    if (val && (!resource.subResources || resource.subResources.length === 0)) {
      onUpdate({ ...resource, splittable: true, subResources: [
        { id: generateId('sub'), name: `${resource.name} - links`, color: COLOR_PRESETS[1] },
        { id: generateId('sub'), name: `${resource.name} - rechts`, color: COLOR_PRESETS[2] },
      ]});
    } else {
      onUpdate({ ...resource, splittable: val });
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white mb-2 overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="w-5 h-5 rounded" style={{ backgroundColor: resource.color }} />
        <input type="text" value={resource.name} onChange={e => onUpdate({ ...resource, name: e.target.value })}
          className="flex-1 px-2 py-1 font-medium border border-transparent hover:border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer" title="Teilbar in Unterressourcen">
            <SplitSquareHorizontal className="w-3.5 h-3.5" />
            <input type="checkbox" checked={resource.splittable} onChange={e => handleToggleSplittable(e.target.checked)} className="w-3.5 h-3.5 text-blue-600 rounded" />
            Teilbar
          </label>
          {showSlots && (
            <button onClick={() => setSlotsOpen(!slotsOpen)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${slotsOpen ? 'bg-yellow-100 text-yellow-800' : 'text-gray-400 hover:text-yellow-700 hover:bg-yellow-50'}`}
              title="Zeitfenster verwalten">
              <Settings className={`w-3.5 h-3.5 ${slotsOpen ? 'text-yellow-700' : ''}`} />
              {slotCount > 0 && <span className="font-semibold">{slotCount}</span>}
            </button>
          )}
        </div>
        <input type="color" value={resource.color} onChange={e => onUpdate({ ...resource, color: e.target.value })} className="w-7 h-7 rounded cursor-pointer border-0" />
        <button onClick={onDelete} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
      </div>

      {showSlots && slotsOpen && slots && (
        <div className="px-3 pb-3">
          <SlotPanel resourceId={resource.id} slots={slots} onAddSlot={onAddSlot} onDeleteSlot={onDeleteSlot} />
        </div>
      )}

      {expanded && (
        <div className="border-t border-gray-100 p-3 bg-gray-50/50 space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Buchungsmodus</label>
              <select value={resource.bookingMode} onChange={e => onUpdate({ ...resource, bookingMode: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500">
                <option value="free">Frei buchbar</option>
                <option value="slotOnly">Nur in zugewiesenen Slots</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Farbe</label>
              <div className="flex gap-1 flex-wrap">
                {COLOR_PRESETS.map(c => (
                  <button key={c} onClick={() => onUpdate({ ...resource, color: c })}
                    className={`w-5 h-5 rounded-sm border-2 ${resource.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          {resource.splittable && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><SplitSquareHorizontal className="w-3.5 h-3.5" /> Unterressourcen</span>
                <button onClick={handleSubAdd} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"><Plus className="w-3 h-3" /> Hinzufügen</button>
              </div>
              <div className="space-y-1">
                {(resource.subResources || []).map((sub, i) => (
                  <SubResourceRow key={sub.id} sub={sub} onUpdate={(updated) => handleSubUpdate(i, updated)} onDelete={() => handleSubDelete(i)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceCard;
