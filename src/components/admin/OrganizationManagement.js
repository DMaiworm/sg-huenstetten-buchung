import React, { useState } from 'react';
import { Building, UserCheck, Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronRight, Star } from 'lucide-react';
import { Button, Badge } from '../ui/Badge';
import { generateOrgId, EVENT_TYPES } from '../../config/organizationConfig';

const UMLAUT_O = String.fromCharCode(246);
const UMLAUT_U = String.fromCharCode(252);

const COLOR_PRESETS = [
  '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
  '#dc2626', '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#16a34a', '#0891b2', '#8b5cf6', '#a855f7', '#e11d48',
];

// ===================== Trainer Assignment =====================
const TrainerAssignmentRow = ({ assignment, users, onUpdate, onRemove }) => {
  const user = users.find(u => u.id === assignment.userId);
  if (!user) return null;
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 bg-gray-50 rounded border border-gray-100 text-sm">
      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
        {user.firstName[0]}{user.lastName[0]}
      </div>
      <span className="flex-1 font-medium text-gray-700">{user.firstName} {user.lastName}</span>
      {assignment.isPrimary ? (
        <button onClick={() => onUpdate({ ...assignment, isPrimary: false })} className="text-xs text-yellow-600 flex items-center gap-0.5" title="Haupttrainer">
          <Star className="w-3 h-3 fill-yellow-500" /> Haupt
        </button>
      ) : (
        <button onClick={() => onUpdate({ ...assignment, isPrimary: true })} className="text-xs text-gray-400 flex items-center gap-0.5" title="Zum Haupttrainer machen">
          <Star className="w-3 h-3" /> Co
        </button>
      )}
      <button onClick={onRemove} className="p-0.5 text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
};

