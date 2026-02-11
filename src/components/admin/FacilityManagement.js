import React, { useState } from 'react';
import { Building2, MapPin, Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronRight, Layers, SplitSquareHorizontal, Clock, GripVertical } from 'lucide-react';
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

// ===================== Facility Card (display mode) =====================
const FacilityCard = ({ facility, onEdit }) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50">
      <Building2 className="w-5 h-5 text-blue-600" />
    </div>
    <div className="flex-1">
      <h3 className="text-lg font-bold text-gray-900">{facility.name}</h3>
      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
        <MapPin className="w-3 h-3" />
        {facility.street} {facility.houseNumber}{facility.street ? ', ' : ''}{facility.zip} {facility.city}
      </p>
    </div>
    <Button variant="ghost" size="sm" onClick={onEdit}>
      <Edit2 className="w-4 h-4" />
    </Button>
  </div>
);

// ===================== Facility Editor (edit mode) =====================
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
          <label className="block text-xs font-medium text-gray-600 mb-1">Stra{UMLAUT_SS}e</label>
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
            <Trash2 className="w-4 h-4 mr-1" />Anlage l{UMLAUT_O}schen
          </Button>
        )}
      </div>
    </div>
  );
};

// ===================== Sub-Resource Row =====================
const SubResourceRow = ({ sub, onUpdate, onDelete }) => (
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

// ===================== Resource Card =====================
const ResourceCard = ({ resource, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const handleSubAdd = () => {
    const idx = (resource.subResources || []).length + 1;
    const newSub = { id: generateId('sub'), name: resource.name + ' - Teil ' + idx, color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)] };
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
        { id: generateId('sub'), name: resource.name + ' - links', color: COLOR_PRESETS[1] },
        { id: generateId('sub'), name: resource.name + ' - rechts', color: COLOR_PRESETS[2] },
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
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer" title="Nur in zugewiesenen Slots buchbar">
            <Clock className="w-3.5 h-3.5" />
            <input type="checkbox" checked={resource.bookingMode === 'slotOnly'}
              onChange={e => onUpdate({ ...resource, bookingMode: e.target.checked ? 'slotOnly' : 'free' })} className="w-3.5 h-3.5 text-blue-600 rounded" />
            Slot-Pflicht
          </label>
        </div>
        <input type="color" value={resource.color} onChange={e => onUpdate({ ...resource, color: e.target.value })} className="w-7 h-7 rounded cursor-pointer border-0" />
        <button onClick={onDelete} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1"><SplitSquareHorizontal className="w-3.5 h-3.5" /> Unterressourcen</span>
                <button onClick={handleSubAdd} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"><Plus className="w-3 h-3" /> Hinzuf{UMLAUT_U}gen</button>
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

// ===================== Resource Group Section =====================
const ResourceGroupSection = ({ group, resources, onUpdateGroup, onDeleteGroup, onUpdateResource, onDeleteResource, onAddResource }) => {
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
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={group.sharedScheduling} onChange={e => onUpdateGroup({ ...group, sharedScheduling: e.target.checked })} className="w-3.5 h-3.5 text-blue-600 rounded" />
          Slots
        </label>
        <button onClick={onDeleteGroup} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      {expanded && (
        <div className="ml-4">
          {groupResources.map(res => (
            <ResourceCard key={res.id} resource={res} onUpdate={(updated) => onUpdateResource(res.id, updated)} onDelete={() => onDeleteResource(res.id)} />
          ))}
          <button onClick={() => onAddResource(group.id)}
            className="w-full py-1.5 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center gap-1 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Neue Ressource
          </button>
        </div>
      )}
    </div>
  );
};

// ===================== Facility Section =====================
const FacilitySection = ({ facility, groups, resources, onUpdateFacility, onDeleteFacility, onUpdateGroup, onDeleteGroup, onAddGroup, onUpdateResource, onDeleteResource, onAddResource }) => {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const facilityGroups = groups.filter(g => g.facilityId === facility.id).sort((a, b) => a.sortOrder - b.sortOrder);
  const facilityResourceCount = resources.filter(r => facilityGroups.some(g => g.id === r.groupId)).length;

  return (
    <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
      {/* Facility Header */}
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
            <span>{String.fromCharCode(183)}</span>
            <span>{facilityResourceCount} Ressource{facilityResourceCount !== 1 ? 'n' : ''}</span>
          </div>
        )}
      </div>

      {/* Groups & Resources */}
      {expanded && (
        <div className="bg-gray-50/50 p-4">
          {facilityGroups.map(group => (
            <ResourceGroupSection key={group.id} group={group} resources={resources}
              onUpdateGroup={onUpdateGroup} onDeleteGroup={() => onDeleteGroup(group.id)}
              onUpdateResource={onUpdateResource} onDeleteResource={onDeleteResource} onAddResource={onAddResource} />
          ))}
          <button onClick={() => onAddGroup(facility.id)}
            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center gap-1 transition-colors mt-2">
            <Plus className="w-4 h-4" /> Neue Ressourcengruppe
          </button>
        </div>
      )}
    </div>
  );
};

