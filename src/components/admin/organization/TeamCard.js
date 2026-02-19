import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, UserCheck } from 'lucide-react';
import { COLOR_PRESETS } from '../../../config/constants';
import { EVENT_TYPES } from '../../../config/organizationConfig';
import DebouncedInput from '../../ui/DebouncedInput';
import TrainerAssignmentRow from './TrainerAssignmentRow';

const TeamCard = ({ team, users, trainerAssignments, onUpdateTeam, onDeleteTeam, onAddTrainer, onUpdateAssignment, onRemoveTrainer }) => {
  const [expanded, setExpanded] = useState(false);
  const teamAssignments = trainerAssignments.filter(ta => ta.teamId === team.id);
  const assignedUserIds = teamAssignments.map(ta => ta.userId);
  const availableTrainers = users.filter(u => u.istTrainer && !assignedUserIds.includes(u.id));

  return (
    <div className="border border-gray-200 rounded-lg bg-white mb-2 overflow-hidden">
      <div className="flex items-center gap-2 p-2.5">
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="w-4 h-4 rounded" style={{ backgroundColor: team.color }} />
        <DebouncedInput
          value={team.name}
          onChange={name => onUpdateTeam({ ...team, name })}
          className="flex-1 px-2 py-1 text-sm font-medium border border-transparent hover:border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
        />
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kürzel</label>
              <DebouncedInput
                value={team.shortName || ''}
                onChange={shortName => onUpdateTeam({ ...team, shortName })}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="z.B. Herren I"
              />
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
                    className={`px-2.5 py-1 text-xs rounded-full border transition-all flex items-center gap-1 ${
                      isActive ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}>
                    <span>{et.icon}</span> {et.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Übungsleiter / Trainer
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
            {availableTrainers.length > 0 && (
              <select onChange={e => { if (e.target.value) { onAddTrainer(team.id, e.target.value); e.target.value = ''; } }}
                defaultValue="" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 text-gray-500">
                <option value="">+ Trainer hinzufügen...</option>
                {availableTrainers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                    {u.kannAdministrieren ? ' (Admin)' : u.isPassive ? ' (passiv)' : u.invitedAt ? ' (eingeladen)' : ' (aktiv)'}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCard;
