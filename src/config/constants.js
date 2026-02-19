/**
 * constants.js – Zentrale Konstanten für die gesamte Anwendung.
 */

export { EVENT_TYPES as BOOKING_TYPES } from './organizationConfig';

export const ROLES = [
  { id: 'admin',      label: 'Administrator', color: '#dc2626', description: 'Volle Rechte: Buchungen, Genehmigungen, Benutzerverwaltung' },
  { id: 'genehmiger', label: 'Genehmiger',    color: '#7c3aed', description: 'Buchungen erstellen + zugewiesene Ressourcen genehmigen' },
  { id: 'trainer',    label: 'Trainer',        color: '#2563eb', description: 'Eigene Buchungen erstellen und verwalten' },
  { id: 'extern',     label: 'Extern',         color: '#6b7280', description: 'Nur Anfragen stellen (müssen genehmigt werden)' },
];

export const DAYS      = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const DAYS_FULL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/**
 * Zentrale Farbpalette für Ressourcen, Teams, etc.
 * (bisher dupliziert in FacilityManagement.js und OrganizationManagement.js)
 */
export const COLOR_PRESETS = [
  '#15803d', '#22c55e', '#84cc16', '#f59e0b', '#ef4444',
  '#f97316', '#8b5cf6', '#a855f7', '#2563eb', '#0891b2',
  '#e11d48', '#6b7280', '#16a34a', '#dc2626', '#7c3aed',
];

/**
 * Icons für Ressourcengruppen.
 * (bisher nur in FacilityManagement.js)
 */
export const GROUP_ICONS = [
  { id: 'outdoor', label: 'Außenanlagen', emoji: '\u{1F3DF}\uFE0F' },
  { id: 'indoor',  label: 'Innenräume',   emoji: '\u{1F3E0}' },
  { id: 'shared',  label: 'Geteilte Hallen', emoji: '\u{1F93D}' },
];
