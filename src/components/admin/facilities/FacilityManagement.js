import React, { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { COLOR_PRESETS } from '../../../config/constants';
import { generateId } from '../../../config/facilityConfig';
import { Button } from '../../ui/Button';
import PageHeader from '../../ui/PageHeader';
import EmptyState from '../../ui/EmptyState';
import FacilityEditor from './FacilityEditor';
import FacilitySection from './FacilitySection';

const FacilityManagement = ({ facilities, setFacilities, resourceGroups, setResourceGroups, resources, setResources, slots, setSlots }) => {
  const [addingFacility, setAddingFacility] = useState(false);

  const handleAddFacility = (form) => {
    setFacilities([...facilities, { ...form, id: generateId('fac'), sortOrder: facilities.length + 1 }]);
    setAddingFacility(false);
  };

  const handleUpdateFacility = (updated) => setFacilities(facilities.map(f => f.id === updated.id ? updated : f));

  const handleDeleteFacility = (id) => {
    const facGroups = resourceGroups.filter(g => g.facilityId === id);
    const facResCount = resources.filter(r => facGroups.some(g => g.id === r.groupId)).length;
    if (facGroups.length > 0 || facResCount > 0) {
      if (!window.confirm(`Diese Anlage enthält ${facGroups.length} Gruppe(n) und ${facResCount} Ressource(n). Alles löschen?`)) return;
    }
    const groupIds = facGroups.map(g => g.id);
    setResources(resources.filter(r => !groupIds.includes(r.groupId)));
    setResourceGroups(resourceGroups.filter(g => g.facilityId !== id));
    setFacilities(facilities.filter(f => f.id !== id));
  };

  const handleAddGroup = (facilityId) => {
    setResourceGroups([...resourceGroups, {
      id: generateId('group'), facilityId, name: 'Neue Gruppe',
      icon: 'outdoor', sortOrder: resourceGroups.filter(g => g.facilityId === facilityId).length + 1, sharedScheduling: false,
    }]);
  };
  const handleUpdateGroup = (updated) => setResourceGroups(resourceGroups.map(g => g.id === updated.id ? updated : g));
  const handleDeleteGroup = (groupId) => {
    const groupRes = resources.filter(r => r.groupId === groupId);
    if (groupRes.length > 0 && !window.confirm(`Diese Gruppe enthält ${groupRes.length} Ressource(n). Alle löschen?`)) return;
    setResourceGroups(resourceGroups.filter(g => g.id !== groupId));
    setResources(resources.filter(r => r.groupId !== groupId));
  };

  const handleAddResource = (groupId) => {
    setResources([...resources, {
      id: generateId('res'), groupId, name: 'Neue Ressource',
      color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
      splittable: false, bookingMode: 'free', subResources: [],
    }]);
  };
  const handleUpdateResource = (id, updated) => setResources(resources.map(r => r.id === id ? updated : r));
  const handleDeleteResource = (id) => {
    if (slots && setSlots) setSlots(slots.filter(s => s.resourceId !== id));
    setResources(resources.filter(r => r.id !== id));
  };

  const totalResources = resources.length;
  const totalSubResources = resources.reduce((sum, r) => sum + (r.subResources || []).length, 0);
  const totalSlots = slots ? slots.length : 0;

  const subtitle = [
    `${facilities.length} Anlage${facilities.length !== 1 ? 'n' : ''}`,
    `${resourceGroups.length} Gruppe${resourceGroups.length !== 1 ? 'n' : ''}`,
    `${totalResources} Ressource${totalResources !== 1 ? 'n' : ''}`,
    totalSubResources > 0 ? `${totalSubResources} Unter-Res.` : null,
    totalSlots > 0 ? `${totalSlots} Slot${totalSlots !== 1 ? 's' : ''}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div>
      <PageHeader
        icon={Building2} title="Anlagen- & Ressourcenverwaltung" subtitle={subtitle}
        actions={<Button variant="primary" size="sm" onClick={() => setAddingFacility(true)}><Plus className="w-4 h-4 mr-1" /> Neue Anlage</Button>}
      />

      {addingFacility && (
        <div className="mb-6">
          <FacilityEditor facility={{ name: '', street: '', houseNumber: '', zip: '', city: '' }}
            onSave={handleAddFacility} onCancel={() => setAddingFacility(false)} onDelete={() => {}} isNew={true} />
        </div>
      )}

      {facilities.length === 0 && !addingFacility ? (
        <EmptyState icon={Building2} title="Keine Anlagen vorhanden" action="Erste Anlage erstellen" onAction={() => setAddingFacility(true)} />
      ) : (
        facilities.sort((a, b) => a.sortOrder - b.sortOrder).map(fac => (
          <FacilitySection key={fac.id} facility={fac}
            groups={resourceGroups} resources={resources}
            onUpdateFacility={handleUpdateFacility} onDeleteFacility={handleDeleteFacility}
            onUpdateGroup={handleUpdateGroup} onDeleteGroup={handleDeleteGroup} onAddGroup={handleAddGroup}
            onUpdateResource={handleUpdateResource} onDeleteResource={handleDeleteResource} onAddResource={handleAddResource}
            slots={slots} setSlots={setSlots} />
        ))
      )}
    </div>
  );
};

export default FacilityManagement;
