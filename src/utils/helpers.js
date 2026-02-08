import { BOOKING_TYPES } from '../config/constants';

export const formatDate = (date) => {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getWeekDates = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

export const getMondayForDate = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const generateSeriesDates = (dayOfWeek, startDate, endDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let current = new Date(start);
  while (current.getDay() !== dayOfWeek) { current.setDate(current.getDate() + 1); }
  while (current <= end) { dates.push(formatDateISO(current)); current.setDate(current.getDate() + 7); }
  return dates;
};

export const hasTimeOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1); const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2); const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

export const checkBookingConflicts = (resourceId, dates, startTime, endTime, bookingType, bookings, slots, resources) => {
  const conflicts = [];
  const resource = resources.find(r => r.id === resourceId);
  const isLimited = resource?.type === 'limited';
  const isComposite = resource?.isComposite;
  const requestedType = BOOKING_TYPES.find(t => t.id === bookingType);

  dates.forEach(date => {
    const dateConflicts = [];
    const dayOfWeek = new Date(date).getDay();

    if (isLimited) {
      const availableSlot = slots.find(s => s.resourceId === resourceId && s.dayOfWeek === dayOfWeek && new Date(date) >= new Date(s.validFrom) && new Date(date) <= new Date(s.validUntil));
      if (!availableSlot) {
        dateConflicts.push({ type: 'no_slot', message: 'Kein verfügbarer Slot an diesem Tag', severity: 'error' });
      } else {
        const reqStart = timeToMinutes(startTime); const reqEnd = timeToMinutes(endTime);
        const slotStart = timeToMinutes(availableSlot.startTime); const slotEnd = timeToMinutes(availableSlot.endTime);
        if (reqStart < slotStart || reqEnd > slotEnd) {
          dateConflicts.push({ type: 'outside_slot', message: `Zeit außerhalb des Slots (${availableSlot.startTime}-${availableSlot.endTime})`, severity: 'error', slot: availableSlot });
        }
      }
    }

    const relevantBookings = bookings.filter(b => b.date === date && b.status !== 'rejected');
    relevantBookings.forEach(booking => {
      const existingType = BOOKING_TYPES.find(t => t.id === booking.bookingType);
      const hasOverlap = hasTimeOverlap(startTime, endTime, booking.startTime, booking.endTime);
      if (!hasOverlap) return;

      if (booking.resourceId === resourceId) {
        const severity = (!requestedType?.allowOverlap || !existingType?.allowOverlap) ? 'error' : 'warning';
        dateConflicts.push({ type: 'time_overlap', message: `${existingType?.icon || '📋'} ${existingType?.label || 'Buchung'}: "${booking.title}"`, severity, booking, existingType, explanation: severity === 'error' ? 'Diese Buchungstypen können sich nicht überschneiden' : 'Überschneidung möglich, aber prüfen Sie ob sinnvoll' });
      }
      if (isComposite && resource.includes?.includes(booking.resourceId)) {
        const severity = (!requestedType?.allowOverlap || !existingType?.allowOverlap) ? 'error' : 'warning';
        dateConflicts.push({ type: 'composite_blocked', message: `Teilfeld belegt: ${existingType?.icon || '📋'} "${booking.title}"`, severity, booking, existingType });
      }
      if (resource?.partOf && booking.resourceId === resource.partOf) {
        const severity = (!requestedType?.allowOverlap || !existingType?.allowOverlap) ? 'error' : 'warning';
        dateConflicts.push({ type: 'parent_blocked', message: `Ganzes Feld gebucht: ${existingType?.icon || '📋'} "${booking.title}"`, severity, booking, existingType });
      }
    });

    if (dateConflicts.length > 0) { conflicts.push({ date, conflicts: dateConflicts }); }
  });

  return conflicts;
};
