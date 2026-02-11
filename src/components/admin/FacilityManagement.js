import React, { useState } from 'react';
import { Building2, MapPin, Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronRight, Layers, SplitSquareHorizontal, Clock, Palette, GripVertical } from 'lucide-react';
import { Button } from '../ui/Badge';
import { generateId } from '../../config/facilityConfig';

const UMLAUT_A = String.fromCharCode(228);
const UMLAUT_O = String.fromCharCode(246);
const UMLAUT_U = String.fromCharCode(252);
const UMLAUT_SS = String.fromCharCode(223);

const GROUP_ICONS = [
  { id: 'outdoor', label: 'Au' + UMLAUT_SS + 'enanlagen', emoji: String.fromCharCode(55356, 57311) + String.fromCharCode(65039) },
  { id: 'indoor', label: 'Innenr' + UMLAUT_A + 'ume', emoji: String.fromCharCode(55356, 57312) },
  { id: 'shared', label: 'Geteilte Hallen', emoji: String.fromCharCode(55358, 56605) },
];

const COLOR_PRESETS = [
  '#15803d', '#22c55e', '#84cc16', '#f59e0b', '#ef4444',
  '#f97316', '#8b5cf6', '#a855f7', '#2563eb', '#0891b2',
  '#e11d48', '#6b7280', '#16a34a', '#dc2626', '#7c3aed',
];

