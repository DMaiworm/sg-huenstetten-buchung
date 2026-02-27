import { UserX, Clock, CheckCircle } from 'lucide-react';

export const PERMISSIONS = [
  { key: 'istTrainer',         label: 'Trainer',     description: 'Erscheint als Trainer bei Mannschaften',                      color: '#2563eb' },
  { key: 'kannBuchen',         label: 'Buchen',      description: 'Darf Buchungsanfragen stellen',                               color: '#16a34a' },
  { key: 'kannGenehmigen',     label: 'Genehmigen',  description: 'Darf Anfragen genehmigen (eigene: auto-approved)',            color: '#7c3aed' },
  { key: 'kannVerwalten',      label: 'Verwalten',   description: 'Tagesbetrieb: Trainerverwaltung, E-Mail-Log, PDF-Export',     color: '#ea580c' },
  { key: 'kannAdministrieren', label: 'Admin',       description: 'System-Setup: Benutzer, Anlagen, Organisation, Feiertage',   color: '#dc2626' },
];

export const emptyUser = {
  firstName: '', lastName: '', email: '', phone: '', operatorId: '',
  isPassive: false, istTrainer: false, kannBuchen: false, kannGenehmigen: false, kannVerwalten: false, kannAdministrieren: false,
  stammvereinId: null, stammvereinAndere: null,
};

export function trainerStatus(user) {
  if (!user.istTrainer) return null;
  if (user.kannBuchen && !user.isPassive) return 'aktiv';
  if (user.invitedAt) return 'eingeladen';
  return 'passiv';
}

export const STATUS_CONFIG = {
  passiv:     { label: 'Passiv',      color: '#6b7280', bg: '#f3f4f6', icon: UserX },
  eingeladen: { label: 'Eingeladen',  color: '#d97706', bg: '#fef3c7', icon: Clock },
  aktiv:      { label: 'Aktiv',       color: '#16a34a', bg: '#dcfce7', icon: CheckCircle },
};
