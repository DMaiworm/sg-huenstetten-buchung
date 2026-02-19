import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, Plus } from 'lucide-react';
import TeamCard from './TeamCard';
import AddButton from '../../ui/AddButton';

const DepartmentSection = ({ department, teams, users, trainerAssignments,
  onUpdateDept, onDeleteDept, onAddTeam, onUpdateTeam, onDeleteTeam,
  onAddTrainer, onUpdateAssignment, onRemoveTrainer }) => {
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
            <input type="text" value={department.name}
              onChange={e => onUpdateDept({ ...department, name: e.target.value })}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              autoFocus className="flex-1 px-2 py-1 font-semibold text-sm border border-blue-300 rounded" />
            <input type="text" value={department.icon || ''}
              onChange={e => onUpdateDept({ ...department, icon: e.target.value })}
              onBlur={() => setEditingName(false)}
              className="w-12 px-2 py-1 text-sm border border-gray-200 rounded text-center" placeholder="Icon" />
          </div>
        ) : (
          <h4 className="font-semibold text-sm text-gray-800 flex-1 cursor-pointer" onClick={() => setEditingName(true)}>
            {department.name}
          </h4>
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
          <AddButton label="Neue Mannschaft / Gruppe" onClick={() => onAddTeam(department.id)} />
        </div>
      )}
    </div>
  );
};

export default DepartmentSection;