// ===================== Facility Editor =====================
const FacilityEditor = ({ facility, onSave }) => {
  const [form, setForm] = useState({ ...facility });
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    onSave(form);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: facility.primaryColor + '15' }}>
              <Building2 className="w-6 h-6" style={{ color: facility.primaryColor }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{facility.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {facility.street} {facility.houseNumber}, {facility.zip} {facility.city}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{facility.club}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-blue-300 rounded-lg p-5 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-blue-600" />
        {'Sportst' + UMLAUT_A + 'tte bearbeiten'}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name der Anlage</label>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Verein</label>
          <input type="text" value={form.club} onChange={e => setForm({ ...form, club: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stra{UMLAUT_SS}e</label>
          <input type="text" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hausnummer</label>
          <input type="text" value={form.houseNumber} onChange={e => setForm({ ...form, houseNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
          <input type="text" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
          <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prim{UMLAUT_A}rfarbe</label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0" />
            <span className="text-sm text-gray-500">{form.primaryColor}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="primary" size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-1" />Speichern</Button>
        <Button variant="ghost" size="sm" onClick={() => { setForm({ ...facility }); setEditing(false); }}><X className="w-4 h-4 mr-1" />Abbrechen</Button>
      </div>
    </div>
  );
};

// ===================== Sub-Resource Row =====================
const SubResourceRow = ({ sub, onUpdate, onDelete }) => {
  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded ml-8 border border-gray-100">
      <GripVertical className="w-4 h-4 text-gray-300" />
      <div className="w-4 h-4 rounded" style={{ backgroundColor: sub.color }} />
      <input type="text" value={sub.name} onChange={e => onUpdate({ ...sub, name: e.target.value })}
        className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500" />
      <input type="color" value={sub.color} onChange={e => onUpdate({ ...sub, color: e.target.value })}
        className="w-7 h-7 rounded cursor-pointer border-0" />
      <button onClick={onDelete} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ===================== Resource Card =====================
const ResourceCard = ({ resource, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const handleSubAdd = () => {
    const idx = (resource.subResources || []).length + 1;
    const newSub = {
      id: generateId('sub'),
      name: resource.name + ' - Teil ' + idx,
      color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
    };
    onUpdate({ ...resource, subResources: [...(resource.subResources || []), newSub] });
  };

  const handleSubUpdate = (idx, updated) => {
    const subs = [...(resource.subResources || [])];
    subs[idx] = updated;
    onUpdate({ ...resource, subResources: subs });
  };

  const handleSubDelete = (idx) => {
    const subs = (resource.subResources || []).filter((_, i) => i !== idx);
    onUpdate({ ...resource, subResources: subs, splittable: subs.length > 0 });
  };

  const handleToggleSplittable = (val) => {
    if (val && (!resource.subResources || resource.subResources.length === 0)) {
      // Auto-create 2 sub-resources
      onUpdate({
        ...resource,
        splittable: true,
        subResources: [
          { id: generateId('sub'), name: resource.name + ' - links', color: COLOR_PRESETS[1] },
          { id: generateId('sub'), name: resource.name + ' - rechts', color: COLOR_PRESETS[2] },
        ],
      });
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
            <input type="checkbox" checked={resource.splittable} onChange={e => handleToggleSplittable(e.target.checked)}
              className="w-3.5 h-3.5 text-blue-600 rounded" />
            Teilbar
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer" title="Nur in zugewiesenen Slots buchbar">
            <Clock className="w-3.5 h-3.5" />
            <input type="checkbox" checked={resource.bookingMode === 'slotOnly'}
              onChange={e => onUpdate({ ...resource, bookingMode: e.target.checked ? 'slotOnly' : 'free' })}
              className="w-3.5 h-3.5 text-blue-600 rounded" />
            Slot-Pflicht
          </label>
        </div>
        <input type="color" value={resource.color} onChange={e => onUpdate({ ...resource, color: e.target.value })}
          className="w-7 h-7 rounded cursor-pointer border-0" />
        <button onClick={onDelete} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

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
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <SplitSquareHorizontal className="w-3.5 h-3.5" /> Unterressourcen
                </span>
                <button onClick={handleSubAdd}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Hinzuf{UMLAUT_U}gen
                </button>
              </div>
              <div className="space-y-1">
                {(resource.subResources || []).map((sub, i) => (
                  <SubResourceRow key={sub.id} sub={sub}
                    onUpdate={(updated) => handleSubUpdate(i, updated)}
                    onDelete={() => handleSubDelete(i)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===================== Resource Group Section =====================
const ResourceGroupSection = ({ group, resources, onUpdateGroup, onDeleteGroup, onUpdateResource, onDeleteResource, onAddResource }) => {
  const [expanded, setExpanded] = useState(true);
  const [editingName, setEditingName] = useState(false);

  const groupIcon = GROUP_ICONS.find(g => g.id === group.icon);
  const groupResources = resources.filter(r => r.groupId === group.id);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <span className="text-lg">{groupIcon ? groupIcon.emoji : ''}</span>
        {editingName ? (
          <input type="text" value={group.name} onChange={e => onUpdateGroup({ ...group, name: e.target.value })}
            onBlur={() => setEditingName(false)} onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            autoFocus className="flex-1 px-2 py-1 font-semibold border border-blue-300 rounded focus:ring-1 focus:ring-blue-500" />
        ) : (
          <h4 className="font-semibold text-gray-800 flex-1 cursor-pointer" onClick={() => setEditingName(true)}>
            {group.name}
          </h4>
        )}
        <span className="text-xs text-gray-400">{groupResources.length} Ressource{groupResources.length !== 1 ? 'n' : ''}</span>
        <div className="flex items-center gap-2">
          <select value={group.icon} onChange={e => onUpdateGroup({ ...group, icon: e.target.value })}
            className="text-xs border border-gray-200 rounded px-1.5 py-1">
            {GROUP_ICONS.map(gi => (
              <option key={gi.id} value={gi.id}>{gi.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer" title="Slotverwaltung f{UMLAUT_U}r alle Ressourcen dieser Gruppe">
            <input type="checkbox" checked={group.sharedScheduling}
              onChange={e => onUpdateGroup({ ...group, sharedScheduling: e.target.checked })}
              className="w-3.5 h-3.5 text-blue-600 rounded" />
            Slot-Verwaltung
          </label>
          <button onClick={onDeleteGroup} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Gruppe l{UMLAUT_O}schen">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="ml-4">
          {groupResources.map(res => (
            <ResourceCard key={res.id} resource={res}
              onUpdate={(updated) => onUpdateResource(res.id, updated)}
              onDelete={() => onDeleteResource(res.id)} />
          ))}
          <button onClick={() => onAddResource(group.id)}
            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center gap-1 transition-colors">
            <Plus className="w-4 h-4" /> Neue Ressource
          </button>
        </div>
      )}
    </div>
  );
};

// ===================== Main Component =====================
const FacilityManagement = ({ facility, setFacility, resourceGroups, setResourceGroups, resources, setResources }) => {

  const handleAddGroup = () => {
    const newGroup = {
      id: generateId('group'),
      facilityId: facility.id,
      name: 'Neue Gruppe',
      icon: 'outdoor',
      sortOrder: resourceGroups.length + 1,
      sharedScheduling: false,
    };
    setResourceGroups([...resourceGroups, newGroup]);
  };

  const handleUpdateGroup = (updated) => {
    setResourceGroups(resourceGroups.map(g => g.id === updated.id ? updated : g));
  };

  const handleDeleteGroup = (groupId) => {
    const groupResources = resources.filter(r => r.groupId === groupId);
    if (groupResources.length > 0) {
      if (!window.confirm('Diese Gruppe enth' + UMLAUT_A + 'lt ' + groupResources.length + ' Ressource(n). Alle werden gel' + UMLAUT_O + 'scht. Fortfahren?')) return;
    }
    setResourceGroups(resourceGroups.filter(g => g.id !== groupId));
    setResources(resources.filter(r => r.groupId !== groupId));
  };

  const handleAddResource = (groupId) => {
    const newResource = {
      id: generateId('res'),
      groupId,
      name: 'Neue Ressource',
      color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
      splittable: false,
      bookingMode: 'free',
      subResources: [],
    };
    setResources([...resources, newResource]);
  };

  const handleUpdateResource = (id, updated) => {
    setResources(resources.map(r => r.id === id ? updated : r));
  };

  const handleDeleteResource = (id) => {
    setResources(resources.filter(r => r.id !== id));
  };

  // Stats
  const totalResources = resources.length;
  const totalSubResources = resources.reduce((sum, r) => sum + (r.subResources || []).length, 0);
  const slotResources = resources.filter(r => r.bookingMode === 'slotOnly').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Anlagen- & Ressourcenverwaltung
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {resourceGroups.length} Gruppe{resourceGroups.length !== 1 ? 'n' : ''} {String.fromCharCode(183)} {totalResources} Ressource{totalResources !== 1 ? 'n' : ''}
            {totalSubResources > 0 && (' ' + String.fromCharCode(183) + ' ' + totalSubResources + ' Unterressource' + (totalSubResources !== 1 ? 'n' : ''))}
            {slotResources > 0 && (' ' + String.fromCharCode(183) + ' ' + slotResources + ' mit Slot-Pflicht')}
          </p>
        </div>
      </div>

      {/* Facility Info */}
      <FacilityEditor facility={facility} onSave={setFacility} />

      {/* Resource Groups */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-400" />
            Ressourcengruppen
          </h3>
          <Button variant="primary" size="sm" onClick={handleAddGroup}>
            <Plus className="w-4 h-4 mr-1" /> Neue Gruppe
          </Button>
        </div>

        {resourceGroups.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">Keine Gruppen vorhanden</p>
            <button onClick={handleAddGroup} className="mt-2 text-sm text-blue-600 hover:text-blue-800">
              Erste Gruppe erstellen
            </button>
          </div>
        ) : (
          resourceGroups
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(group => (
              <ResourceGroupSection
                key={group.id}
                group={group}
                resources={resources}
                onUpdateGroup={handleUpdateGroup}
                onDeleteGroup={() => handleDeleteGroup(group.id)}
                onUpdateResource={handleUpdateResource}
                onDeleteResource={handleDeleteResource}
                onAddResource={handleAddResource}
              />
            ))
        )}
      </div>
    </div>
  );
};

export default FacilityManagement;
