import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit2, Save, X, Trash2, Plus } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import DepartmentSection from './DepartmentSection';
import AddButton from '../../ui/AddButton';

const ClubSection = ({ club, departments, teams, users, trainerAssignments,
  onUpdateClub, onDeleteClub, onAddDept, onUpdateDept, onDeleteDept,
  onAddTeam, onUpdateTeam, onDeleteTeam, onAddTrainer, onUpdateAssignment, onRemoveTrainer }) => {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...club });
  const clubDepts = departments.filter(d => d.clubId === club.id).sort((a, b) => a.sortOrder - b.sortOrder);
  const clubTeamCount = teams.filter(t => clubDepts.some(d => d.id === t.departmentId)).length;

  const handleSave = () => { onUpdateClub(form); setEditing(false); };

  return (
    <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: club.color }}>
            {club.shortName || club.name.substring(0, 3)}
          </div>
          {editing ? (
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="col-span-2 px-2 py-1.5 text-sm font-bold border border-blue-300 rounded" placeholder="Vereinsname" />
                <input type="text" value={form.shortName || ''} onChange={e => setForm({ ...form, shortName: e.target.value })}
                  className="px-2 py-1.5 text-sm border border-gray-200 rounded" placeholder="Kürzel" />
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                <label className="flex items-center gap-1.5 text-xs text-gray-500">
                  <input type="checkbox" checked={form.isHomeClub || false} onChange={e => setForm({ ...form, isHomeClub: e.target.checked })} className="w-3.5 h-3.5" />
                  Heimatverein
                </label>
                <div className="ml-auto flex gap-1">
                  <Button variant="primary" size="sm" onClick={handleSave}><Save className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { setForm({ ...club }); setEditing(false); }}><X className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">{club.name}</h3>
                {club.isHomeClub && <Badge variant="info">Heimatverein</Badge>}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {clubDepts.length} Abteilung{clubDepts.length !== 1 ? 'en' : ''} · {clubTeamCount} Mannschaft{clubTeamCount !== 1 ? 'en' : ''}
              </div>
            </div>
          )}
          {!editing && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}><Edit2 className="w-4 h-4" /></Button>
              {!club.isHomeClub && (
                <button onClick={() => onDeleteClub(club.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="bg-gray-50/50 p-4">
          {clubDepts.map(dept => (
            <DepartmentSection key={dept.id} department={dept}
              teams={teams} users={users} trainerAssignments={trainerAssignments}
              onUpdateDept={onUpdateDept} onDeleteDept={() => onDeleteDept(dept.id)}
              onAddTeam={onAddTeam} onUpdateTeam={onUpdateTeam} onDeleteTeam={onDeleteTeam}
              onAddTrainer={onAddTrainer} onUpdateAssignment={onUpdateAssignment} onRemoveTrainer={onRemoveTrainer} />
          ))}
          <AddButton label="Neue Abteilung" onClick={() => onAddDept(club.id)} size="md" />
        </div>
      )}
    </div>
  );
};

export default ClubSection;
