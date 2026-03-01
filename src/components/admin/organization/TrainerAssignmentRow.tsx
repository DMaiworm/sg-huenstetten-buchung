import React from 'react';
import { Star, X } from 'lucide-react';
import type { User, TrainerAssignment } from '../../../types';

interface TrainerAssignmentRowProps {
  assignment: TrainerAssignment;
  users: User[];
  onUpdate: (updated: TrainerAssignment) => void;
  onRemove: () => void;
}

const TrainerAssignmentRow: React.FC<TrainerAssignmentRowProps> = ({ assignment, users, onUpdate, onRemove }) => {
  const user = users.find(u => u.id === assignment.userId);
  if (!user) return null;

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 bg-gray-50 rounded border border-gray-100 text-sm">
      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
        {user.firstName[0]}{user.lastName[0]}
      </div>
      <span className="flex-1 font-medium text-gray-700">{user.firstName} {user.lastName}</span>
      {assignment.isPrimary ? (
        <button onClick={() => onUpdate({ ...assignment, isPrimary: false })} className="text-xs text-yellow-600 flex items-center gap-0.5">
          <Star className="w-3 h-3 fill-yellow-500" /> Haupt
        </button>
      ) : (
        <button onClick={() => onUpdate({ ...assignment, isPrimary: true })} className="text-xs text-gray-400 flex items-center gap-0.5">
          <Star className="w-3 h-3" /> Co
        </button>
      )}
      <button onClick={onRemove} className="p-0.5 text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
};

export default TrainerAssignmentRow;
