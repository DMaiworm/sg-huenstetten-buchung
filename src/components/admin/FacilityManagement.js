import React, { useState } from 'react';
import { Building2, MapPin, Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronRight, Layers, SplitSquareHorizontal, Clock, GripVertical, Settings } from 'lucide-react';
import { DAYS_FULL } from '../../config/constants';
import { Button } from '../ui/Badge';
import { Badge } from '../ui/Badge';
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

// ===================== Slot Panel (inline) =====================
const SlotPanel = ({ resourceId, resourceName, resourceColor, slots, setSlots }) => {
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

  const inputStyle = { width: '100%', padding: '4px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '6px' };
  const labelStyle = { display: 'block', fontSize: '10px', fontWeight: 600, color: '#6b7280', marginBottom: '2px' };

  return (
    <div style={{ backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', marginTop: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock style={{ width: '14px', height: '14px', color: '#d97706' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400e' }}>Zeitfenster (Slots)</span>
          <span style={{ fontSize: '11px', color: '#b45309' }}>{resourceSlots.length} Slot{resourceSlots.length !== 1 ? 's' : ''}</span>
        </div>
        <button type="button" onClick={() => setAdding(!adding)}
          style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>
          <Plus style={{ width: '12px', height: '12px' }} /> Neuer Slot
        </button>
      </div>

      {/* Existing slots */}
      {resourceSlots.length === 0 && !adding && (
        <div style={{ fontSize: '12px', color: '#b45309', fontStyle: 'italic' }}>Keine Slots angelegt. Ressource ist ohne Slots nicht buchbar.</div>
      )}
      {resourceSlots.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: adding ? '8px' : 0 }}>
          {resourceSlots.map(slot => (
            <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }}>
              <Badge variant="info" style={{ fontSize: '11px' }}>{DAYS_FULL[slot.dayOfWeek]}</Badge>
              <span style={{ fontWeight: 600 }}>{slot.startTime} - {slot.endTime}</span>
              <span style={{ color: '#9ca3af', fontSize: '11px' }}>
                {slot.validFrom && slot.validUntil ? (slot.validFrom + ' bis ' + slot.validUntil) : 'Unbegrenzt'}
              </span>
              <button type="button" onClick={() => handleDelete(slot.id)}
                style={{ marginLeft: 'auto', padding: '2px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                <X style={{ width: '12px', height: '12px' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} style={{ backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb', padding: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={labelStyle}>Wochentag</label>
              <select value={newSlot.dayOfWeek} onChange={e => setNewSlot({ ...newSlot, dayOfWeek: Number(e.target.value) })} style={inputStyle}>
                {DAYS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Startzeit</label>
              <input type="time" value={newSlot.startTime} onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Endzeit</label>
              <input type="time" value={newSlot.endTime} onChange={e => setNewSlot({ ...newSlot, endTime: e.target.value })} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>G{UMLAUT_U}ltig ab</label>
              <input type="date" value={newSlot.validFrom} onChange={e => setNewSlot({ ...newSlot, validFrom: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>G{UMLAUT_U}ltig bis</label>
              <input type="date" value={newSlot.validUntil} onChange={e => setNewSlot({ ...newSlot, validUntil: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="submit" style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Anlegen</button>
            <button type="button" onClick={() => setAdding(false)} style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Abbrechen</button>
          </div>
        </form>
      )}
    </div>
  );
};

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
const ResourceCard = ({ resource, onUpdate, onDelete, showSlots, slots, setSlots }) => {
  const [expanded, setExpanded] = useState(false);
  const [slotsOpen, setSlotsOpen] = useState(false);

  const slotCount = slots ? slots.filter(s => s.resourceId === resource.id).length : 0;

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
          {/* Slot gear icon - only show when group has sharedScheduling */}
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

      {/* Slot panel */}
      {showSlots && slotsOpen && slots && setSlots && (
        <div className="px-3 pb-3">
          <SlotPanel resourceId={resource.id} resourceName={resource.name} resourceColor={resource.color} slots={slots} setSlots={setSlots} />
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
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer" title="Slot-basierte Buchung f{UMLAUT_U}r alle Ressourcen dieser Gruppe">
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
const FacilitySection = ({ facility, groups, resources, onUpdateFacility, onDeleteFacility, onUpdateGroup, onDeleteGroup, onAddGroup, onUpdateResource, onDeleteResource, onAddResource, slots, setSlots }) => {
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
            <span>{String.fromCharCode(183)}</span>
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
              slots={slots} setSlots={setSlots} />
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
const FacilityManagement = ({ facilities, setFacilities, resourceGroups, setResourceGroups, resources, setResources, slots, setSlots }) => {
  const [addingFacility, setAddingFacility] = useState(false);

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
    // Also clean up any slots for this resource
    if (slots && setSlots) {
      setSlots(slots.filter(s => s.resourceId !== id));
    }
    setResources(resources.filter(r => r.id !== id));
  };

  const totalResources = resources.length;
  const totalSubResources = resources.reduce((sum, r) => sum + (r.subResources || []).length, 0);
  const totalSlots = slots ? slots.length : 0;

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
            {totalSlots > 0 && (' ' + String.fromCharCode(183) + ' ' + totalSlots + ' Slot' + (totalSlots !== 1 ? 's' : ''))}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddingFacility(true)}>
          <Plus className="w-4 h-4 mr-1" /> Neue Anlage
        </Button>
      </div>

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
            slots={slots} setSlots={setSlots}
          />
        ))
      )}
    </div>
  );
};

export default FacilityManagement;
