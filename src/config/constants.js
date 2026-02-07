// Ressourcen-Konfiguration
export const RESOURCES = [
  { id: 'sportplatz-ganz', name: 'Sportplatz - komplett', type: 'regular', category: 'outdoor', color: '#15803d', isComposite: true, includes: ['sportplatz-links', 'sportplatz-rechts'] },
  { id: 'sportplatz-links', name: 'Sportplatz - links', type: 'regular', category: 'outdoor', color: '#22c55e', partOf: 'sportplatz-ganz' },
  { id: 'sportplatz-rechts', name: 'Sportplatz - rechts', type: 'regular', category: 'outdoor', color: '#16a34a', partOf: 'sportplatz-ganz' },
  { id: 'kleinfeld', name: 'Fußball-Kleinfeld', type: 'regular', category: 'outdoor', color: '#84cc16' },
  { id: 'gymnastik', name: 'Gymnastikraum', type: 'regular', category: 'indoor', color: '#8b5cf6' },
  { id: 'fitness', name: 'Fitnessraum', type: 'regular', category: 'indoor', color: '#a855f7' },
  { id: 'gastronomie', name: 'Vereinsgastronomie', type: 'regular', category: 'indoor', color: '#f59e0b' },
  { id: 'halle-gross', name: 'Große Mehrzweckhalle', type: 'limited', category: 'shared', color: '#ef4444' },
  { id: 'halle-klein', name: 'Kleine Mehrzweckhalle', type: 'limited', category: 'shared', color: '#f97316' },
];

export const BOOKING_TYPES = [
  { id: 'training', label: 'Training', icon: '🏃', color: '#3b82f6', description: 'Regelmäßiges Training', allowOverlap: false },
  { id: 'match', label: 'Spiel', icon: '⚽', color: '#dc2626', description: 'Wettkampf oder Freundschaftsspiel', allowOverlap: false },
  { id: 'event', label: 'Veranstaltung', icon: '🎉', color: '#8b5cf6', description: 'Turnier, Fest, Sonderveranstaltung', allowOverlap: false },
  { id: 'other', label: 'Sonstiges', icon: '📋', color: '#6b7280', description: 'Besprechung, Wartung, etc.', allowOverlap: true },
];

export const ROLES = [
  { id: 'admin', label: 'Administrator', color: '#dc2626', description: 'Volle Rechte: Buchungen, Genehmigungen, Benutzerverwaltung' },
  { id: 'trainer', label: 'Trainer', color: '#2563eb', description: 'Eigene Buchungen erstellen und verwalten' },
  { id: 'extern', label: 'Extern', color: '#6b7280', description: 'Nur Anfragen stellen (müssen genehmigt werden)' },
];

export const DEMO_USERS = [
  { id: 1, firstName: 'Max', lastName: 'Müller', club: 'SG Hünstetten', team: 'A-Jugend', email: 'max.mueller@sg-huenstetten.de', phone: '0171-1234567', role: 'trainer' },
  { id: 2, firstName: 'Anna', lastName: 'Schmidt', club: 'SG Hünstetten', team: 'Yoga', email: 'anna.schmidt@sg-huenstetten.de', phone: '0172-2345678', role: 'trainer' },
  { id: 3, firstName: 'Tom', lastName: 'Weber', club: 'SG Hünstetten', team: '1. Mannschaft', email: 'tom.weber@sg-huenstetten.de', phone: '0173-3456789', role: 'trainer' },
  { id: 4, firstName: 'Lisa', lastName: 'Braun', club: 'SG Hünstetten', team: 'F-Jugend', email: 'lisa.braun@sg-huenstetten.de', phone: '0174-4567890', role: 'trainer' },
  { id: 5, firstName: 'Hans', lastName: 'Meier', club: 'SG Hünstetten', team: 'Seniorensport', email: 'hans.meier@sg-huenstetten.de', phone: '0175-5678901', role: 'trainer' },
  { id: 6, firstName: 'Peter', lastName: 'König', club: 'SG Hünstetten', team: '1. Mannschaft', email: 'peter.koenig@sg-huenstetten.de', phone: '0176-6789012', role: 'admin' },
  { id: 7, firstName: 'Sandra', lastName: 'Fischer', club: 'TV Idstein', team: 'Handball', email: 'sandra.fischer@tv-idstein.de', phone: '0177-7890123', role: 'extern' },
  { id: 8, firstName: 'Michael', lastName: 'Wagner', club: 'TSV Wallrabenstein', team: 'Fußball', email: 'm.wagner@tsv-wallrabenstein.de', phone: '0178-8901234', role: 'extern' },
];

export const DEMO_BOOKINGS = [
  { id: 1, resourceId: 'sportplatz-links', date: '2026-02-10', startTime: '16:00', endTime: '18:00', title: 'A-Jugend Training', bookingType: 'training', userId: 1, status: 'approved', seriesId: 'series-1' },
  { id: 2, resourceId: 'gymnastik', date: '2026-02-10', startTime: '19:00', endTime: '20:30', title: 'Yoga Kurs', bookingType: 'training', userId: 2, status: 'approved', seriesId: 'series-2' },
  { id: 3, resourceId: 'halle-gross', date: '2026-02-10', startTime: '18:00', endTime: '20:00', title: 'Hallenfußball', bookingType: 'training', userId: 3, status: 'pending', seriesId: 'series-3' },
  { id: 4, resourceId: 'kleinfeld', date: '2026-02-11', startTime: '15:00', endTime: '17:00', title: 'F-Jugend Training', bookingType: 'training', userId: 4, status: 'pending' },
  { id: 5, resourceId: 'fitness', date: '2026-02-12', startTime: '10:00', endTime: '11:30', title: 'Seniorensport', bookingType: 'training', userId: 5, status: 'approved' },
  { id: 6, resourceId: 'sportplatz-ganz', date: '2026-02-15', startTime: '14:00', endTime: '17:00', title: 'Heimspiel 1. Mannschaft', bookingType: 'match', userId: 6, status: 'approved' },
];

export const DEMO_SLOTS = [
  { id: 1, resourceId: 'halle-gross', dayOfWeek: 1, startTime: '17:00', endTime: '21:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 2, resourceId: 'halle-gross', dayOfWeek: 3, startTime: '18:00', endTime: '22:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 3, resourceId: 'halle-gross', dayOfWeek: 6, startTime: '09:00', endTime: '14:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 4, resourceId: 'halle-klein', dayOfWeek: 2, startTime: '16:00', endTime: '20:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 5, resourceId: 'halle-klein', dayOfWeek: 4, startTime: '17:00', endTime: '21:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
];

export const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const DAYS_FULL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
