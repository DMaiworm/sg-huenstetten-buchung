import React from 'react';
import { Mail, Phone, Shield, Send, X } from 'lucide-react';
import { trainerStatus } from './userConstants';
import PermBadges from './PermBadges';
import StatusBadge from './StatusBadge';
import ResourceAssignment from './ResourceAssignment';

const UserCard = ({ user, isExpanded, inviting, resourceTree, assignedIds,
  onEdit, onDelete, onInvite, onToggleExpand, onToggleResource, showResourceButton }) => {
  const status = trainerStatus(user);
  const initials = `${(user.firstName || '?')[0]}${(user.lastName || '?')[0]}`.toUpperCase();
  const avatarColor = user.kannAdministrieren ? '#dc2626'
    : user.kannGenehmigen ? '#7c3aed'
    : user.kannBuchen ? '#2563eb'
    : status === 'eingeladen' ? '#d97706'
    : '#9ca3af';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
            style={{ backgroundColor: avatarColor }}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-800">{user.firstName} {user.lastName}</h3>
              {status && <StatusBadge user={user} />}
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Mail className="w-3 h-3" />{user.email}
            </p>
            {user.phone && <p className="text-sm text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</p>}
            <PermBadges user={user} />
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
          {showResourceButton && (
            <button onClick={onToggleExpand}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors gap-1.5 ${
                isExpanded ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700'
              }`}>
              <Shield className="w-4 h-4" />{isExpanded ? 'Schließen' : 'Ressourcen'}
            </button>
          )}

          {status === 'passiv' && onInvite && (
            <button onClick={() => onInvite(user)} disabled={inviting === user.id}
              className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors gap-1.5 disabled:opacity-50">
              <Send className="w-4 h-4" />{inviting === user.id ? 'Sende...' : 'Einladen'}
            </button>
          )}

          {status === 'eingeladen' && onInvite && (
            <button onClick={() => onInvite(user)} disabled={inviting === user.id}
              className="inline-flex items-center px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium hover:bg-amber-200 transition-colors gap-1.5 disabled:opacity-50">
              <Send className="w-4 h-4" />{inviting === user.id ? 'Sende...' : 'Erneut einladen'}
            </button>
          )}

          <button onClick={() => onEdit(user)}
            className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
            Bearbeiten
          </button>
          <button onClick={() => onDelete(user.id)}
            className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-red-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && user.kannGenehmigen && (
        <ResourceAssignment user={user} resourceTree={resourceTree} assignedIds={assignedIds} onToggleResource={onToggleResource} />
      )}
    </div>
  );
};

export default UserCard;
