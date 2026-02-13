// Organization Configuration
// Hierarchy: Verein -> Abteilung -> Gruppe/Mannschaft -> Trainer-Zuordnung[]

const UMLAUT_A = String.fromCharCode(228);
const UMLAUT_U = String.fromCharCode(252);
const UMLAUT_SS = String.fromCharCode(223);

// ---- Event Types per Group ----
export const EVENT_TYPES = [
  { id: 'training', label: 'Training', icon: String.fromCharCode(55357, 56131), color: '#3b82f6', description: 'Regelm' + UMLAUT_A + UMLAUT_SS + 'iges Training' },
  { id: 'match', label: 'Heimspiel', icon: String.fromCharCode(9917), color: '#dc2626', description: 'Wettkampf oder Freundschaftsspiel' },
  { id: 'event', label: 'Event/Wettkampf', icon: String.fromCharCode(55356, 57093), color: '#8b5cf6', description: 'Turnier, Wettkampf, Sonderveranstaltung' },
  { id: 'other', label: 'Sonstiges', icon: String.fromCharCode(55356, 56523), color: '#6b7280', description: 'Besprechung, Wartung, etc.' },
];

// ---- Default Demo Data ----
export const DEFAULT_CLUBS = [
  {
    id: 'club-sgh',
    name: 'SG H' + UMLAUT_U + 'nstetten',
    shortName: 'SGH',
    color: '#2563eb',
    isHomeClub: true,
  },
  {
    id: 'club-tvi',
    name: 'TV Idstein',
    shortName: 'TVI',
    color: '#dc2626',
    isHomeClub: false,
  },
  {
    id: 'club-tsv',
    name: 'TSV Wallrabenstein',
    shortName: 'TSV',
    color: '#16a34a',
    isHomeClub: false,
  },
];

export const DEFAULT_DEPARTMENTS = [
  // --- SG Hünstetten ---
  { id: 'dept-fussball', clubId: 'club-sgh', name: 'Fu' + UMLAUT_SS + 'ball', icon: String.fromCharCode(9917), sortOrder: 1 },
  { id: 'dept-leichtathletik', clubId: 'club-sgh', name: 'Leichtathletik', icon: String.fromCharCode(55357, 56131), sortOrder: 2 },
  { id: 'dept-yoga', clubId: 'club-sgh', name: 'Yoga', icon: String.fromCharCode(55358, 56839) + String.fromCharCode(8205, 9794, 65039), sortOrder: 3 },
  { id: 'dept-tischtennis', clubId: 'club-sgh', name: 'Tischtennis', icon: String.fromCharCode(55357, 56912), sortOrder: 4 },
  { id: 'dept-gymnastik', clubId: 'club-sgh', name: 'Gymnastik', icon: String.fromCharCode(55358, 56520), sortOrder: 5 },
  { id: 'dept-seniorensport', clubId: 'club-sgh', name: 'Seniorensport', icon: String.fromCharCode(55357, 56452), sortOrder: 6 },
  // --- TV Idstein ---
  { id: 'dept-handball-tvi', clubId: 'club-tvi', name: 'Handball', icon: String.fromCharCode(55358, 56468), sortOrder: 1 },
  // --- TSV Wallrabenstein ---
  { id: 'dept-fussball-tsv', clubId: 'club-tsv', name: 'Fu' + UMLAUT_SS + 'ball', icon: String.fromCharCode(9917), sortOrder: 1 },
];

