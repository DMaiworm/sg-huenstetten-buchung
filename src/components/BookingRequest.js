import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users, Plus, Shield, Repeat, Maximize } from 'lucide-react';
import { BOOKING_TYPES, ROLES, DAYS_FULL } from '../config/constants';
import { timeToMinutes, generateSeriesDates, checkBookingConflicts } from '../utils/helpers';
import { Badge } from './ui/Badge';
import { Button } from './ui/Badge';

const BookingRequest = ({ slots, onSubmit, users, bookings = [], resources }) => {
  const RESOURCES = resources;
  const [formData, setFormData] = useState({
    resourceId: RESOURCES.length > 0 ? RESOURCES[0].id : '', dayOfWeek: 1, startTime: '16:00', endTime: '18:00',
    startDate: '', endDate: '', title: '', description: '', userId: '', bookingType: 'training',
  });

  const resource = RESOURCES.find(r => r.id === formData.resourceId);
  const isLimited = resource?.type === 'limited';
  const isComposite = resource?.isComposite;
  const selectedBookingType = BOOKING_TYPES.find(t => t.id === formData.bookingType);

  const availableSlots = useMemo(() => {
    if (!isLimited) return [];
    return slots.filter(s => s.resourceId === formData.resourceId && s.dayOfWeek === formData.dayOfWeek);
  }, [isLimited, formData.dayOfWeek, formData.resourceId, slots]);

  const previewDates = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return [];
    return generateSeriesDates(formData.dayOfWeek, formData.startDate, formData.endDate);
  }, [formData.dayOfWeek, formData.startDate, formData.endDate]);

  const conflictAnalysis = useMemo(() => {
    if (previewDates.length === 0 || !formData.startTime || !formData.endTime) {
      return { conflicts: [], hasErrors: false, hasWarnings: false };
    }
    const conflicts = checkBookingConflicts(formData.resourceId, previewDates, formData.startTime, formData.endTime, formData.bookingType, bookings, slots, RESOURCES);
    const hasErrors = conflicts.some(c => c.conflicts.some(cf => cf.severity === 'error'));
    const hasWarnings = conflicts.some(c => c.conflicts.some(cf => cf.severity === 'warning'));
    return { conflicts, hasErrors, hasWarnings };
  }, [formData, previewDates, bookings, slots, RESOURCES]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (conflictAnalysis.hasErrors) { window.alert('Es gibt Konflikte, die eine Buchung unmoeglich machen.'); return; }
    if (isLimited && availableSlots.length === 0) { window.alert('Am ' + DAYS_FULL[formData.dayOfWeek] + ' ist kein Slot verfuegbar!'); return; }
    if (isLimited) {
      const slot = availableSlots[0];
      const reqStart = timeToMinutes(formData.startTime); const reqEnd = timeToMinutes(formData.endTime);
      const slotStart = timeToMinutes(slot.startTime); const slotEnd = timeToMinutes(slot.endTime);
      if (reqStart < slotStart || reqEnd > slotEnd) { window.alert('Zeit ausserhalb des Slots (' + slot.startTime + ' - ' + slot.endTime + ')!'); return; }
    }
    onSubmit({ ...formData, dates: previewDates, isComposite, includedResources: isComposite ? resource.includes : null });
    window.alert('Buchungsanfrage fuer ' + previewDates.length + ' Termine eingereicht!');
    setFormData({ ...formData, title: '', description: '', startDate: '', endDate: '', userId: '' });
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Neue Buchungsanfrage</h2>
      <p className="text-gray-500 mb-6">Woechentlich wiederkehrende Buchung anlegen</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ressource auswaehlen</label>
          <select value={formData.resourceId} onChange={(e) => setFormData({ ...formData, resourceId: e.target.value, startTime: '', endTime: '' })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <optgroup label="Aussenanlagen">{RESOURCES.filter(r => r.category === 'outdoor').map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}</optgroup>
            <optgroup label="Innenraeume">{RESOURCES.filter(r => r.category === 'indoor').map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}</optgroup>
            <optgroup label="Geteilte Hallen (limitiert)">{RESOURCES.filter(r => r.category === 'shared').map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}</optgroup>
          </select>
          {isComposite && (<div className="mt-3 p-3 bg-blue-50 rounded-lg"><p className="text-sm text-blue-800 flex items-center gap-2"><Maximize className="w-4 h-4" /><strong>Ganzes Spielfeld:</strong> Reserviert automatisch beide Haelften.</p></div>)}
          {isLimited && (<div className="mt-3 p-3 bg-yellow-50 rounded-lg"><p className="text-sm text-yellow-800 flex items-center gap-2"><Shield className="w-4 h-4" /><strong>Limitierte Ressource:</strong> Nur in zugewiesenen Zeitfenstern buchbar.</p></div>)}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Art der Buchung</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {BOOKING_TYPES.map(type => (
              <button key={type.id} type="button" onClick={() => setFormData({ ...formData, bookingType: type.id })}
                className={`p-3 rounded-lg border-2 transition-all ${formData.bookingType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <div className="text-center">
                  <div className="text-3xl mb-1">{type.icon}</div>
                  <div className={`text-sm font-medium ${formData.bookingType === type.id ? 'text-blue-700' : 'text-gray-700'}`}>{type.label}</div>
                </div>
              </button>
            ))}
          </div>
          {selectedBookingType && (
            <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: selectedBookingType.color + '15', borderLeft: '4px solid ' + selectedBookingType.color }}>
              <p className="text-sm" style={{ color: selectedBookingType.color }}>
                <strong>{selectedBookingType.icon} {selectedBookingType.label}:</strong> {selectedBookingType.description}
              </p>
            </div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2"><Repeat className="w-5 h-5 text-blue-600" />Woechentlicher Termin</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Wochentag</label>
              <select value={formData.dayOfWeek} onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                {DAYS_FULL.map((day, i) => (<option key={i} value={i}>{day}</option>))}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Startzeit</label>
              <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Endzeit</label>
              <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required /></div>
          </div>
          {isLimited && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Verfuegbare Slots am {DAYS_FULL[formData.dayOfWeek]}:</h4>
              {availableSlots.length > 0 ? (
                <ul className="space-y-1">{availableSlots.map(slot => (<li key={slot.id} className="text-blue-700 flex items-center gap-2"><Clock className="w-4 h-4" />{slot.startTime} - {slot.endTime} Uhr <span className="text-xs text-blue-500">(bis {slot.validUntil})</span></li>))}</ul>
              ) : (<p className="text-red-600">Kein Slot an diesem Tag verfuegbar.</p>)}
            </div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600" />Zeitraum der Serie</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Startdatum</label>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Enddatum</label>
              <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required /></div>
          </div>
          {previewDates.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">Vorschau: {previewDates.length} Termine</h4>
                {conflictAnalysis.hasErrors && <Badge variant="danger">{conflictAnalysis.conflicts.length} Konflikte</Badge>}
                {!conflictAnalysis.hasErrors && conflictAnalysis.conflicts.length === 0 && <Badge variant="success">Alle Termine verfuegbar</Badge>}
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {previewDates.map((date, i) => {
                  const dateConflict = conflictAnalysis.conflicts.find(c => c.date === date);
                  const hasConflict = !!dateConflict;
                  const hasError = dateConflict?.conflicts.some(c => c.severity === 'error');
                  return (
                    <div key={i} className={`p-3 rounded-lg border-2 ${hasError ? 'bg-red-50 border-red-300' : hasConflict ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-300'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{new Date(date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                          <div className="text-sm text-gray-600">{formData.startTime} - {formData.endTime} Uhr</div>
                        </div>
                        {!hasConflict && <span className="text-sm text-green-700 font-medium">Verfuegbar</span>}
                      </div>
                      {hasConflict && (
                        <div className="mt-2 space-y-1">
                          {dateConflict.conflicts.map((conflict, ci) => (
                            <div key={ci} className={`text-sm p-2 rounded ${conflict.severity === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              <div className="font-medium">{conflict.message}</div>
                              {conflict.explanation && (<div className="text-xs mt-1 italic opacity-70">{conflict.explanation}</div>)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" />Buchender Benutzer</h3>
          <select value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: Number(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
            <option value="">-- Bitte auswaehlen --</option>
            <optgroup label="Administratoren">{users.filter(u => u.role === 'admin').map(u => (<option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.team || u.club})</option>))}</optgroup>
            <optgroup label="Trainer">{users.filter(u => u.role === 'trainer').map(u => (<option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.team || u.club})</option>))}</optgroup>
            <optgroup label="Externe">{users.filter(u => u.role === 'extern').map(u => (<option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.club})</option>))}</optgroup>
          </select>
          {formData.userId && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
              {(() => { const selectedUser = users.find(u => u.id === formData.userId); const role = ROLES.find(r => r.id === selectedUser?.role);
                return selectedUser ? (<div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: role?.color }} /><span>{selectedUser.firstName} {selectedUser.lastName}</span><span>{role?.label}</span>{selectedUser.role === 'extern' && (<Badge variant="warning">Erfordert Genehmigung</Badge>)}</div>) : null; })()}
            </div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-4">Buchungsdetails</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Veranstaltung / Training *</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="z.B. A-Jugend Training, Yoga Kurs" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung (optional)</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Zusaetzliche Informationen..." rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Zusammenfassung</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>Ressource:</strong> {resource?.name}</li>
            <li><strong>Wochentag:</strong> {DAYS_FULL[formData.dayOfWeek]}</li>
            <li><strong>Uhrzeit:</strong> {formData.startTime || '--:--'} - {formData.endTime || '--:--'}</li>
            <li><strong>Termine:</strong> {previewDates.length} Wochen</li>
          </ul>
        </div>
        <Button type="submit" className="w-full" disabled={previewDates.length === 0 || !formData.userId || conflictAnalysis.hasErrors} variant={conflictAnalysis.hasErrors ? 'secondary' : 'primary'}>
          <Plus className="w-5 h-5 inline mr-2" />
          {conflictAnalysis.hasErrors ? 'Buchung nicht moeglich (Konflikte)' : 'Anfrage einreichen (' + previewDates.length + ' Termine)'}
        </Button>
      </form>
    </div>
  );
};

export default BookingRequest;
