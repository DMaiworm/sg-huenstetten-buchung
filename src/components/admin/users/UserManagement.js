import React, { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import PageHeader from '../../ui/PageHeader';
import { useConfirm } from '../../../hooks/useConfirm';
import { trainerStatus, STATUS_CONFIG, emptyUser } from './userConstants';
import UserCard from './UserCard';
import UserFormModal from './UserFormModal';

const UserManagement = ({
  users, setUsers, createUser, updateUser, deleteUser, inviteUser,
  operators,
  resources, resourceGroups, facilities,
  genehmigerAssignments, addGenehmigerResource, removeGenehmigerResource,
  trainerAssignments, teams, departments, clubs,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filterTab, setFilterTab] = useState('trainer');
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [newUser, setNewUser] = useState(emptyUser);
  const [confirm, confirmDialog] = useConfirm();

  const trainerUsers = users.filter(u => u.istTrainer);
  const andereUsers = users.filter(u => !u.istTrainer);
  const displayUsers = filterTab === 'trainer' ? trainerUsers : andereUsers;

  const sortedDisplay = [...displayUsers].sort((a, b) =>
    (a.lastName || '').localeCompare(b.lastName || '', 'de') ||
    (a.firstName || '').localeCompare(b.firstName || '', 'de')
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (editingUser) {
      if (updateUser) await updateUser(editingUser.id, newUser);
    } else {
      if (createUser) await createUser(newUser);
    }
    setSaving(false);
    setNewUser(emptyUser); setEditingUser(null); setShowForm(false);
  };

  const handleEdit = (user) => { setNewUser({ ...user }); setEditingUser(user); setShowForm(true); };

  const handleDelete = async (id) => {
    const user = users.find(u => u.id === id);
    const name = user ? `${user.firstName} ${user.lastName}` : 'Benutzer';
    if (await confirm({ title: 'Benutzer löschen?', message: `"${name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`, confirmLabel: 'Löschen', variant: 'danger' })) {
      if (deleteUser) await deleteUser(id);
    }
  };

  const handleInvite = async (user) => {
    if (!await confirm({ title: 'Einladung senden?', message: `Einladungs-E-Mail an ${user.email} senden?`, confirmLabel: 'Einladung senden', variant: 'info' })) return;
    setInviting(user.id);
    const { error } = await inviteUser(user.id);
    setInviting(null);
    if (error) {
      await confirm({ title: 'Fehler', message: `Fehler beim Einladen: ${error}`, confirmLabel: 'OK', variant: 'danger' });
    } else {
      await confirm({ title: 'Einladung gesendet', message: `Einladung an ${user.email} wurde erfolgreich versendet.`, confirmLabel: 'OK', variant: 'info' });
    }
  };

  const closeModal = () => { setShowForm(false); setEditingUser(null); setNewUser(emptyUser); };

  const getAssignedResources = (userId) =>
    (genehmigerAssignments || []).filter(a => a.user_id === userId).map(a => a.resource_id);

  const handleToggleResource = async (userId, resourceId, isAssigned) => {
    if (isAssigned) await removeGenehmigerResource(userId, resourceId);
    else await addGenehmigerResource(userId, resourceId);
  };

  const resourceTree = (facilities || []).map(fac => ({
    ...fac,
    groups: (resourceGroups || []).filter(g => g.facilityId === fac.id).map(grp => ({
      ...grp,
      resources: (resources || []).filter(r => r.groupId === grp.id),
    })),
  }));

  return (
    <>
      <div>
        <PageHeader
          icon={Users}
          title="Benutzerverwaltung"
          subtitle={`${trainerUsers.filter(u => trainerStatus(u) === 'aktiv').length} aktiv · ${trainerUsers.filter(u => trainerStatus(u) === 'eingeladen').length} eingeladen · ${trainerUsers.filter(u => trainerStatus(u) === 'passiv').length} passiv`}
          actions={
            <button onClick={() => { setShowForm(true); setEditingUser(null); setNewUser(emptyUser); }}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors gap-2">
              <UserPlus className="w-5 h-5" /><span>Neuer Benutzer</span>
            </button>
          }
        />

        {/* Tabs */}
        <div className="flex gap-2 mb-4 bg-gray-100 p-1.5 rounded-lg w-fit">
          {[{ key: 'trainer', label: 'Trainer / Übungsleiter', count: trainerUsers.length },
            { key: 'andere', label: 'Andere Benutzer', count: andereUsers.length }].map(tab => (
            <button key={tab.key} onClick={() => setFilterTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                filterTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}>
              {tab.label} <span className="ml-1 text-xs font-bold text-gray-400">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Trainer-Status-Legende */}
        {filterTab === 'trainer' && (
          <div className="flex gap-3 mb-4 flex-wrap">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const count = trainerUsers.filter(u => trainerStatus(u) === key).length;
              return (
                <div key={key} className="flex items-center gap-1.5 text-sm" style={{ color: cfg.color }}>
                  <Icon style={{ width: '14px', height: '14px' }} />
                  <span className="font-medium">{cfg.label}</span>
                  <span className="text-gray-400">({count})</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Benutzerliste */}
        <div className="space-y-3">
          {sortedDisplay.map(user => (
            <UserCard key={user.id} user={user}
              isExpanded={expandedUser === user.id}
              inviting={inviting}
              resourceTree={resourceTree}
              assignedIds={getAssignedResources(user.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onInvite={inviteUser ? handleInvite : null}
              onToggleExpand={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
              onToggleResource={handleToggleResource}
              showResourceButton={user.kannGenehmigen && !user.isPassive && !!addGenehmigerResource}
              trainerAssignments={trainerAssignments}
              teams={teams} departments={departments} clubs={clubs}
            />
          ))}

          {sortedDisplay.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>Keine Einträge in dieser Kategorie</p>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <UserFormModal
          newUser={newUser} setNewUser={setNewUser}
          editingUser={editingUser} saving={saving}
          onSubmit={handleSubmit} onClose={closeModal}
          clubs={clubs || []}
        />
      )}

      {confirmDialog}
    </>
  );
};

export default UserManagement;