// ===================== Main Component =====================
const FacilityManagement = ({ facilities, setFacilities, resourceGroups, setResourceGroups, resources, setResources }) => {
  const [addingFacility, setAddingFacility] = useState(false);

  // --- Facility CRUD ---
  const handleAddFacility = (form) => {
    setFacilities([...facilities, { ...form, id: generateId('fac'), sortOrder: facilities.length + 1 }]);
    setAddingFacility(false);
  };

  const handleUpdateFacility = (updated) => {
    setFacilities(facilities.map(f => f.id === updated.id ? updated : f));
  };

  const handleDeleteFacility = (id) => {
    const facGroups = resourceGroups.filter(g => g.facilityId === id);
    const facResCount = resources.filter(r => facGroups.some(g => g.id === r.groupId)).length;
    if (facGroups.length > 0 || facResCount > 0) {
      if (!window.confirm('Diese Anlage enth' + UMLAUT_A + 'lt ' + facGroups.length + ' Gruppe(n) und ' + facResCount + ' Ressource(n). Alles l' + UMLAUT_O + 'schen?')) return;
    }
    const groupIds = facGroups.map(g => g.id);
    setResources(resources.filter(r => !groupIds.includes(r.groupId)));
    setResourceGroups(resourceGroups.filter(g => g.facilityId !== id));
    setFacilities(facilities.filter(f => f.id !== id));
  };

  // --- Group CRUD ---
  const handleAddGroup = (facilityId) => {
    const facGroups = resourceGroups.filter(g => g.facilityId === facilityId);
    setResourceGroups([...resourceGroups, {
      id: generateId('group'),
      facilityId,
      name: 'Neue Gruppe',
      icon: 'outdoor',
      sortOrder: facGroups.length + 1,
      sharedScheduling: false,
    }]);
  };

  const handleUpdateGroup = (updated) => {
    setResourceGroups(resourceGroups.map(g => g.id === updated.id ? updated : g));
  };

  const handleDeleteGroup = (groupId) => {
    const groupRes = resources.filter(r => r.groupId === groupId);
    if (groupRes.length > 0) {
      if (!window.confirm('Diese Gruppe enth' + UMLAUT_A + 'lt ' + groupRes.length + ' Ressource(n). Alle l' + UMLAUT_O + 'schen?')) return;
    }
    setResourceGroups(resourceGroups.filter(g => g.id !== groupId));
    setResources(resources.filter(r => r.groupId !== groupId));
  };

  // --- Resource CRUD ---
  const handleAddResource = (groupId) => {
    setResources([...resources, {
      id: generateId('res'),
      groupId,
      name: 'Neue Ressource',
      color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
      splittable: false,
      bookingMode: 'free',
      subResources: [],
    }]);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Anlagen- & Ressourcenverwaltung
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {facilities.length} Anlage{facilities.length !== 1 ? 'n' : ''}
            {' ' + String.fromCharCode(183) + ' '}
            {resourceGroups.length} Gruppe{resourceGroups.length !== 1 ? 'n' : ''}
            {' ' + String.fromCharCode(183) + ' '}
            {totalResources} Ressource{totalResources !== 1 ? 'n' : ''}
            {totalSubResources > 0 && (' ' + String.fromCharCode(183) + ' ' + totalSubResources + ' Unter-Res.')}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddingFacility(true)}>
          <Plus className="w-4 h-4 mr-1" /> Neue Anlage
        </Button>
      </div>

      {/* Add Facility Form */}
      {addingFacility && (
        <div className="mb-6">
          <FacilityEditor
            facility={{ name: '', street: '', houseNumber: '', zip: '', city: '' }}
            onSave={handleAddFacility}
            onCancel={() => setAddingFacility(false)}
            onDelete={() => {}}
            isNew={true}
          />
        </div>
      )}

      {/* Facility List */}
      {facilities.length === 0 && !addingFacility ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">Keine Anlagen vorhanden</p>
          <button onClick={() => setAddingFacility(true)} className="text-sm text-blue-600 hover:text-blue-800">
            Erste Anlage erstellen
          </button>
        </div>
      ) : (
        facilities.sort((a, b) => a.sortOrder - b.sortOrder).map(fac => (
          <FacilitySection key={fac.id} facility={fac}
            groups={resourceGroups} resources={resources}
            onUpdateFacility={handleUpdateFacility} onDeleteFacility={handleDeleteFacility}
            onUpdateGroup={handleUpdateGroup} onDeleteGroup={handleDeleteGroup} onAddGroup={handleAddGroup}
            onUpdateResource={handleUpdateResource} onDeleteResource={handleDeleteResource} onAddResource={handleAddResource}
          />
        ))
      )}
    </div>
  );
};

export default FacilityManagement;
