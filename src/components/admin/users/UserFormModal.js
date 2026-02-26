import React from 'react';
import { X } from 'lucide-react';
import { PERMISSIONS } from './userConstants';

function stammvereinSelectValue(user) {
  if (user.stammvereinId) return user.stammvereinId;
  if (user.stammvereinAndere !== null && user.stammvereinAndere !== undefined) return 'andere';
  return '';
}

function toggleAktivFuer(current, clubId) {
  return current.includes(clubId)
    ? current.filter(id => id !== clubId)
    : [...current, clubId];
}

const UserFormModal = ({ newUser, setNewUser, editingUser, saving, onSubmit, onClose, clubs = [] }) => {
  const stammSelectVal = stammvereinSelectValue(newUser);
  const zeigStammFreitext = stammSelectVal === 'andere';

  return (
    <div style={{ position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:'1rem' }}
      onClick={onClose}>
      <div style={{ backgroundColor:'white',borderRadius:'0.5rem',boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)',maxWidth:'42rem',width:'100%',maxHeight:'95vh',overflowY:'auto' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            {editingUser ? 'Benutzer bearbeiten' : 'Neuen Benutzer anlegen'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="px-6 py-5 space-y-3.5">
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vorname *</label>
                <input type="text" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nachname *</label>
                <input type="text" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
                <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input type="tel" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Berechtigungen</label>
              <div className="flex flex-col gap-2">
                {PERMISSIONS.map(p => (
                  <label key={p.key} className="flex items-start gap-3 px-3 py-2.5 border rounded-lg cursor-pointer transition-colors"
                    style={{ backgroundColor: newUser[p.key] ? p.color + '10' : 'white', borderColor: newUser[p.key] ? p.color + '60' : '#e5e7eb' }}>
                    <input type="checkbox" checked={!!newUser[p.key]} onChange={e => setNewUser({...newUser, [p.key]: e.target.checked})}
                      className="w-4 h-4 mt-0.5" style={{ accentColor: p.color }} />
                    <div>
                      <span className="font-medium text-sm" style={{ color: newUser[p.key] ? p.color : '#374151' }}>{p.label}</span>
                      <p className="text-xs text-gray-500 mt-px">{p.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {!PERMISSIONS.some(p => newUser[p.key]) && (
              <div className="px-3.5 py-2.5 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                ⚠️ Ohne Berechtigungen kann diese Person sich zwar einloggen, aber nichts tun.
              </div>
            )}
            {newUser.kannGenehmigen && (
              <div className="px-3.5 py-2.5 bg-violet-50 rounded-lg text-sm text-violet-800">
                💡 Ressourcen-Zuweisung kannst du nach dem Anlegen in der Benutzerliste vornehmen.
              </div>
            )}

            {/* Vereinszuordnung – nur für Trainer */}
            {newUser.istTrainer && clubs.length > 0 && (
              <div className="space-y-3 pt-1 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 pt-1">Vereinszuordnung</p>

                {/* Aktiv für (Mehrfachauswahl) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aktiv für <span className="text-gray-400 font-normal">(Vereinsmitgliedschaft, Mehrfachauswahl möglich)</span>
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {clubs.map(c => {
                      const checked = (newUser.aktivFuer || []).includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2.5 px-3 py-2 border rounded-lg cursor-pointer transition-colors"
                          style={{ backgroundColor: checked ? '#eff6ff' : 'white', borderColor: checked ? '#93c5fd' : '#e5e7eb' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setNewUser({ ...newUser, aktivFuer: toggleAktivFuer(newUser.aktivFuer || [], c.id) })}
                            className="w-4 h-4 rounded"
                            style={{ accentColor: '#2563eb' }}
                          />
                          <span className="text-sm font-medium" style={{ color: checked ? '#1d4ed8' : '#374151' }}>{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Stammverein */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stammverein <span className="text-gray-400 font-normal">(übernimmt Abrechnung)</span>
                  </label>
                  <select
                    value={stammSelectVal}
                    onChange={e => {
                      if (e.target.value === 'andere') {
                        // "Andere" gewählt: stammvereinAndere = '' (leer, aber nicht null = Andere aktiv)
                        setNewUser({ ...newUser, stammvereinId: null, stammvereinAndere: '' });
                      } else if (e.target.value === '') {
                        // Keine Auswahl: beide zurücksetzen
                        setNewUser({ ...newUser, stammvereinId: null, stammvereinAndere: null });
                      } else {
                        // Club gewählt
                        setNewUser({ ...newUser, stammvereinId: e.target.value, stammvereinAndere: null });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">– bitte wählen –</option>
                    {clubs.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="andere">Andere</option>
                  </select>

                  {/* Freitextfeld – erscheint nur wenn "Andere" gewählt */}
                  {zeigStammFreitext && (
                    <input
                      type="text"
                      value={newUser.stammvereinAndere || ''}
                      onChange={e => setNewUser({ ...newUser, stammvereinAndere: e.target.value })}
                      placeholder="Vereinsname eingeben..."
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 px-6 py-5 border-t border-gray-200 bg-gray-50">
            <button type="submit" disabled={saving}
              className={`flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg font-medium text-sm text-white ${
                saving ? 'bg-blue-300 cursor-wait' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
              }`}>
              {saving ? 'Speichern...' : editingUser ? 'Änderungen speichern' : 'Benutzer anlegen'}
            </button>
            <button type="button" onClick={onClose}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 cursor-pointer">
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
