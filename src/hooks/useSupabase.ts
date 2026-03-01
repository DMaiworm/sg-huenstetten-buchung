/**
 * Barrel-Re-Export für alle Supabase-Hooks.
 *
 * Die eigentliche Logik liegt in den jeweiligen Hook-Dateien:
 *   useUsers.ts            – Profile / Nutzerverwaltung
 *   useOperators.ts        – Betreiber
 *   useFacilities.ts       – Anlagen, Gruppen, Ressourcen, Slots
 *   useOrganization.ts     – Vereine, Abteilungen, Mannschaften, Trainer
 *   useBookings.ts         – Buchungen
 *   useGenehmigerResources.ts – Genehmiger-Ressourcen-Zuweisungen
 *   useHolidays.ts         – Ferien & Feiertage
 *
 * Nutzung (unverändert):
 *   import { useBookings } from '../hooks/useSupabase';
 */

export { useUsers }              from './useUsers';
export { useOperators }          from './useOperators';
export { useFacilities }         from './useFacilities';
export { useOrganization }       from './useOrganization';
export { useBookings }           from './useBookings';
export { useGenehmigerResources } from './useGenehmigerResources';
export { useHolidays }           from './useHolidays';
