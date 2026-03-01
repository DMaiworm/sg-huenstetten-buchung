/**
 * Organization Configuration
 *
 * Hierarchy: Club → Department → Team → TrainerAssignment[]
 *
 * EVENT_TYPES is the single source of truth for booking/event type
 * definitions.
 */

import type { EventType, BookingType } from '../types';

// ---- Event Types (single source of truth) ----
export const EVENT_TYPES: EventType[] = [
  { id: 'training', label: 'Training', short: 'Tr.', icon: '🏃', color: '#3b82f6', description: 'Regelmäßiges Training', allowOverlap: false },
  { id: 'match', label: 'Heimspiel', short: 'Spiel', icon: '⚽', color: '#dc2626', description: 'Wettkampf oder Freundschaftsspiel', allowOverlap: false },
  { id: 'event', label: 'Event/Wettkampf', short: 'Event', icon: '🎉', color: '#8b5cf6', description: 'Turnier, Wettkampf, Sonderveranstaltung', allowOverlap: false },
  { id: 'other', label: 'Sonstiges', short: 'Sonst.', icon: '📋', color: '#6b7280', description: 'Besprechung, Wartung, etc.', allowOverlap: true },
];

// ---- Default Demo Data Types ----
interface DefaultClub {
  id: string;
  name: string;
  shortName: string;
  color: string;
  isHomeClub: boolean;
}

interface DefaultDepartment {
  id: string;
  clubId: string;
  name: string;
  icon: string;
  sortOrder: number;
}

interface DefaultTeam {
  id: string;
  departmentId: string;
  name: string;
  shortName: string;
  color: string;
  sortOrder: number;
  eventTypes: BookingType[];
}

interface DefaultTrainerAssignment {
  id: string;
  userId: number;
  teamId: string;
  isPrimary: boolean;
}

// ---- Default Demo Data ----
export const DEFAULT_CLUBS: DefaultClub[] = [
  { id: 'club-sgh', name: 'SG Hünstetten', shortName: 'SGH', color: '#2563eb', isHomeClub: true },
  { id: 'club-tvi', name: 'TV Idstein', shortName: 'TVI', color: '#dc2626', isHomeClub: false },
  { id: 'club-tsv', name: 'TSV Wallrabenstein', shortName: 'TSV', color: '#16a34a', isHomeClub: false },
];

export const DEFAULT_DEPARTMENTS: DefaultDepartment[] = [
  // --- SG Hünstetten ---
  { id: 'dept-fussball', clubId: 'club-sgh', name: 'Fußball', icon: '⚽', sortOrder: 1 },
  { id: 'dept-leichtathletik', clubId: 'club-sgh', name: 'Leichtathletik', icon: '🏃', sortOrder: 2 },
  { id: 'dept-yoga', clubId: 'club-sgh', name: 'Yoga', icon: '🧘‍♂️', sortOrder: 3 },
  { id: 'dept-tischtennis', clubId: 'club-sgh', name: 'Tischtennis', icon: '🏓', sortOrder: 4 },
  { id: 'dept-gymnastik', clubId: 'club-sgh', name: 'Gymnastik', icon: '🤸', sortOrder: 5 },
  { id: 'dept-seniorensport', clubId: 'club-sgh', name: 'Seniorensport', icon: '💪', sortOrder: 6 },
  // --- TV Idstein ---
  { id: 'dept-handball-tvi', clubId: 'club-tvi', name: 'Handball', icon: '🤾', sortOrder: 1 },
  // --- TSV Wallrabenstein ---
  { id: 'dept-fussball-tsv', clubId: 'club-tsv', name: 'Fußball', icon: '⚽', sortOrder: 1 },
];

