import React, { useState } from 'react';
import { X, UserPlus, Mail, Phone, Database, Shield } from 'lucide-react';
import { Badge } from '../ui/Badge';

const ROLES = [
  { id: 'admin',      label: 'Administrator', color: '#dc2626', description: 'Volle Rechte: Buchungen, Genehmigungen, Verwaltung' },
  { id: 'genehmiger', label: 'Genehmiger',    color: '#7c3aed', description: 'Buchungen erstellen + zugewiesene Ressourcen genehmigen' },
  { id: 'trainer',    label: 'Trainer',        color: '#2563eb', description: 'Eigene Buchungen erstellen und verwalten' },
  { id: 'extern',     label: 'Extern',         color: '#6b7280', description: 'Nur Anfragen stellen (müssen genehmigt werden)' },
];

const UserManagement = ({
  users, setUsers, createUser, updateUser, deleteUser, operators,
  // Genehmiger-Ressourcen
  resources, resourceGroups, facilities,
  genehmigerAssignments, addGenehmigerResource, removeGenehmigerResource,
}) => {
  const [showForm,     setShowForm]     = useState(false);
  const [editingUser,  setEditingUser]  = useState(null);
  const [filterRole,   setFilterRole]   = useState('all');
  const [saving,       setSaving]       = useState(false);
  const [expandedUser, setExpandedUser] = useState(null); // userId für Ressourcen-Zuweisung
  const [newUser, setNewUser] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: 'trainer', operatorId: '',
  });

  const filteredUsers = filterRole === 'all' ? users : users.filter(u => u.role === filterRole);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (editingUser) {
      if (updateUser) await updateUser(editingUser.id, newUser);
      else setUsers(users.map(u => u.id === editingUser.id ? { ...newUser, id: editingUser.id } : u));
      setEditingUser(null);
    } else {
      if (createUser) await createUser(newUser);
      else setUsers([...users, { ...newUser, id: Date.now() }]);
    }
    setSaving(false);
    setNewUser({ firstName: '', lastName: '', email: '', phone: '', role: 'trainer', operatorId: '' });
    setShowForm(false);
  };

  const handleEdit = (user) => {
    setNewUser({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone || '', role: user.role, operatorId: user.operatorId || '' });
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Benutzer wirklich löschen?')) {
      if (deleteUser) await deleteUser(id);
      else setUsers(users.filter(u => u.id !== id));
    }
  };

  const closeModal = () => {
    setShowForm(false); setEditingUser(null);
    setNewUser({ firstName: '', lastName: '', email: '', phone: '', role: 'trainer', operatorId: '' });
  };

  // Ressourcen-Zuweisung für Genehmiger
  const getAssignedResources = (userId) =>
    (genehmigerAssignments || []).filter(a => a.user_id === userId).map(a => a.resource_id);

  const handleToggleResource = async (userId, resourceId, isAssigned) => {
    if (isAssigned) await removeGenehmigerResource(userId, resourceId);
    else            await addGenehmigerResource(userId, resourceId);
  };

  // Ressourcen gruppiert nach Anlage → Bereich
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Benutzerverwaltung</h2>
            <p className="text-gray-500 mt-1">{users.length} Benutzer registriert</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingUser(null); setNewUser({ firstName: '', lastName: '', email: '', phone: '', role: 'trainer', operatorId: '' }); }}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors gap-2"
          >
            <UserPlus className="w-5 h-5" /><span>Neuer Benutzer</span>
          </button>
        </div>

        {/* Rollenfilter */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-lg">
            <button onClick={() => setFilterRole('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${filterRole === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
              Alle <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">{users.length}</span>
            </button>
            {ROLES.map(role => (
              <button key={role.id} onClick={() => setFilterRole(role.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${filterRole === role.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                {role.label}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                  {users.filter(u => u.role === role.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Benutzerliste */}
        <div className="space-y-3">
          {filteredUsers.map(user => {
            const role        = ROLES.find(r => r.id === user.role);
            const initials    = `${(user.firstName || '?')[0]}${(user.lastName || '?')[0]}`.toUpperCase();
            const isExpanded  = expandedUser === user.id;
            const assignedIds = getAssignedResources(user.id);

            return (
              <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
                      style={{ backgroundColor: role?.color }}>
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">{user.firstName} {user.lastName}</h3>
                        <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'genehmiger' ? 'info' : user.role === 'trainer' ? 'info' : 'default'}>
                          {role?.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-2"><Mail className="w-4 h-4" />{user.email}</p>
                      {user.phone && <p className="text-sm text-gray-600 flex items-center gap-2"><Phone className="w-4 h-4" />{user.phone}</p>}
                      {user.role === 'genehmiger' && (
                        <p className="text-xs text-violet-600 mt-1 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {assignedIds.length === 0 ? 'Keine Ressourcen zugewiesen' : `${assignedIds.length} Ressource${assignedIds.length !== 1 ? 'n' : ''} zugewiesen`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user.role === 'genehmiger' && addGenehmigerResource && (
                      <button onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors gap-1.5 ${
                          isExpanded ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700'
                        }`}>
                        <Shield className="w-4 h-4" />{isExpanded ? 'Schließen' : 'Ressourcen'}
                      </button>
                    )}
                    <button onClick={() => handleEdit(user)}
                      className="inline-flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors">
                      Bearbeiten
                    </button>
                    <button onClick={() => handleDelete(user.id)}
                      className="inline-flex items-center px-3 py-1.5 bg-gray-200 text-red-600 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors gap-1.5">
                      <X className="w-4 h-4" /> Löschen
                    </button>
                  </div>
                </div>

                {/* Ressourcen-Zuweisung für Genehmiger */}
                {isExpanded && user.role === 'genehmiger' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-violet-600" />
                      Ressourcen die {user.firstName} genehmigen darf:
                    </p>
                    <div className="space-y-4">
                      {resourceTree.map(fac => (
                        <div key={fac.id}>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{fac.name}</p>
                          {fac.groups.map(grp => (
                            <div key={grp.id} className="mb-2">
                              <p className="text-xs text-gray-400 mb-1 ml-2">{grp.name}</p>
                              <div className="flex flex-wrap gap-2 ml-2">
                                {grp.resources.map(res => {
                                  const assigned = assignedIds.includes(res.id);
                                  return (
                                    <button key={res.id}
                                      onClick={() => handleToggleResource(user.id, res.id, assigned)}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                                        assigned
                                          ? 'bg-violet-100 text-violet-700 border-violet-300'
                                          : 'bg-white text-gray-500 border-gray-200 hover:border-violet-300'
                                      }`}
                                    >
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: res.color }} />
                                      {res.name}
                                      {assigned && <span className="text-xs">✓</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Benutzer-Modal */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}
          onClick={closeModal}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxWidth: '42rem', width: '100%', maxHeight: '95vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>
                {editingUser ? 'Benutzer bearbeiten' : 'Neuen Benutzer anlegen'}
              </h3>
              <button onClick={closeModal} style={{ color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                <X style={{ width: '1.5rem', height: '1.5rem' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Vorname *</label>
                    <input type="text" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Nachname *</label>
                    <input type="text" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>E-Mail *</label>
                    <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Telefon</label>
                    <input type="tel" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                  </div>

                  {/* Rolle */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>Rolle *</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {ROLES.map(role => (
                        <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: newUser.role === role.id ? '#f0f9ff' : 'white' }}>
                          <input type="radio" name="role" value={role.id} checked={newUser.role === role.id} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} style={{ width: '1rem', height: '1rem' }} />
                          <span style={{ width: '0.625rem', height: '0.625rem', borderRadius: '50%', backgroundColor: role.color, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{role.label}</span>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>– {role.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {newUser.role === 'genehmiger' && (
                    <div style={{ gridColumn: 'span 2', padding: '0.75rem', backgroundColor: '#f5f3ff', borderRadius: '0.5rem', border: '1px solid #ddd6fe' }}>
                      <p className="text-sm text-violet-700 flex items-center gap-2">
                        <Shield style={{ width: '1rem', height: '1rem' }} />
                        Die Ressourcen-Zuweisung kannst du nach dem Anlegen in der Benutzerliste vornehmen.
                      </p>
                    </div>
                  )}

                  {newUser.role === 'admin' && operators && operators.length > 0 && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Betreiber-Zuordnung *</label>
                      <select value={newUser.operatorId} onChange={(e) => setNewUser({ ...newUser, operatorId: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }} required>
                        <option value="">Betreiber wählen...</option>
                        {operators.map(op => <option key={op.id} value={op.id}>{op.name} ({op.type})</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', padding: '1.25rem 1.5rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.625rem 1rem', backgroundColor: saving ? '#93c5fd' : '#3b82f6', color: 'white', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: saving ? 'wait' : 'pointer', fontSize: '0.875rem' }}>
                  {saving ? 'Speichern...' : editingUser ? 'Änderungen speichern' : 'Benutzer anlegen'}
                </button>
                <button type="button" onClick={closeModal}
                  style={{ padding: '0.625rem 1.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '1px solid #d1d5db', color: '#374151', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem' }}>
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagement;
