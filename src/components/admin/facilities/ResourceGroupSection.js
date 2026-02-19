import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, Clock, Plus } from 'lucide-react';
import { GROUP_ICONS } from '../../../config/constants';
import ResourceCard from './ResourceCard';
import AddButton from '../../ui/AddButton';

const ResourceGroupSection = ({ group, resources, onUpdateGroup, onDeleteGroup, onUpdateResource, onDeleteResource, onAddResource, slots, setSlots }) => {
  const [expanded, setExpanded] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const groupIcon = GROUP_ICONS.find(g => g.id === group.icon);
  const groupResources = resources.filter(r => r.groupId === group.id);

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <span className="text-base">{groupIcon ? groupIcon.emoji : ''}</span>
        {editingName ? (
          <input type="text" value={group.name} onChange={e => onUpdateGroup({ ...group, name: e.target.value })}
            onBlur={() => setEditingName(false)} onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            autoFocus className="flex-1 px-2 py-1 font-semibold text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500" />
        ) : (
          <h4 className="font-semibold text-sm text-gray-800 flex-1 cursor-pointer" onClick={() => setEditingName(true)}>{group.name}</h4>
        )}
        <span className="text-xs text-gray-400">{groupResources.length} Res.</span>
        <select value={group.icon} onChange={e => onUpdateGroup({ ...group, icon: e.target.value })} className="text-xs border border-gray-200 rounded px-1.5 py-1">
          {GROUP_ICONS.map(gi => (<option key={gi.id} value={gi.id}>{gi.label}</option>))}
        </select>
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer" title="Slot-basierte Buchung für alle Ressourcen dieser Gruppe">
          <input type="checkbox" checked={group.sharedScheduling} onChange={e => onUpdateGroup({ ...group, sharedScheduling: e.target.checked })} className="w-3.5 h-3.5 text-yellow-600 rounded" />
          <Clock className="w-3.5 h-3.5" style={{ color: group.sharedScheduling ? '#d97706' : undefined }} />
          Slots
        </label>
        <button onClick={onDeleteGroup} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      {expanded && (
        <div className="ml-4">
          {groupResources.map(res => (
            <ResourceCard key={res.id} resource={res}
              onUpdate={(updated) => onUpdateResource(res.id, updated)}
              onDelete={() => onDeleteResource(res.id)}
              showSlots={group.sharedScheduling}
              slots={slots} setSlots={setSlots} />
          ))}
          <AddButton label="Neue Ressource" onClick={() => onAddResource(group.id)} />
        </div>
      )}
    </div>
  );
};

export default ResourceGroupSection;