export const DEFAULT_TEAMS: DefaultTeam[] = [
  // --- SG Hünstetten: Fußball ---
  { id: 'team-herren1', departmentId: 'dept-fussball', name: '1. Mannschaft (Herren)', shortName: 'Herren I', color: '#1e40af', sortOrder: 1, eventTypes: ['training', 'match'] },
  { id: 'team-herren2', departmentId: 'dept-fussball', name: '2. Mannschaft (Herren)', shortName: 'Herren II', color: '#3b82f6', sortOrder: 2, eventTypes: ['training', 'match'] },
  { id: 'team-a-jugend', departmentId: 'dept-fussball', name: 'A-Jugend', shortName: 'A-Jgd', color: '#60a5fa', sortOrder: 3, eventTypes: ['training', 'match'] },
  { id: 'team-b-jugend', departmentId: 'dept-fussball', name: 'B-Jugend', shortName: 'B-Jgd', color: '#93c5fd', sortOrder: 4, eventTypes: ['training', 'match'] },
  { id: 'team-f-jugend', departmentId: 'dept-fussball', name: 'F-Jugend', shortName: 'F-Jgd', color: '#bfdbfe', sortOrder: 5, eventTypes: ['training', 'match'] },
  // --- SG Hünstetten: Leichtathletik ---
  { id: 'team-la-6-8', departmentId: 'dept-leichtathletik', name: 'Leichtathletik 6–8 Jahre', shortName: 'LA 6-8', color: '#f97316', sortOrder: 1, eventTypes: ['training', 'event'] },
  { id: 'team-la-9-12', departmentId: 'dept-leichtathletik', name: 'Leichtathletik 9–12 Jahre', shortName: 'LA 9-12', color: '#fb923c', sortOrder: 2, eventTypes: ['training', 'event'] },
  // --- SG Hünstetten: Yoga ---
  { id: 'team-yoga-herren', departmentId: 'dept-yoga', name: 'Herren-Yoga', shortName: 'Yoga H', color: '#a855f7', sortOrder: 1, eventTypes: ['training'] },
  { id: 'team-yoga-mixed', departmentId: 'dept-yoga', name: 'Yoga Mixed', shortName: 'Yoga M', color: '#c084fc', sortOrder: 2, eventTypes: ['training'] },
  // --- SG Hünstetten: Tischtennis ---
  { id: 'team-tt-senioren', departmentId: 'dept-tischtennis', name: 'Tischtennis Senioren', shortName: 'TT Sen', color: '#0891b2', sortOrder: 1, eventTypes: ['training', 'match'] },
  // --- SG Hünstetten: Gymnastik ---
  { id: 'team-gymnastik', departmentId: 'dept-gymnastik', name: 'Gymnastikgruppe', shortName: 'Gym', color: '#e11d48', sortOrder: 1, eventTypes: ['training'] },
  // --- SG Hünstetten: Seniorensport ---
  { id: 'team-senioren', departmentId: 'dept-seniorensport', name: 'Seniorensport', shortName: 'Sen', color: '#65a30d', sortOrder: 1, eventTypes: ['training'] },
  // --- TV Idstein: Handball ---
  { id: 'team-handball-damen', departmentId: 'dept-handball-tvi', name: 'Handball Damen', shortName: 'HB Damen', color: '#dc2626', sortOrder: 1, eventTypes: ['training', 'match'] },
  // --- TSV Wallrabenstein: Fußball ---
  { id: 'team-tsv-herren', departmentId: 'dept-fussball-tsv', name: 'Herren', shortName: 'TSV H', color: '#16a34a', sortOrder: 1, eventTypes: ['training', 'match'] },
];

// Trainer assignments: maps a person (user) to a team
export const DEFAULT_TRAINER_ASSIGNMENTS: DefaultTrainerAssignment[] = [
  { id: 'ta-1', userId: 1, teamId: 'team-a-jugend', isPrimary: true },
  { id: 'ta-2', userId: 2, teamId: 'team-yoga-mixed', isPrimary: true },
  { id: 'ta-3', userId: 2, teamId: 'team-yoga-herren', isPrimary: true },
  { id: 'ta-4', userId: 3, teamId: 'team-herren1', isPrimary: true },
  { id: 'ta-5', userId: 4, teamId: 'team-f-jugend', isPrimary: true },
  { id: 'ta-6', userId: 5, teamId: 'team-senioren', isPrimary: true },
  { id: 'ta-7', userId: 6, teamId: 'team-herren1', isPrimary: false },
  { id: 'ta-8', userId: 7, teamId: 'team-handball-damen', isPrimary: true },
  { id: 'ta-9', userId: 8, teamId: 'team-tsv-herren', isPrimary: true },
];

// ---- ID Generator ----
export function generateOrgId(prefix: string): string {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
}
