/**
 * constants.js – Remaining frontend-only constants.
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
