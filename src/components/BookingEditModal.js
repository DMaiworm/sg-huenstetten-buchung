/**
 * BookingEditModal – Modal zum Bearbeiten einer bestehenden Buchung.
 *
 * Eigenschaften (Titel, Beschreibung, Terminart) sind frei änderbar.
 * Termin-Daten (Datum, Zeit, Ressource) lösen bei Änderung einen
 * neuen Genehmigungsprozess aus.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import { EVENT_TYPES } from '../config/organizationConfig';
import Modal from './ui/Modal';
import { Button } from './ui/Button';

const labelCls = 'block text-[13px] font-semibold text-gray-700 mb-1.5';
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

const BookingEditModal = ({ booking, open, onClose, onSave, resources, users }) => {
  const [form, setForm] = useState({
    title: '', description: '', bookingType: 'training',
    date: '', startTime: '', endTime: '', resourceId: '',
  });
  const [saving, setSaving] = useState(false);

  // Formular mit Buchungsdaten befüllen wenn Modal geöffnet wird
  useEffect(() => {
    if (booking && open) {
      setForm({
        title: booking.title || '',
        description: booking.description || '',
        bookingType: booking.bookingType || 'training',
        date: booking.date || '',
        startTime: booking.startTime || '',
        endTime: booking.endTime || '',
        resourceId: booking.resourceId || '',
      });
    }
  }, [booking, open]);

  // Letztes Datum der Serie (für Enddatum-Anzeige)
  const seriesEndDate = useMemo(() => {
    if (!booking) return '';
    const sbs = booking.seriesBookings;
    if (sbs && sbs.length > 0) return sbs[sbs.length - 1].date;
    return booking.date || '';
  }, [booking]);

  // Erkennung ob Termindaten geändert wurden
  const scheduleChanged = useMemo(() => {
    if (!booking) return false;
    return (
      form.date !== booking.date ||
      form.startTime !== booking.startTime ||
      form.endTime !== booking.endTime ||
      form.resourceId !== booking.resourceId
    );
  }, [form, booking]);

  // Erkennung ob überhaupt etwas geändert wurde
  const hasChanges = useMemo(() => {
    if (!booking) return false;
    return (
      form.title !== (booking.title || '') ||
      form.description !== (booking.description || '') ||
      form.bookingType !== (booking.bookingType || 'training') ||
      scheduleChanged
    );
  }, [form, booking, scheduleChanged]);

  const userName = useMemo(() => {
    if (!booking || !users) return '';
    const user = users.find(u => u.id === booking.userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unbekannt';
  }, [booking, users]);

  const resource = resources.find(r => r.id === form.resourceId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasChanges || !booking) return;

    setSaving(true);
    const updates = {};
    if (form.title !== (booking.title || ''))               updates.title = form.title;
    if (form.description !== (booking.description || ''))   updates.description = form.description;
    if (form.bookingType !== (booking.bookingType || 'training')) updates.bookingType = form.bookingType;
    if (form.date !== booking.date)                         updates.date = form.date;
    if (form.startTime !== booking.startTime)               updates.startTime = form.startTime;
    if (form.endTime !== booking.endTime)                   updates.endTime = form.endTime;
    if (form.resourceId !== booking.resourceId)             updates.resourceId = form.resourceId;

    const result = await onSave(booking.id, updates);
    setSaving(false);
    if (!result?.error) onClose();
  };

  if (!booking) return null;

  const statusLabel = { approved: 'Genehmigt', pending: 'Ausstehend', rejected: 'Abgelehnt' }[booking.status] || booking.status;
  const statusCls = { approved: 'bg-green-100 text-green-800', pending: 'bg-yellow-100 text-yellow-800', rejected: 'bg-red-100 text-red-800' }[booking.status] || 'bg-gray-100 text-gray-800';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buchung bearbeiten"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!hasChanges || saving}>
            <Save className="w-4 h-4" />
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Status-Info */}
        <div className="flex items-center gap-3 text-sm">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusCls}`}>
            {statusLabel}
          </span>
          <span className="text-gray-500">Erstellt von: {userName}</span>
          {booking.seriesId && (
            <span className="text-xs text-blue-600 font-medium">Serie</span>
          )}
        </div>

        {/* ── Eigenschaften (frei änderbar) ── */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Eigenschaften</div>

          <div>
            <label className={labelCls}>Titel</label>
            <input
              type="text" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className={inputCls} required
            />
          </div>

          <div>
            <label className={labelCls}>Beschreibung</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className={`${inputCls} resize-y`} rows={2}
              placeholder="Zusätzliche Informationen..."
            />
          </div>

          <div>
            <label className={labelCls}>Terminart</label>
            <div className="flex gap-2 flex-wrap">
              {EVENT_TYPES.map(et => (
                <button
                  key={et.id} type="button"
                  onClick={() => setForm(p => ({ ...p, bookingType: et.id }))}
                  className={`px-3 py-2 rounded-lg text-[13px] font-medium border-2 transition-colors ${
                    form.bookingType === et.id
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {et.icon} {et.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Termindaten (Änderung → Re-Genehmigung) ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Termin</div>
            {scheduleChanged && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> Erneute Genehmigung erforderlich
              </span>
            )}
          </div>

          {scheduleChanged && (
            <div className="px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[13px] text-amber-800">
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />
              Wenn du Datum, Uhrzeit oder Ressource änderst, muss die Buchung erneut genehmigt werden.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Startdatum</label>
              <input
                type="date" value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className={inputCls} required
              />
            </div>
            <div>
              <label className={labelCls}>Enddatum</label>
              <input
                type="date" value={seriesEndDate}
                readOnly
                className={`${inputCls} bg-gray-50 text-gray-500 cursor-default`}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Startzeit</label>
              <input
                type="time" value={form.startTime}
                onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                className={inputCls} required
              />
            </div>
            <div>
              <label className={labelCls}>Endzeit</label>
              <input
                type="time" value={form.endTime}
                onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                className={inputCls} required
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Ressource</label>
            <div className="flex items-center gap-2">
              {resource && (
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: resource.color }} />
              )}
              <select
                value={form.resourceId}
                onChange={e => setForm(p => ({ ...p, resourceId: e.target.value }))}
                className={inputCls}
              >
                {resources.filter(r => !r.isComposite).map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default BookingEditModal;
