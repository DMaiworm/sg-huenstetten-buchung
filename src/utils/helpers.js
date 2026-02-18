/**
 * Shared utility / helper functions.
 *
 * Pure functions only \u2013 no React, no side-effects.
 * Used across CalendarView, BookingRequest, conflict checks, etc.
 */

import { EVENT_TYPES } from '../config/organizationConfig';

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
//  Date formatting
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

/** Format a Date as "dd.MM.yyyy" (German locale). */
export const formatDate = (date) => {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** Format a Date as "YYYY-MM-DD" (ISO 8601 date-only). */
export const formatDateISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
//  Week helpers
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

/**
 * Return the Monday (start of ISO week) for any given date.
 * Hours are zeroed out so the result is midnight-aligned.
 *
 * @param {Date} date - Any date within the target week
 * @returns {Date} Monday 00:00:00 of that week
 */
export const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay() || 7;          // Sunday=0 \u2192 treat as 7
  d.setDate(d.getDate() - day + 1);     // back to Monday
  d.setHours(0, 0, 0, 0);
  return d;
};

/** @deprecated Use getWeekStart() instead. Kept for backward compat. */
export const getMondayForDate = getWeekStart;

/**
 * Return an array of 7 Dates (Mon\u2013Sun) for the week containing `date`.
 *
 * @param {Date} date - Any date within the target week
 * @returns {Date[]} Array of length 7
 */
export const getWeekDates = (date) => {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
//  Time helpers
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

/** Convert "HH:MM" to total minutes since midnight. */
export const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
//  Series / recurrence
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

/**
 * Generate all ISO date strings for a recurring weekly event.
 *
 * @param {number} dayOfWeek  - JS day (0=Sun, 1=Mon, \u2026)
 * @param {string} startDate  - ISO start date (inclusive)
 * @param {string} endDate    - ISO end date (inclusive)
 * @returns {string[]} Array of "YYYY-MM-DD" strings
 */
export const generateSeriesDates = (dayOfWeek, startDate, endDate) => {
  const dates = [];
  const end = new Date(endDate);
  let current = new Date(startDate);
  // Advance to first matching weekday
  while (current.getDay() !== dayOfWeek) { current.setDate(current.getDate() + 1); }
  // Collect every 7 days
  while (current <= end) {
    dates.push(formatDateISO(current));
    current.setDate(current.getDate() + 7);
  }
  return dates;
};

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
//  Conflict detection
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

/** Check whether two time ranges overlap. */
export const hasTimeOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1); const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2); const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

/**
 * Full conflict check for a booking request.
 *
 * Checks:
 *   1. Slot availability (for 'limited' / slotOnly resources)
 *   2. Direct time overlaps on the same resource
 *   3. Composite conflicts (parent \u2194 sub-resource blocking)
 *
 * @param {string}   resourceId  - Target resource ID
 * @param {string[]} dates       - Array of ISO date strings
 * @param {string}   startTime   - "HH:MM"
 * @param {string}   endTime     - "HH:MM"
 * @param {string}   bookingType - One of EVENT_TYPES[].id
 * @param {Array}    bookings    - All existing bookings
 * @param {Array}    slots       - All slot definitions
 * @param {Array}    resources   - All (legacy) resources
 * @returns {Array}  Conflict objects grouped by date
 */
export const checkBookingConflicts = (resourceId, dates, startTime, endTime, bookingType, bookings, slots, resources) => {
  const conflicts = [];
  const resource = resources.find(r => r.id === resourceId);
  const isLimited = resource?.type === 'limited';
  const isComposite = resource?.isComposite;
  const requestedType = EVENT_TYPES.find(t => t.id === bookingType);

  dates.forEach(date => {
    const dateConflicts = [];
    const dayOfWeek = new Date(date).getDay();

    // 1) Slot check for limited resources
    if (isLimited) {
      const availableSlot = slots.find(s =>
        s.resourceId === resourceId &&
        s.dayOfWeek === dayOfWeek &&
        new Date(date) >= new Date(s.validFrom) &&
        new Date(date) <= new Date(s.validUntil)
      );
      if (!availableSlot) {
        dateConflicts.push({ type: 'no_slot', message: 'Kein verf\u00fcgbarer Slot an diesem Tag', severity: 'error' });
      } else {
        const reqStart = timeToMinutes(startTime);
        const reqEnd = timeToMinutes(endTime);
        const slotStart = timeToMinutes(availableSlot.startTime);
        const slotEnd = timeToMinutes(availableSlot.endTime);
        if (reqStart < slotStart || reqEnd > slotEnd) {
          dateConflicts.push({
            type: 'outside_slot',
            message: `Zeit au\u00dferhalb des Slots (${availableSlot.startTime}-${availableSlot.endTime})`,
            severity: 'error',
            slot: availableSlot,
          });
        }
      }
    }

    // 2) Time overlap checks against existing bookings
    const relevantBookings = bookings.filter(b => b.date === date && b.status !== 'rejected');
    relevantBookings.forEach(booking => {
      const existingType = EVENT_TYPES.find(t => t.id === booking.bookingType);
      if (!hasTimeOverlap(startTime, endTime, booking.startTime, booking.endTime)) return;

      // 2a) Same resource
      if (booking.resourceId === resourceId) {
        const severity = (!requestedType?.allowOverlap || !existingType?.allowOverlap) ? 'error' : 'warning';
        dateConflicts.push({
          type: 'time_overlap',
          message: `${existingType?.icon || '\uD83D\uDCCB'} ${existingType?.label || 'Buchung'}: "${booking.title}"`,
          severity,
          booking,
          existingType,
          explanation: severity === 'error'
            ? 'Diese Buchungstypen k\u00f6nnen sich nicht \u00fcberschneiden'
            : '\u00dcberschneidung m\u00f6glich, aber pr\u00fcfen Sie ob sinnvoll',
        });
      }
      // 2b) Composite: sub-resource booked while requesting whole field
      if (isComposite && resource.includes?.includes(booking.resourceId)) {
        const severity = (!requestedType?.allowOverlap || !existingType?.allowOverlap) ? 'error' : 'warning';
        dateConflicts.push({
          type: 'composite_blocked',
          message: `Teilfeld belegt: ${existingType?.icon || '\uD83D\uDCCB'} "${booking.title}"`,
          severity,
          booking,
          existingType,
        });
      }
      // 2c) Sub-resource: whole field booked while requesting a part
      if (resource?.partOf && booking.resourceId === resource.partOf) {
        const severity = (!requestedType?.allowOverlap || !existingType?.allowOverlap) ? 'error' : 'warning';
        dateConflicts.push({
          type: 'parent_blocked',
          message: `Ganzes Feld gebucht: ${existingType?.icon || '\uD83D\uDCCB'} "${booking.title}"`,
          severity,
          booking,
          existingType,
        });
      }
    });

    if (dateConflicts.length > 0) {
      conflicts.push({ date, conflicts: dateConflicts });
    }
  });

  return conflicts;
};
