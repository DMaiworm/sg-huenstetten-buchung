import React, { useState } from 'react';
import { X, UserPlus, Mail, Phone, Shield } from 'lucide-react';

/**
 * UserManagement – Benutzerverwaltung mit Permission-Flags.
 *
 * Jede Person hat vier unabhängige Checkboxen:
 *   ist_trainer, kann_buchen, kann_genehmigen, kann_administrieren
 *
 * Passive Trainer (is_passive=true) werden separat angezeigt
 * und können nur aktiviert, nicht bearbeitet werden.
 */

const PERMISSIONS = [
  { key: 'istTrainer',         label: 'Trainer',       description: 'Erscheint als Trainer bei Mannschaften',         color: '#2563eb' },
  { key: 'kannBuchen',         label: 'Buchen',        description: 'Darf Buchungsanfragen stellen',                  color: '#16a34a' },
  { key: 'kannGenehmigen',     label: 'Genehmigen',    description: 'Darf Anfragen genehmigen (eigene: auto-approved)', color: '#7c3aed' },
  { key: 'kannAdministrieren', label: 'Administrieren',description: 'Zugang zu Benutzerverwaltung & Anlagen',         color: '#dc2626' },
];

const emptyUser = { firstName: '', lastName: '', email: '', phone: '', operatorId: '',
  isPassive: false, istTrainer: false, kannBuchen: false, kannGenehmigen: false, kannAdministrieren: false };

