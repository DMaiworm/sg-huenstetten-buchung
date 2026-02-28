import React, { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { COLOR_PRESETS } from '../../../config/constants';
import { useConfirm } from '../../../hooks/useConfirm';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '../../ui/Button';
import PageHeader from '../../ui/PageHeader';
import EmptyState from '../../ui/EmptyState';
import FacilityEditor from './FacilityEditor';
import FacilitySection from './FacilitySection';

const FacilityManagement = ({
  facilities, resourceGroups, resources, slots,
  createFacility, updateFacility, deleteFacility,
  createResourceGroup, updateResourceGroup, deleteResourceGroup,
  createResource, updateResource, deleteResource,
  createSlot, updateSlot, deleteSlot,
}) => {
  const [addingFacility, setAddingFacility] = useState(false);
  const [confirm, confirmDialog] = useConfirm();
  const { addToast } = useToast();

  const handleAddFacility = async (form) => {
    const { error } = await createFacility({ ...form, sortOrder: facilities.length + 1 });
    if (error) { addToast('Anlage erstellen fehlgeschlagen: ' + error, 'error'); return; }
    setAddingFacility(false);
  };

  const handleUpdateFacility = async (updated) => {
    const { error } = await updateFacility(updated);
    if (error) addToast('Anlage aktualisieren fehlgeschlagen: ' + error, 'error');
  };

  const handleDeleteFacility = async (id) => {
    const facGroups = resourceGroups.filter(g => g.facilityId === id);
    const facResCount = resources.filter(r => facGroups.some(g => g.id === r.groupId)).length;
    if (facGroups.length > 0 || facResCount > 0) {
      const ok = await confirm({
        title: 'Anlage löschen?',
        message: `Diese Anlage enthält ${facGroups.length} Gruppe(n) und ${facResCount} Ressource(n). Alles löschen?`,
        confirmLabel: 'Alles löschen', variant: 'danger',
      });
      if (!ok) return;
    }
    const { error } = await deleteFacility(id);
    if (error) addToast('Anlage löschen fehlgeschlagen: ' + error, 'error');
  };

  const handleAddGroup = async (facilityId) => {
    const { error } = await createResourceGroup({
      facilityId, name: 'Neue Gruppe', icon: 'outdoor',
      sortOrder: resourceGroups.filter(g => g.facilityId === facilityId).length + 1,
      sharedScheduling: false,
    });
    if (error) addToast('Gruppe erstellen fehlgeschlagen: ' + error, 'error');
  };

  const handleUpdateGroup = async (updated) => {
    const { error } = await updateResourceGroup(updated);
    if (error) addToast('Gruppe aktualisieren fehlgeschlagen: ' + error, 'error');
  };

  const handleDeleteGroup = async (groupId) => {
    const groupRes = resources.filter(r => r.groupId === groupId);
    if (groupRes.length > 0) {
      const ok = await confirm({
        title: 'Gruppe löschen?',
        message: `Diese Gruppe enthält ${groupRes.length} Ressource(n). Alle löschen?`,
        confirmLabel: 'Alle löschen', variant: 'danger',
      });
      if (!ok) return;
    }
    const { error } = await deleteResourceGroup(groupId);
    if (error) addToast('Gruppe löschen fehlgeschlagen: ' + error, 'error');
  };

  const handleAddResource = async (groupId) => {
    const { error } = await createResource({
      groupId, name: 'Neue Ressource',
      color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
      splittable: false, bookingMode: 'free',
    });
    if (error) addToast('Ressource erstellen fehlgeschlagen: ' + error, 'error');
  };

  const handleUpdateResource = async (id, updated) => {
    const { error } = await updateResource({ ...updated, id });
    if (error) addToast('Ressource aktualisieren fehlgeschlagen: ' + error, 'error');
  };

  const handleDeleteResource = async (id) => {
    const { error } = await deleteResource(id);
    if (error) addToast('Ressource löschen fehlgeschlagen: ' + error, 'error');
  };

  const handleAddSlot = async (slotData) => {
    const { error } = await createSlot(slotData);
    if (error) addToast('Slot erstellen fehlgeschlagen: ' + error, 'error');
  };

  const handleDeleteSlot = async (id) => {
    const { error } = await deleteSlot(id);
    if (error) addToast('Slot löschen fehlgeschlagen: ' + error, 'error');
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
            slots={slots} onAddSlot={handleAddSlot} onDeleteSlot={handleDeleteSlot} />
        ))
      )}

      {confirmDialog}
    </div>
  );
};

export default FacilityManagement;
