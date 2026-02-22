import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import FacilityCard from './FacilityCard';
import FacilityEditor from './FacilityEditor';
import ResourceGroupSection from './ResourceGroupSection';
import AddButton from '../../ui/AddButton';

const FacilitySection = ({ facility, groups, resources, onUpdateFacility, onDeleteFacility, onUpdateGroup, onDeleteGroup, onAddGroup, onUpdateResource, onDeleteResource, onAddResource, slots, onAddSlot, onDeleteSlot }) => {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const facilityGroups = groups.filter(g => g.facilityId === facility.id).sort((a, b) => a.sortOrder - b.sortOrder);
  const facilityResourceCount = resources.filter(r => facilityGroups.some(g => g.id === r.groupId)).length;

  return (
    <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          <div className="flex-1">
            {editing ? (
              <FacilityEditor facility={facility}
                onSave={(updated) => { onUpdateFacility(updated); setEditing(false); }}
                onCancel={() => setEditing(false)}
                onDelete={(id) => { onDeleteFacility(id); setEditing(false); }}
                isNew={false} />
            ) : (
              <FacilityCard facility={facility} onEdit={() => setEditing(true)} />
            )}
          </div>
        </div>
        {!editing && (
          <div className="ml-10 flex items-center gap-3 text-xs text-gray-400">
            <span>{facilityGroups.length} Gruppe{facilityGroups.length !== 1 ? 'n' : ''}</span>
            <span>·</span>
            <span>{facilityResourceCount} Ressource{facilityResourceCount !== 1 ? 'n' : ''}</span>
          </div>
        )}
      </div>
      {expanded && (
        <div className="bg-gray-50/50 p-4">
          {facilityGroups.map(group => (
            <ResourceGroupSection key={group.id} group={group} resources={resources}
              onUpdateGroup={onUpdateGroup} onDeleteGroup={() => onDeleteGroup(group.id)}
              onUpdateResource={onUpdateResource} onDeleteResource={onDeleteResource} onAddResource={onAddResource}
              slots={slots} onAddSlot={onAddSlot} onDeleteSlot={onDeleteSlot} />
          ))}
          <AddButton label="Neue Ressourcengruppe" onClick={() => onAddGroup(facility.id)} size="md" />
        </div>
      )}
    </div>
  );
};

export default FacilitySection;
