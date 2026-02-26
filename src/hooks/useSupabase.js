/**
 * Barrel-Re-Export für alle Supabase-Hooks.
 *
 * Die eigentliche Logik liegt in den jeweiligen Hook-Dateien:
 *   useUsers.js            – Profile / Nutzerverwaltung
 *   useOperators.js        – Betreiber
 *   useFacilities.js       – Anlagen, Gruppen, Ressourcen, Slots
 *   useOrganization.js     – Vereine, Abteilungen, Mannschaften, Trainer
 *   useBookings.js         – Buchungen
 *   useGenehmigerResources.js – Genehmiger-Ressourcen-Zuweisungen
 *   useHolidays.js         – Ferien & Feiertage
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
