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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Benutzerverwaltung</h2>
          <p className="text-gray-500">{users.length} Benutzer registriert</p>
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); setEditingUser(null); setNewUser({ firstName: '', lastName: '', club: 'SG Huenstetten', team: '', email: '', phone: '', role: 'trainer' }); }}
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

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-4">{editingUser ? 'Benutzer bearbeiten' : 'Neuen Benutzer anlegen'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vorname *</label>
              <input type="text" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nachname *</label>
              <input type="text" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verein *</label>
              <input type="text" value={newUser.club} onChange={(e) => setNewUser({ ...newUser, club: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mannschaft / Kurs</label>
              <input type="text" value={newUser.team} onChange={(e) => setNewUser({ ...newUser, team: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
              <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input type="tel" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rolle *</label>
              <div className="flex gap-4">
                {ROLES.map(role => (
                  <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="role" value={role.id} checked={newUser.role === role.id} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-4 h-4" />
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                    <span className="text-sm">{role.label}</span>
                    <span className="text-xs text-gray-500">- {role.description}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button 
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              {editingUser ? 'Speichern' : 'Anlegen'}
            </button>
            <button 
              type="button"
              onClick={() => { setShowForm(false); setEditingUser(null); }}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {filteredUsers.map(user => {
          const role = ROLES.find(r => r.id === user.role);
          const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
          return (
            <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Avatar - bereit für Foto in der Zukunft */}
                  <div 
  className="w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-2xl flex-shrink-0 overflow-hidden" 
  style={{ 
    backgroundColor: role?.color,
    minWidth: '5rem',
    maxWidth: '5rem',
    flexShrink: 0
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
  );
};

export default UserManagement;