// ===================== Team Card =====================
const TeamCard = ({ team, users, trainerAssignments, onUpdateTeam, onDeleteTeam, onAddTrainer, onUpdateAssignment, onRemoveTrainer }) => {
  const [expanded, setExpanded] = useState(false);
  const teamAssignments = trainerAssignments.filter(ta => ta.teamId === team.id);
  const assignedUserIds = teamAssignments.map(ta => ta.userId);

  // Alle Trainer (ist_trainer=true) die noch nicht zugewiesen sind
  const availableTrainers = users.filter(u => u.istTrainer && !assignedUserIds.includes(u.id));

  return (
    <div className="border border-gray-200 rounded-lg bg-white mb-2 overflow-hidden">
      <div className="flex items-center gap-2 p-2.5">
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="w-4 h-4 rounded" style={{ backgroundColor: team.color }} />
        <input type="text" value={team.name} onChange={e => onUpdateTeam({ ...team, name: e.target.value })}
          className="flex-1 px-2 py-1 text-sm font-medium border border-transparent hover:border-gray-200 rounded focus:ring-1 focus:ring-blue-500" />
        <div className="flex items-center gap-1.5">
          {teamAssignments.length > 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-0.5">
              <UserCheck className="w-3 h-3" />{teamAssignments.length}
            </span>
          )}
          <div className="flex gap-0.5">
            {(team.eventTypes || []).map(et => {
              const eventType = EVENT_TYPES.find(e => e.id === et);
              return eventType ? <span key={et} className="text-xs" title={eventType.label}>{eventType.icon}</span> : null;
            })}
          </div>
        </div>
        <input type="color" value={team.color} onChange={e => onUpdateTeam({ ...team, color: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-0" />
        <button onClick={onDeleteTeam} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-3 bg-gray-50/50 space-y-3">
          {/* Short name + color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">K{UMLAUT_U}rzel</label>
              <input type="text" value={team.shortName || ''} onChange={e => onUpdateTeam({ ...team, shortName: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500" placeholder="z.B. Herren I" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Farbe</label>
              <div className="flex gap-1 flex-wrap">
                {COLOR_PRESETS.map(c => (
                  <button key={c} onClick={() => onUpdateTeam({ ...team, color: c })}
                    className={`w-5 h-5 rounded-sm border-2 ${team.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>

          {/* Event Types */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Terminarten</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(et => {
                const isActive = (team.eventTypes || []).includes(et.id);
                return (
                  <button key={et.id} onClick={() => {
                    const types = team.eventTypes || [];
                    onUpdateTeam({ ...team, eventTypes: isActive ? types.filter(t => t !== et.id) : [...types, et.id] });
                  }}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-all flex items-center gap-1 ${isActive ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                    <span>{et.icon}</span> {et.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trainer Assignments */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> {UMLAUT_U + 'bungsleiter / Trainer'}
            </label>
            <div className="space-y-1 mb-2">
              {teamAssignments.length === 0 && (
                <p className="text-xs text-gray-400 italic py-1">Noch kein Trainer zugewiesen</p>
              )}
              {teamAssignments.map(ta => (
                <TrainerAssignmentRow key={ta.id} assignment={ta} users={users}
                  onUpdate={onUpdateAssignment} onRemove={() => onRemoveTrainer(ta.id)} />
              ))}
            </div>
            {availableTrainers.length > 0 ? (
              <select onChange={e => { if (e.target.value) { onAddTrainer(team.id, e.target.value); e.target.value = ''; } }}
                defaultValue="" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 text-gray-500">
                <option value="">+ Trainer hinzuf{UMLAUT_U}gen...</option>
                {availableTrainers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                    {u.kannAdministrieren ? ' (Admin)' : u.isPassive ? ' (passiv)' : u.invitedAt ? ' (eingeladen)' : ' (aktiv)'}
                  </option>
                ))}
              </select>
            ) : (
              availableTrainers.length === 0 && users.filter(u => u.istTrainer).length === 0 && (
                <p className="text-xs text-gray-400 italic">Keine Trainer im System vorhanden</p>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ===================== Department Section =====================
const DepartmentSection = ({ department, teams, users, trainerAssignments, onUpdateDept, onDeleteDept, onAddTeam, onUpdateTeam, onDeleteTeam, onAddTrainer, onUpdateAssignment, onRemoveTrainer }) => {
  const [expanded, setExpanded] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const deptTeams = teams.filter(t => t.departmentId === department.id).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <span className="text-base">{department.icon || ''}</span>
        {editingName ? (
          <div className="flex-1 flex items-center gap-2">
            <input type="text" value={department.name} onChange={e => onUpdateDept({ ...department, name: e.target.value })}
              onBlur={() => setEditingName(false)} onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              autoFocus className="flex-1 px-2 py-1 font-semibold text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500" />
            <input type="text" value={department.icon || ''} onChange={e => onUpdateDept({ ...department, icon: e.target.value })}
              className="w-12 px-2 py-1 text-sm border border-gray-200 rounded text-center" placeholder="Icon" />
          </div>
        ) : (
          <h4 className="font-semibold text-sm text-gray-800 flex-1 cursor-pointer" onClick={() => setEditingName(true)}>{department.name}</h4>
        )}
        <span className="text-xs text-gray-400">{deptTeams.length} Mannschaft{deptTeams.length !== 1 ? 'en' : ''}</span>
        <button onClick={onDeleteDept} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      {expanded && (
        <div className="ml-4">
          {deptTeams.map(team => (
            <TeamCard key={team.id} team={team} users={users} trainerAssignments={trainerAssignments}
              onUpdateTeam={onUpdateTeam} onDeleteTeam={() => onDeleteTeam(team.id)}
              onAddTrainer={onAddTrainer} onUpdateAssignment={onUpdateAssignment} onRemoveTrainer={onRemoveTrainer} />
          ))}
          <button onClick={() => onAddTeam(department.id)}
            className="w-full py-1.5 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center gap-1 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Neue Mannschaft / Gruppe
          </button>
        </div>
      )}
    </div>
  );
};

// ===================== Club Section =====================
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
      {/* Club Header */}
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
                  className="col-span-2 px-2 py-1.5 text-sm font-bold border border-blue-300 rounded focus:ring-1 focus:ring-blue-500" placeholder="Vereinsname" />
                <input type="text" value={form.shortName || ''} onChange={e => setForm({ ...form, shortName: e.target.value })}
                  className="px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500" placeholder={'K' + UMLAUT_U + 'rzel'} />
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                <label className="flex items-center gap-1.5 text-xs text-gray-500">
                  <input type="checkbox" checked={form.isHomeClub || false} onChange={e => setForm({ ...form, isHomeClub: e.target.checked })} className="w-3.5 h-3.5 text-blue-600 rounded" />
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
                {clubDepts.length} Abteilung{clubDepts.length !== 1 ? 'en' : ''} {String.fromCharCode(183)} {clubTeamCount} Mannschaft{clubTeamCount !== 1 ? 'en' : ''}
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

      {/* Departments & Teams */}
      {expanded && (
        <div className="bg-gray-50/50 p-4">
          {clubDepts.map(dept => (
            <DepartmentSection key={dept.id} department={dept}
              teams={teams} users={users} trainerAssignments={trainerAssignments}
              onUpdateDept={onUpdateDept} onDeleteDept={() => onDeleteDept(dept.id)}
              onAddTeam={onAddTeam} onUpdateTeam={onUpdateTeam} onDeleteTeam={onDeleteTeam}
              onAddTrainer={onAddTrainer} onUpdateAssignment={onUpdateAssignment} onRemoveTrainer={onRemoveTrainer} />
          ))}
          <button onClick={() => onAddDept(club.id)}
            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center gap-1 transition-colors mt-2">
            <Plus className="w-4 h-4" /> Neue Abteilung
          </button>
        </div>
      )}
    </div>
  );
};

// ===================== Main Component =====================
const OrganizationManagement = ({ clubs, setClubs, departments, setDepartments, teams, setTeams, trainerAssignments, setTrainerAssignments, users }) => {
  const [addingClub, setAddingClub] = useState(false);
  const [newClubForm, setNewClubForm] = useState({ name: '', shortName: '', color: '#6b7280', isHomeClub: false });

  const handleAddClub = () => {
    setClubs([...clubs, { ...newClubForm, id: generateOrgId('club') }]);
    setNewClubForm({ name: '', shortName: '', color: '#6b7280', isHomeClub: false });
    setAddingClub(false);
  };

  const handleUpdateClub = (updated) => setClubs(clubs.map(c => c.id === updated.id ? updated : c));

  const handleDeleteClub = (id) => {
    const clubDepts = departments.filter(d => d.clubId === id);
    const deptIds = clubDepts.map(d => d.id);
    const clubTeams = teams.filter(t => deptIds.includes(t.departmentId));
    const teamIds = clubTeams.map(t => t.id);
    if (clubDepts.length > 0) {
      if (!window.confirm('Verein mit ' + clubDepts.length + ' Abteilung(en) und ' + clubTeams.length + ' Mannschaft(en) l' + UMLAUT_O + 'schen?')) return;
    }
    setTrainerAssignments(trainerAssignments.filter(ta => !teamIds.includes(ta.teamId)));
    setTeams(teams.filter(t => !deptIds.includes(t.departmentId)));
    setDepartments(departments.filter(d => d.clubId !== id));
    setClubs(clubs.filter(c => c.id !== id));
  };

  const handleAddDept = (clubId) => {
    const clubDepts = departments.filter(d => d.clubId === clubId);
    setDepartments([...departments, {
      id: generateOrgId('dept'), clubId, name: 'Neue Abteilung', icon: String.fromCharCode(9917), sortOrder: clubDepts.length + 1,
    }]);
  };

  const handleUpdateDept = (updated) => setDepartments(departments.map(d => d.id === updated.id ? updated : d));

  const handleDeleteDept = (id) => {
    const deptTeams = teams.filter(t => t.departmentId === id);
    const teamIds = deptTeams.map(t => t.id);
    if (deptTeams.length > 0) {
      if (!window.confirm('Abteilung mit ' + deptTeams.length + ' Mannschaft(en) l' + UMLAUT_O + 'schen?')) return;
    }
    setTrainerAssignments(trainerAssignments.filter(ta => !teamIds.includes(ta.teamId)));
    setTeams(teams.filter(t => t.departmentId !== id));
    setDepartments(departments.filter(d => d.id !== id));
  };

  const handleAddTeam = (departmentId) => {
    const deptTeams = teams.filter(t => t.departmentId === departmentId);
    setTeams([...teams, {
      id: generateOrgId('team'), departmentId, name: 'Neue Mannschaft', shortName: '', color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
      sortOrder: deptTeams.length + 1, eventTypes: ['training'],
    }]);
  };

  const handleUpdateTeam = (updated) => setTeams(teams.map(t => t.id === updated.id ? updated : t));

  const handleDeleteTeam = (id) => {
    setTrainerAssignments(trainerAssignments.filter(ta => ta.teamId !== id));
    setTeams(teams.filter(t => t.id !== id));
  };

  const handleAddTrainer = (teamId, userId) => {
    setTrainerAssignments([...trainerAssignments, {
      id: generateOrgId('ta'), userId, teamId,
      isPrimary: trainerAssignments.filter(ta => ta.teamId === teamId).length === 0,
    }]);
  };

  const handleUpdateAssignment = (updated) => setTrainerAssignments(trainerAssignments.map(ta => ta.id === updated.id ? updated : ta));
  const handleRemoveTrainer = (id) => setTrainerAssignments(trainerAssignments.filter(ta => ta.id !== id));

  const totalTeams = teams.length;
  const totalAssignments = trainerAssignments.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-600" />
            Organisationsverwaltung
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {clubs.length} Verein{clubs.length !== 1 ? 'e' : ''}
            {' ' + String.fromCharCode(183) + ' '}
            {departments.length} Abteilung{departments.length !== 1 ? 'en' : ''}
            {' ' + String.fromCharCode(183) + ' '}
            {totalTeams} Mannschaft{totalTeams !== 1 ? 'en' : ''}
            {' ' + String.fromCharCode(183) + ' '}
            {totalAssignments} Trainer-Zuordnung{totalAssignments !== 1 ? 'en' : ''}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddingClub(true)}>
          <Plus className="w-4 h-4 mr-1" /> Neuer Verein
        </Button>
      </div>

      {addingClub && (
        <div className="mb-6 border-2 border-blue-300 rounded-lg p-4 bg-blue-50/30">
          <h4 className="font-bold text-gray-900 mb-3">Neuen Verein anlegen</h4>
          <div className="grid grid-cols-3 gap-3">
            <input type="text" value={newClubForm.name} onChange={e => setNewClubForm({ ...newClubForm, name: e.target.value })}
              className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Vereinsname" />
            <input type="text" value={newClubForm.shortName} onChange={e => setNewClubForm({ ...newClubForm, shortName: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder={'K' + UMLAUT_U + 'rzel'} />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <input type="color" value={newClubForm.color} onChange={e => setNewClubForm({ ...newClubForm, color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
            <Button variant="primary" size="sm" onClick={handleAddClub} disabled={!newClubForm.name}>
              <Save className="w-4 h-4 mr-1" />Anlegen
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAddingClub(false)}><X className="w-4 h-4 mr-1" />Abbrechen</Button>
          </div>
        </div>
      )}

      {clubs.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Building className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">Keine Vereine vorhanden</p>
          <button onClick={() => setAddingClub(true)} className="text-sm text-blue-600 hover:text-blue-800">Ersten Verein erstellen</button>
        </div>
      ) : (
        clubs.map(club => (
          <ClubSection key={club.id} club={club}
            departments={departments} teams={teams} users={users} trainerAssignments={trainerAssignments}
            onUpdateClub={handleUpdateClub} onDeleteClub={handleDeleteClub}
            onAddDept={handleAddDept} onUpdateDept={handleUpdateDept} onDeleteDept={handleDeleteDept}
            onAddTeam={handleAddTeam} onUpdateTeam={handleUpdateTeam} onDeleteTeam={handleDeleteTeam}
            onAddTrainer={handleAddTrainer} onUpdateAssignment={handleUpdateAssignment} onRemoveTrainer={handleRemoveTrainer} />
        ))
      )}
    </div>
  );
};

export default OrganizationManagement;
