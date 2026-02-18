/**
 * constants.js – Remaining frontend-only constants.
 *
 * Most data has been migrated to Supabase (profiles, resources, bookings, slots)
 * or to organizationConfig.js (EVENT_TYPES, clubs, departments, teams).
 *
 * What remains here:
 *   - ROLES: Role definitions (used in UserManagement, Approvals)
 *   - DAYS / DAYS_FULL: Weekday labels (pure display logic, not DB-relevant)
 *   - BOOKING_TYPES: Re-exported alias for EVENT_TYPES (backward compat)
 *
 * @deprecated RESOURCES, DEMO_USERS, DEMO_BOOKINGS, DEMO_SLOTS
 *   have been removed. Use Supabase hooks or organizationConfig.js instead.
 */

export { EVENT_TYPES as BOOKING_TYPES } from './organizationConfig';

export const ROLES = [
  { id: 'admin', label: 'Administrator', color: '#dc2626', description: 'Volle Rechte: Buchungen, Genehmigungen, Benutzerverwaltung' },
  { id: 'trainer', label: 'Trainer', color: '#2563eb', description: 'Eigene Buchungen erstellen und verwalten' },
  { id: 'extern', label: 'Extern', color: '#6b7280', description: 'Nur Anfragen stellen (müssen genehmigt werden)' },
];

export const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const DAYS_FULL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