const UserManagement = ({
  users, setUsers, createUser, updateUser, deleteUser,
  operators,
  resources, resourceGroups, facilities,
  genehmigerAssignments, addGenehmigerResource, removeGenehmigerResource,
}) => {
  const [showForm,     setShowForm]     = useState(false);
  const [editingUser,  setEditingUser]  = useState(null);
  const [filterTab,    setFilterTab]    = useState('aktiv');  // 'aktiv' | 'passiv'
  const [saving,       setSaving]       = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  const [newUser,      setNewUser]      = useState(emptyUser);

  const activeUsers  = users.filter(u => !u.isPassive);
  const passiveUsers = users.filter(u =>  u.isPassive);
  const displayUsers = filterTab === 'aktiv' ? activeUsers : passiveUsers;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (editingUser) {
      if (updateUser) await updateUser(editingUser.id, newUser);
    } else {
      if (createUser) await createUser(newUser);
    }
    setSaving(false);
    setNewUser(emptyUser);
    setEditingUser(null);
    setShowForm(false);
  };

  const handleEdit = (user) => {
    setNewUser({ ...user });
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Benutzer wirklich löschen?')) {
      if (deleteUser) await deleteUser(id);
    }
  };

  // Passiven Trainer aktivieren: is_passive=false + kann_buchen=true
  const handleActivate = async (user) => {
    if (updateUser) {
      await updateUser(user.id, { ...user, isPassive: false, kannBuchen: true });
    }
  };

  const closeModal = () => { setShowForm(false); setEditingUser(null); setNewUser(emptyUser); };

  const getAssignedResources = (userId) =>
    (genehmigerAssignments || []).filter(a => a.user_id === userId).map(a => a.resource_id);

  const handleToggleResource = async (userId, resourceId, isAssigned) => {
    if (isAssigned) await removeGenehmigerResource(userId, resourceId);
    else            await addGenehmigerResource(userId, resourceId);
  };

  const resourceTree = (facilities || []).map(fac => ({
    ...fac,
    groups: (resourceGroups || []).filter(g => g.facilityId === fac.id).map(grp => ({
      ...grp,
      resources: (resources || []).filter(r => r.groupId === grp.id),
    })),
  }));

  // Permission-Badges für einen User
  const PermBadges = ({ user }) => (
    <div className="flex flex-wrap gap-1 mt-1">
      {user.isPassive
        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">Passiv (kein Login)</span>
        : PERMISSIONS.filter(p => user[p.key]).map(p => (
          <span key={p.key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: p.color + '18', color: p.color }}>
            {p.label}
          </span>
        ))
      }
      {!user.isPassive && !PERMISSIONS.some(p => user[p.key]) && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Kein Zugriff</span>
      )}
    </div>
  );

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Benutzerverwaltung</h2>
            <p className="text-gray-500 mt-1">{activeUsers.length} aktive · {passiveUsers.length} passive Trainer</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditingUser(null); setNewUser(emptyUser); }}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors gap-2">
            <UserPlus className="w-5 h-5" /><span>Neuer Benutzer</span>
          </button>
        </div>

        {/* Tab: Aktiv / Passiv */}
        <div className="flex gap-2 mb-4 bg-gray-100 p-1.5 rounded-lg w-fit">
          <button onClick={() => setFilterTab('aktiv')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              filterTab === 'aktiv' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
            }`}>
            Aktive Benutzer <span className="ml-1 text-xs font-bold text-gray-500">{activeUsers.length}</span>
          </button>
          <button onClick={() => setFilterTab('passiv')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              filterTab === 'passiv' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
            }`}>
            Passive Trainer <span className="ml-1 text-xs font-bold text-gray-500">{passiveUsers.length}</span>
          </button>
        </div>

        {/* Benutzerliste */}
        <div className="space-y-3">
          {displayUsers.map(user => {
            const initials   = `${(user.firstName||'?')[0]}${(user.lastName||'?')[0]}`.toUpperCase();
            const isExpanded = expandedUser === user.id;
            const assignedIds = getAssignedResources(user.id);
            const avatarColor = user.kannAdministrieren ? '#dc2626' : user.kannGenehmigen ? '#7c3aed' : user.kannBuchen ? '#2563eb' : '#6b7280';

            return (
              <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
                      style={{ backgroundColor: user.isPassive ? '#9ca3af' : avatarColor }}>
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{user.firstName} {user.lastName}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.phone && <p className="text-sm text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</p>}
                      <PermBadges user={user} />
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {/* Ressourcen-Zuweisung nur für Genehmiger */}
                    {user.kannGenehmigen && !user.isPassive && addGenehmigerResource && (
                      <button onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors gap-1.5 ${
                          isExpanded ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700'
                        }`}>
                        <Shield className="w-4 h-4" />{isExpanded ? 'Schließen' : 'Ressourcen'}
                      </button>
                    )}
                    {/* Passiven Trainer aktivieren */}
                    {user.isPassive && (
                      <button onClick={() => handleActivate(user)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
                        Aktivieren
                      </button>
                    )}
                    <button onClick={() => handleEdit(user)}
                      className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                      Bearbeiten
                    </button>
                    <button onClick={() => handleDelete(user.id)}
                      className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-red-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors gap-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Ressourcen-Zuweisung für Genehmiger */}
                {isExpanded && user.kannGenehmigen && (
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
                                        assigned ? 'bg-violet-100 text-violet-700 border-violet-300' : 'bg-white text-gray-500 border-gray-200 hover:border-violet-300'
                                      }`}>
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: res.color }} />
                                      {res.name}{assigned && <span className="text-xs">✓</span>}
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

      {/* Modal */}
      {showForm && (
        <div style={{ position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:'1rem' }}
          onClick={closeModal}>
          <div style={{ backgroundColor:'white',borderRadius:'0.5rem',boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)',maxWidth:'42rem',width:'100%',maxHeight:'95vh',overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1.25rem 1.5rem',borderBottom:'1px solid #e5e7eb' }}>
              <h3 style={{ fontSize:'1.25rem',fontWeight:600,color:'#1f2937' }}>
                {editingUser ? 'Benutzer bearbeiten' : 'Neuen Benutzer anlegen'}
              </h3>
              <button onClick={closeModal} style={{ color:'#9ca3af',cursor:'pointer',background:'none',border:'none' }}>
                <X style={{ width:'1.5rem',height:'1.5rem' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding:'1.25rem 1.5rem',display:'flex',flexDirection:'column',gap:'0.875rem' }}>

                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.875rem' }}>
                  <div>
                    <label style={{ display:'block',fontSize:'0.875rem',fontWeight:500,color:'#374151',marginBottom:'0.25rem' }}>Vorname *</label>
                    <input type="text" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})}
                      style={{ width:'100%',padding:'0.5rem 0.75rem',border:'1px solid #d1d5db',borderRadius:'0.5rem',fontSize:'0.875rem' }} required />
                  </div>
                  <div>
                    <label style={{ display:'block',fontSize:'0.875rem',fontWeight:500,color:'#374151',marginBottom:'0.25rem' }}>Nachname *</label>
                    <input type="text" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})}
                      style={{ width:'100%',padding:'0.5rem 0.75rem',border:'1px solid #d1d5db',borderRadius:'0.5rem',fontSize:'0.875rem' }} required />
                  </div>
                  <div>
                    <label style={{ display:'block',fontSize:'0.875rem',fontWeight:500,color:'#374151',marginBottom:'0.25rem' }}>E-Mail *</label>
                    <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                      style={{ width:'100%',padding:'0.5rem 0.75rem',border:'1px solid #d1d5db',borderRadius:'0.5rem',fontSize:'0.875rem' }} required />
                  </div>
                  <div>
                    <label style={{ display:'block',fontSize:'0.875rem',fontWeight:500,color:'#374151',marginBottom:'0.25rem' }}>Telefon</label>
                    <input type="tel" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})}
                      style={{ width:'100%',padding:'0.5rem 0.75rem',border:'1px solid #d1d5db',borderRadius:'0.5rem',fontSize:'0.875rem' }} />
                  </div>
                </div>

                {/* Permission-Checkboxen */}
                <div>
                  <label style={{ display:'block',fontSize:'0.875rem',fontWeight:600,color:'#374151',marginBottom:'0.5rem' }}>Berechtigungen</label>
                  <div style={{ display:'flex',flexDirection:'column',gap:'0.5rem' }}>
                    {PERMISSIONS.map(p => (
                      <label key={p.key} style={{ display:'flex',alignItems:'flex-start',gap:'0.75rem',padding:'0.625rem 0.75rem',border:'1px solid #e5e7eb',borderRadius:'0.5rem',cursor:'pointer',backgroundColor: newUser[p.key] ? p.color+'10' : 'white',borderColor: newUser[p.key] ? p.color+'60' : '#e5e7eb' }}>
                        <input type="checkbox" checked={newUser[p.key]} onChange={e => setNewUser({...newUser, [p.key]: e.target.checked})}
                          style={{ width:'1rem',height:'1rem',marginTop:'2px',accentColor: p.color }} />
                        <div>
                          <span style={{ fontWeight:500,fontSize:'0.875rem',color: newUser[p.key] ? p.color : '#374151' }}>{p.label}</span>
                          <p style={{ fontSize:'0.75rem',color:'#6b7280',marginTop:'1px' }}>{p.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Hinweis wenn kein Zugriff */}
                {!PERMISSIONS.some(p => newUser[p.key]) && (
                  <div style={{ padding:'0.625rem 0.875rem',backgroundColor:'#fef3c7',borderRadius:'0.5rem',fontSize:'0.8125rem',color:'#92400e' }}>
                    ⚠️ Ohne Berechtigungen kann diese Person sich zwar einloggen, aber nichts tun.
                  </div>
                )}

                {/* Ressourcen-Zuweisung Hinweis für Genehmiger */}
                {newUser.kannGenehmigen && (
                  <div style={{ padding:'0.625rem 0.875rem',backgroundColor:'#f5f3ff',borderRadius:'0.5rem',fontSize:'0.8125rem',color:'#6d28d9' }}>
                    💡 Ressourcen-Zuweisung für Genehmigungen kannst du nach dem Anlegen in der Benutzerliste vornehmen.
                  </div>
                )}
              </div>

              <div style={{ display:'flex',gap:'0.75rem',padding:'1.25rem 1.5rem',borderTop:'1px solid #e5e7eb',backgroundColor:'#f9fafb' }}>
                <button type="submit" disabled={saving}
                  style={{ flex:1,display:'inline-flex',alignItems:'center',justifyContent:'center',padding:'0.625rem 1rem',backgroundColor: saving ? '#93c5fd' : '#3b82f6',color:'white',borderRadius:'0.5rem',fontWeight:500,border:'none',cursor: saving ? 'wait' : 'pointer',fontSize:'0.875rem' }}>
                  {saving ? 'Speichern...' : editingUser ? 'Änderungen speichern' : 'Benutzer anlegen'}
                </button>
                <button type="button" onClick={closeModal}
                  style={{ padding:'0.625rem 1.5rem',backgroundColor:'white',border:'1px solid #d1d5db',color:'#374151',borderRadius:'0.5rem',fontWeight:500,cursor:'pointer',fontSize:'0.875rem' }}>
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
