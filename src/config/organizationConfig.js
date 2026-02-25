/**
 * Organization Configuration
 *
 * Hierarchy: Club \u2192 Department \u2192 Team \u2192 TrainerAssignment[]
 *
 * EVENT_TYPES is the single source of truth for booking/event type
 * definitions.
 */

// ---- Event Types (single source of truth) ----
export const EVENT_TYPES = [
  { id: 'training', label: 'Training', short: 'Tr.', icon: '\uD83C\uDFC3', color: '#3b82f6', description: 'Regelm\u00e4\u00dfiges Training', allowOverlap: false },
  { id: 'match', label: 'Heimspiel', short: 'Spiel', icon: '\u26BD', color: '#dc2626', description: 'Wettkampf oder Freundschaftsspiel', allowOverlap: false },
  { id: 'event', label: 'Event/Wettkampf', short: 'Event', icon: '\uD83C\uDF89', color: '#8b5cf6', description: 'Turnier, Wettkampf, Sonderveranstaltung', allowOverlap: false },
  { id: 'other', label: 'Sonstiges', short: 'Sonst.', icon: '\uD83D\uDCCB', color: '#6b7280', description: 'Besprechung, Wartung, etc.', allowOverlap: true },
];

// ---- Default Demo Data ----
export const DEFAULT_CLUBS = [
  { id: 'club-sgh', name: 'SG H\u00fcnstetten', shortName: 'SGH', color: '#2563eb', isHomeClub: true },
  { id: 'club-tvi', name: 'TV Idstein', shortName: 'TVI', color: '#dc2626', isHomeClub: false },
  { id: 'club-tsv', name: 'TSV Wallrabenstein', shortName: 'TSV', color: '#16a34a', isHomeClub: false },
];

export const DEFAULT_DEPARTMENTS = [
  // --- SG H\u00fcnstetten ---
  { id: 'dept-fussball', clubId: 'club-sgh', name: 'Fu\u00dfball', icon: '\u26BD', sortOrder: 1 },
  { id: 'dept-leichtathletik', clubId: 'club-sgh', name: 'Leichtathletik', icon: '\uD83C\uDFC3', sortOrder: 2 },
  { id: 'dept-yoga', clubId: 'club-sgh', name: 'Yoga', icon: '\uD83E\uDDD8\u200D\u2642\uFE0F', sortOrder: 3 },
  { id: 'dept-tischtennis', clubId: 'club-sgh', name: 'Tischtennis', icon: '\uD83C\uDFD3', sortOrder: 4 },
  { id: 'dept-gymnastik', clubId: 'club-sgh', name: 'Gymnastik', icon: '\uD83E\uDD38', sortOrder: 5 },
  { id: 'dept-seniorensport', clubId: 'club-sgh', name: 'Seniorensport', icon: '\uD83D\uDCAA', sortOrder: 6 },
  // --- TV Idstein ---
  { id: 'dept-handball-tvi', clubId: 'club-tvi', name: 'Handball', icon: '\uD83E\uDD3E', sortOrder: 1 },
  // --- TSV Wallrabenstein ---
  { id: 'dept-fussball-tsv', clubId: 'club-tsv', name: 'Fu\u00dfball', icon: '\u26BD', sortOrder: 1 },
];

export const DEFAULT_TEAMS = [
  // --- SG H\u00fcnstetten: Fu\u00dfball ---
  { id: 'team-herren1', departmentId: 'dept-fussball', name: '1. Mannschaft (Herren)', shortName: 'Herren I', color: '#1e40af', sortOrder: 1, eventTypes: ['training', 'match'] },
  { id: 'team-herren2', departmentId: 'dept-fussball', name: '2. Mannschaft (Herren)', shortName: 'Herren II', color: '#3b82f6', sortOrder: 2, eventTypes: ['training', 'match'] },
  { id: 'team-a-jugend', departmentId: 'dept-fussball', name: 'A-Jugend', shortName: 'A-Jgd', color: '#60a5fa', sortOrder: 3, eventTypes: ['training', 'match'] },
  { id: 'team-b-jugend', departmentId: 'dept-fussball', name: 'B-Jugend', shortName: 'B-Jgd', color: '#93c5fd', sortOrder: 4, eventTypes: ['training', 'match'] },
  { id: 'team-f-jugend', departmentId: 'dept-fussball', name: 'F-Jugend', shortName: 'F-Jgd', color: '#bfdbfe', sortOrder: 5, eventTypes: ['training', 'match'] },
  // --- SG H\u00fcnstetten: Leichtathletik ---
  { id: 'team-la-6-8', departmentId: 'dept-leichtathletik', name: 'Leichtathletik 6\u20138 Jahre', shortName: 'LA 6-8', color: '#f97316', sortOrder: 1, eventTypes: ['training', 'event'] },
  { id: 'team-la-9-12', departmentId: 'dept-leichtathletik', name: 'Leichtathletik 9\u201312 Jahre', shortName: 'LA 9-12', color: '#fb923c', sortOrder: 2, eventTypes: ['training', 'event'] },
  // --- SG H\u00fcnstetten: Yoga ---
  { id: 'team-yoga-herren', departmentId: 'dept-yoga', name: 'Herren-Yoga', shortName: 'Yoga H', color: '#a855f7', sortOrder: 1, eventTypes: ['training'] },
  { id: 'team-yoga-mixed', departmentId: 'dept-yoga', name: 'Yoga Mixed', shortName: 'Yoga M', color: '#c084fc', sortOrder: 2, eventTypes: ['training'] },
  // --- SG H\u00fcnstetten: Tischtennis ---
  { id: 'team-tt-senioren', departmentId: 'dept-tischtennis', name: 'Tischtennis Senioren', shortName: 'TT Sen', color: '#0891b2', sortOrder: 1, eventTypes: ['training', 'match'] },
  // --- SG H\u00fcnstetten: Gymnastik ---
  { id: 'team-gymnastik', departmentId: 'dept-gymnastik', name: 'Gymnastikgruppe', shortName: 'Gym', color: '#e11d48', sortOrder: 1, eventTypes: ['training'] },
  // --- SG H\u00fcnstetten: Seniorensport ---
  { id: 'team-senioren', departmentId: 'dept-seniorensport', name: 'Seniorensport', shortName: 'Sen', color: '#65a30d', sortOrder: 1, eventTypes: ['training'] },
  // --- TV Idstein: Handball ---
  { id: 'team-handball-damen', departmentId: 'dept-handball-tvi', name: 'Handball Damen', shortName: 'HB Damen', color: '#dc2626', sortOrder: 1, eventTypes: ['training', 'match'] },
  // --- TSV Wallrabenstein: Fu\u00dfball ---
  { id: 'team-tsv-herren', departmentId: 'dept-fussball-tsv', name: 'Herren', shortName: 'TSV H', color: '#16a34a', sortOrder: 1, eventTypes: ['training', 'match'] },
];

// Trainer assignments: maps a person (user) to a team
export const DEFAULT_TRAINER_ASSIGNMENTS = [
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
export function generateOrgId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
}
