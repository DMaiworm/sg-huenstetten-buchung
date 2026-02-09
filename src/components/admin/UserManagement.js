import React, { useState } from 'react';
import { X, UserPlus, Mail, Phone, Building } from 'lucide-react';
import { ROLES } from '../../config/constants';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Badge';

const UserManagement = ({ users, setUsers }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [newUser, setNewUser] = useState({
    firstName: '', lastName: '', club: 'SG Huenstetten', team: '', email: '', phone: '', role: 'trainer',
  });

  const filteredUsers = filterRole === 'all' ? users : users.filter(u => u.role === filterRole);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...newUser, id: editingUser.id } : u));
      setEditingUser(null);
    } else {
      setUsers([...users, { ...newUser, id: Date.now() }]);
    }
    setNewUser({ firstName: '', lastName: '', club: 'SG Huenstetten', team: '', email: '', phone: '', role: 'trainer' });
    setShowForm(false);
  };

  const handleEdit = (user) => { setNewUser(user); setEditingUser(user); setShowForm(true); };

  const handleDelete = (id) => {
    if (window.confirm('Benutzer wirklich loeschen?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingUser(null);
    setNewUser({ firstName: '', lastName: '', club: 'SG Huenstetten', team: '', email: '', phone: '', role: 'trainer' });
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Benutzerverwaltung</h2>
            <p className="text-gray-500">{users.length} Benutzer registriert</p>
          </div>
          <button 
            onClick={() => { setShowForm(true); setEditingUser(null); setNewUser({ firstName: '', lastName: '', club: 'SG Huenstetten', team: '', email: '', phone: '', role: 'trainer' }); }}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors gap-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Neuer Benutzer</span>
          </button>
        </div>

        <div className="mb-4">
          <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-lg">
            <button onClick={() => setFilterRole('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${filterRole === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
              <span>Alle</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                {users.length}
              </span>
            </button>
            {ROLES.map(role => (
              <button key={role.id} onClick={() => setFilterRole(role.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${filterRole === role.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                <span>{role.label}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                  {users.filter(u => u.role === role.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredUsers.map(user => {
            const role = ROLES.find(r => r.id === user.role);
            const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
            return (
              <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-2xl flex-shrink-0 overflow-hidden" 
                      style={{ 
                        backgroundColor: role?.color,
                        minWidth: '5rem',
                        maxWidth: '5rem'
                      }}
                    >
                      {user.photo ? (
                        <img src={user.photo} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-mono" style={{ letterSpacing: '-0.05em' }}>{initials}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">{user.firstName} {user.lastName}</h3>
                        <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'trainer' ? 'info' : 'default'}>
                          {role?.label}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{user.club} {user.team && ` - ${user.team}`}</span>
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </p>
                        {user.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{user.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(user)}
                      className="inline-flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="inline-flex items-center px-3 py-1.5 bg-gray-200 text-red-600 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Löschen</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal - außerhalb des Haupt-Divs */}
      {showForm && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxWidth: '42rem',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                {editingUser ? 'Benutzer bearbeiten' : 'Neuen Benutzer anlegen'}
              </h3>
              <button onClick={closeModal} style={{ color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                <X style={{ width: '1.5rem', height: '1.5rem' }} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Vorname *</label>
                    <input type="text" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Nachname *</label>
                    <input type="text" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Verein *</label>
                    <input type="text" value={newUser.club} onChange={(e) => setNewUser({ ...newUser, club: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Mannschaft / Kurs</label>
                    <input type="text" value={newUser.team} onChange={(e) => setNewUser({ ...newUser, team: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>E-Mail *</label>
                    <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Telefon</label>
                    <input type="tel" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Rolle *</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {ROLES.map(role => (
                        <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                          <input type="radio" name="role" value={role.id} checked={newUser.role === role.id} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} style={{ width: '1rem', height: '1rem' }} />
                          <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', backgroundColor: role.color, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{role.label}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{role.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', gap: '0.75rem', padding: '1.5rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <button 
                  type="submit"
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.625rem 1rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '0.5rem', fontWeight: '500', border: 'none', cursor: 'pointer' }}
                >
                  {editingUser ? 'Änderungen speichern' : 'Benutzer anlegen'}
                </button>
                <button 
                  type="button"
                  onClick={closeModal}
                  style={{ padding: '0.625rem 1.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '1px solid #d1d5db', color: '#374151', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer' }}
                >
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
