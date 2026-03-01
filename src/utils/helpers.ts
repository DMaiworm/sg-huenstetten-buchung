/**
 * Shared utility / helper functions.
 *
 * Pure functions only - no React, no side-effects.
 * Used across CalendarView, BookingRequest, conflict checks, etc.
 */

import { EVENT_TYPES } from '../config/organizationConfig';
import type {
  Booking,
  BookableResource,
  BookingType,
  Club,
  ConflictObject,
  DateConflicts,
  DateHolidayInfo,
  Department,
  EventType,
  Slot,
  Team,
  TeamOrgLabel,
  User,
} from '../types';

// ─────────────────────────────────────────────────
//  Date formatting
// ────────────────────────────────────────────────

/** Format a Date as "dd.MM.yyyy" (German locale). */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** Format a Date as "YYYY-MM-DD" (ISO 8601 date-only). */
export const formatDateISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ───────────────────────────────────────────────
//  Week helpers
// ────────────────────────────────────────────────

/**
 * Return the Monday (start of ISO week) for any given date.
 * Hours are zeroed out so the result is midnight-aligned.
 */
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay() || 7;          // Sunday=0 → treat as 7
  d.setDate(d.getDate() - day + 1);     // back to Monday
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Return an array of 7 Dates (Mon–Sun) for the week containing `date`.
 */
export const getWeekDates = (date: Date): Date[] => {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

// ────────────────────────────────────────────────
//  Time helpers
// ────────────────────────────────────────────────

/** Convert "HH:MM" to total minutes since midnight. */
export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// ────────────────────────────────────────────────
//  Series / recurrence
// ────────────────────────────────────────────────

/**
 * Generate all ISO date strings for a recurring weekly event.
 */
export const generateSeriesDates = (dayOfWeek: number, startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const end = new Date(endDate);
  const current = new Date(startDate);
  // Advance to first matching weekday
  while (current.getDay() !== dayOfWeek) { current.setDate(current.getDate() + 1); }
  // Collect every 7 days
  while (current <= end) {
    dates.push(formatDateISO(current));
    current.setDate(current.getDate() + 7);
  }
  return dates;
};

// ────────────────────────────────────────────────
//  Holiday / vacation checks
// ────────────────────────────────────────────────

interface HolidayLike {
  name: string;
  type: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
}

/**
 * Check whether a date falls on a public holiday or within school vacations.
 */
export const getDateHolidayInfo = (dateStr: string, holidays: HolidayLike[]): DateHolidayInfo => {
  if (!holidays || holidays.length === 0) return { feiertag: null, schulferien: null };

  let feiertag: string | null = null;
  let schulferien: string | null = null;

  for (const h of holidays) {
    const start = h.start_date || h.startDate;
    const end = h.end_date || h.endDate;
    if (start && end && dateStr >= start && dateStr <= end) {
      if (h.type === 'feiertag') feiertag = h.name;
      if (h.type === 'schulferien') schulferien = h.name;
    }
  }

  return { feiertag, schulferien };
};

// ────────────────────────────────────────────────
//  Display helpers
// ────────────────────────────────────────────────

/**
 * Get display name for a user by ID.
 */
export const getUserDisplayName = (userId: string, users: User[]): string => {
  const u = users.find(x => x.id === userId);
  return u ? `${u.firstName} ${u.lastName}` : 'Unbekannt';
};

/**
 * Get organization label for a team (Team → Abteilung → Verein).
 */
export const getTeamOrgLabel = (
  teamId: string,
  { teams, departments, clubs }: { teams: Team[]; departments: Department[]; clubs: Club[] }
): TeamOrgLabel => {
  const team = teams.find(t => t.id === teamId);
  if (!team) return { teamName: '', departmentName: '', clubName: '', label: '' };
  const dept = departments.find(d => d.id === team.departmentId);
  const club = dept ? clubs.find(c => c.id === dept.clubId) : null;
  return {
    teamName: team.name,
    departmentName: dept?.name || '',
    clubName: club?.name || club?.shortName || '',
    label: [club?.shortName || club?.name, dept?.name, team.name].filter(Boolean).join(' › '),
  };
};

/**
 * Group bookings by seriesId. Singles (no series) are returned as-is.
 */
export const groupBookingsBySeries = (bookingsToGroup: Booking[], allBookings: Booking[]): Array<Booking | (Booking & { seriesBookings: Array<Booking & { conflicts: Booking[] }>; totalCount: number; freeCount: number; blockedCount: number })> => {
  const seriesMap: Record<string, Booking & { seriesBookings: Array<Booking & { conflicts: Booking[] }>; totalCount: number; freeCount: number; blockedCount: number }> = {};
  const singles: Booking[] = [];
  bookingsToGroup.forEach(b => {
    if (b.seriesId) {
      if (!seriesMap[b.seriesId]) {
        seriesMap[b.seriesId] = { ...b, seriesBookings: [], totalCount: 0, freeCount: 0, blockedCount: 0 };
      }
      const conflicts = findConflicts(b, allBookings);
      seriesMap[b.seriesId].seriesBookings.push({ ...b, conflicts });
    } else {
      singles.push(b);
    }
  });
  Object.values(seriesMap).forEach(s => {
    s.seriesBookings.sort((a, b) => a.date.localeCompare(b.date));
    s.totalCount = s.seriesBookings.length;
    s.freeCount = s.seriesBookings.filter(sb => sb.conflicts.length === 0).length;
    s.blockedCount = s.seriesBookings.filter(sb => sb.conflicts.length > 0).length;
  });
  return [...Object.values(seriesMap), ...singles];
};

// ────────────────────────────────────────────────
//  Conflict detection
// ────────────────────────────────────────────────

/** Check whether two time ranges overlap. */
export const hasTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const s1 = timeToMinutes(start1); const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2); const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

