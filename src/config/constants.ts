/**
 * constants.ts – Zentrale Konstanten für die gesamte Anwendung.
 */

import type { RoleConfig, GroupIconConfig, FormClasses } from '../types';

export const ROLES: RoleConfig[] = [
  { id: 'admin',      label: 'Administrator', color: '#dc2626', description: 'Volle Rechte: Buchungen, Genehmigungen, Benutzerverwaltung' },
  { id: 'genehmiger', label: 'Genehmiger',    color: '#7c3aed', description: 'Buchungen erstellen + zugewiesene Ressourcen genehmigen' },
  { id: 'trainer',    label: 'Trainer',        color: '#2563eb', description: 'Eigene Buchungen erstellen und verwalten' },
  { id: 'extern',     label: 'Extern',         color: '#6b7280', description: 'Nur Anfragen stellen (müssen genehmigt werden)' },
];

export const DAYS: string[]      = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const DAYS_FULL: string[] = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/** Zentrale Farbpalette für Ressourcen, Teams, etc. */
export const COLOR_PRESETS: string[] = [
  '#15803d', '#22c55e', '#84cc16', '#f59e0b', '#ef4444',
  '#f97316', '#8b5cf6', '#a855f7', '#2563eb', '#0891b2',
  '#e11d48', '#6b7280', '#16a34a', '#dc2626', '#7c3aed',
];

/** Wiederverwendbare CSS-Klassen für Formulare. */
export const FORM_CLASSES: FormClasses = {
  input: 'w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm',
  label: 'block text-sm font-medium text-gray-700 mb-1',
  section: 'bg-white border border-gray-200 rounded-lg p-4 mb-5',
};

/** Icons für Ressourcengruppen. */
export const GROUP_ICONS: GroupIconConfig[] = [
  { id: 'outdoor', label: 'Außenanlagen',    emoji: '🏟️' },
  { id: 'indoor',  label: 'Innenräume',      emoji: '🏠' },
  { id: 'shared',  label: 'Geteilte Hallen', emoji: '🤽' },
];