export const DEFAULT_TEAMS = [
  // --- SG Hünstetten: Fußball ---
  { id: 'team-herren1', departmentId: 'dept-fussball', name: '1. Mannschaft (Herren)', shortName: 'Herren I', color: '#1e40af', sortOrder: 1,
    eventTypes: ['training', 'match'] },
  { id: 'team-herren2', departmentId: 'dept-fussball', name: '2. Mannschaft (Herren)', shortName: 'Herren II', color: '#3b82f6', sortOrder: 2,
    eventTypes: ['training', 'match'] },
  { id: 'team-a-jugend', departmentId: 'dept-fussball', name: 'A-Jugend', shortName: 'A-Jgd', color: '#60a5fa', sortOrder: 3,
    eventTypes: ['training', 'match'] },
  { id: 'team-b-jugend', departmentId: 'dept-fussball', name: 'B-Jugend', shortName: 'B-Jgd', color: '#93c5fd', sortOrder: 4,
    eventTypes: ['training', 'match'] },
  { id: 'team-f-jugend', departmentId: 'dept-fussball', name: 'F-Jugend', shortName: 'F-Jgd', color: '#bfdbfe', sortOrder: 5,
    eventTypes: ['training', 'match'] },
  // --- SG Hünstetten: Leichtathletik ---
  { id: 'team-la-6-8', departmentId: 'dept-leichtathletik', name: 'Leichtathletik 6' + String.fromCharCode(8211) + '8 Jahre', shortName: 'LA 6-8', color: '#f97316', sortOrder: 1,
    eventTypes: ['training', 'event'] },
  { id: 'team-la-9-12', departmentId: 'dept-leichtathletik', name: 'Leichtathletik 9' + String.fromCharCode(8211) + '12 Jahre', shortName: 'LA 9-12', color: '#fb923c', sortOrder: 2,
    eventTypes: ['training', 'event'] },
  // --- SG Hünstetten: Yoga ---
  { id: 'team-yoga-herren', departmentId: 'dept-yoga', name: 'Herren-Yoga', shortName: 'Yoga H', color: '#a855f7', sortOrder: 1,
    eventTypes: ['training'] },
  { id: 'team-yoga-mixed', departmentId: 'dept-yoga', name: 'Yoga Mixed', shortName: 'Yoga M', color: '#c084fc', sortOrder: 2,
    eventTypes: ['training'] },
  // --- SG Hünstetten: Tischtennis ---
  { id: 'team-tt-senioren', departmentId: 'dept-tischtennis', name: 'Tischtennis Senioren', shortName: 'TT Sen', color: '#0891b2', sortOrder: 1,
    eventTypes: ['training', 'match'] },
  // --- SG Hünstetten: Gymnastik ---
  { id: 'team-gymnastik', departmentId: 'dept-gymnastik', name: 'Gymnastikgruppe', shortName: 'Gym', color: '#e11d48', sortOrder: 1,
    eventTypes: ['training'] },
  // --- SG Hünstetten: Seniorensport ---
  { id: 'team-senioren', departmentId: 'dept-seniorensport', name: 'Seniorensport', shortName: 'Sen', color: '#65a30d', sortOrder: 1,
    eventTypes: ['training'] },
  // --- TV Idstein: Handball ---
  { id: 'team-handball-damen', departmentId: 'dept-handball-tvi', name: 'Handball Damen', shortName: 'HB Damen', color: '#dc2626', sortOrder: 1,
    eventTypes: ['training', 'match'] },
  // --- TSV Wallrabenstein: Fußball ---
  { id: 'team-tsv-herren', departmentId: 'dept-fussball-tsv', name: 'Herren', shortName: 'TSV H', color: '#16a34a', sortOrder: 1,
    eventTypes: ['training', 'match'] },
];

// Trainer assignments: maps a person (user) to a team
// A trainer can coach multiple teams; a team can have multiple trainers
export const DEFAULT_TRAINER_ASSIGNMENTS = [
  // Max Müller -> A-Jugend
  { id: 'ta-1', userId: 1, teamId: 'team-a-jugend', isPrimary: true },
  // Anna Schmidt -> Yoga Mixed
  { id: 'ta-2', userId: 2, teamId: 'team-yoga-mixed', isPrimary: true },
  // Anna Schmidt -> Herren-Yoga
  { id: 'ta-3', userId: 2, teamId: 'team-yoga-herren', isPrimary: true },
  // Tom Weber -> Herren 1
  { id: 'ta-4', userId: 3, teamId: 'team-herren1', isPrimary: true },
  // Lisa Braun -> F-Jugend
  { id: 'ta-5', userId: 4, teamId: 'team-f-jugend', isPrimary: true },
  // Hans Meier -> Seniorensport
  { id: 'ta-6', userId: 5, teamId: 'team-senioren', isPrimary: true },
  // Peter König (Admin) -> Herren 1 (Co-Trainer)
  { id: 'ta-7', userId: 6, teamId: 'team-herren1', isPrimary: false },
  // Sandra Fischer -> Handball Damen (extern)
  { id: 'ta-8', userId: 7, teamId: 'team-handball-damen', isPrimary: true },
  // Michael Wagner -> TSV Herren (extern)
  { id: 'ta-9', userId: 8, teamId: 'team-tsv-herren', isPrimary: true },
];

// ---- ID Generator (shared with facilityConfig) ----
export function generateOrgId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
}