/**
 * Find approved/pending bookings that conflict with a given booking.
 */
export const findConflicts = (booking: Booking, allBookings: Booking[]): Booking[] => {
  return allBookings.filter(other =>
    other.id !== booking.id &&
    other.resourceId === booking.resourceId &&
    other.date === booking.date &&
    (other.status === 'approved' || other.status === 'pending') &&
    !(booking.seriesId && other.seriesId === booking.seriesId) &&
    hasTimeOverlap(booking.startTime, booking.endTime, other.startTime, other.endTime)
  );
};

/**
 * Full conflict check for a booking request.
 */
export const checkBookingConflicts = (
  resourceId: string,
  dates: string[],
  startTime: string,
  endTime: string,
  bookingType: BookingType,
  bookings: Booking[],
  slots: Slot[],
  resources: BookableResource[]
): DateConflicts[] => {
  const conflicts: DateConflicts[] = [];
  const resource = resources.find(r => r.id === resourceId);
  const isLimited = resource?.type === 'limited';
  const isComposite = resource?.isComposite;
  const requestedType = EVENT_TYPES.find(t => t.id === bookingType);

  dates.forEach(date => {
    const dateConflicts: ConflictObject[] = [];
    const dayOfWeek = new Date(date).getDay();

    // 1) Slot check for limited resources
    if (isLimited) {
      const availableSlot = slots.find(s =>
        s.resourceId === resourceId &&
        s.dayOfWeek === dayOfWeek &&
        new Date(date) >= new Date(s.validFrom!) &&
        new Date(date) <= new Date(s.validUntil!)
      );
      if (!availableSlot) {
        dateConflicts.push({ type: 'no_slot', message: 'Kein verfügbarer Slot an diesem Tag', severity: 'error' });
      } else {
        const reqStart = timeToMinutes(startTime);
        const reqEnd = timeToMinutes(endTime);
        const slotStart = timeToMinutes(availableSlot.startTime);
        const slotEnd = timeToMinutes(availableSlot.endTime);
        if (reqStart < slotStart || reqEnd > slotEnd) {
          dateConflicts.push({
            type: 'outside_slot',
            message: `Zeit außerhalb des Slots (${availableSlot.startTime}-${availableSlot.endTime})`,
            severity: 'error',
            slot: availableSlot,
          });
        }
      }
    }

    // 2) Time overlap checks against existing bookings
    const relevantBookings = bookings.filter(b => b.date === date && b.status !== 'rejected');
    relevantBookings.forEach(booking => {
      const existingType: EventType | undefined = EVENT_TYPES.find(t => t.id === booking.bookingType);
      if (!hasTimeOverlap(startTime, endTime, booking.startTime, booking.endTime)) return;

      // 2a) Same resource
      if (booking.resourceId === resourceId) {
        const severity = (!requestedType?.allowOverlap || !existingType?.allowOverlap) ? 'error' as const : 'warning' as const;
        dateConflicts.push({
          type: 'time_overlap',
          message: `${existingType?.icon || '📋'} ${existingType?.label || 'Buchung'}: "${booking.title}"`,
          severity,
          booking,
          existingType,
          explanation: severity === 'error'
            ? 'Diese Buchungstypen können sich nicht überschneiden'
            : 'Überschneidung möglich, aber prüfen Sie ob sinnvoll',
        });
      }
      // 2b) Composite: sub-resource booked while requesting whole field
      if (isComposite && resource?.includes?.includes(booking.resourceId)) {
        const severity = (!requestedType?.allowOverlap || !existingType?.allowOverlap) ? 'error' as const : 'warning' as const;
        dateConflicts.push({
          type: 'composite_blocked',
          message: `Teilfeld belegt: ${existingType?.icon || '📋'} "${booking.title}"`,
          severity,
          booking,
          existingType,
        });
      }
      // 2c) Sub-resource: whole field booked while requesting a part
      if (resource?.partOf && booking.resourceId === resource.partOf) {
        const severity = (!requestedType?.allowOverlap || !existingType?.allowOverlap) ? 'error' as const : 'warning' as const;
        dateConflicts.push({
          type: 'parent_blocked',
          message: `Ganzes Feld gebucht: ${existingType?.icon || '📋'} "${booking.title}"`,
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
