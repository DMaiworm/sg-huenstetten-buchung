/**
 * Shared Type Definitions – Zentrale Typen für das gesamte Projekt.
 *
 * Abgeleitet aus den Mapper-Funktionen in den Domain-Hooks.
 */

// ─── Utility Types ──────────────────────────────────────────

export interface DbResult<T> {
  data: T | null;
  error: string | null;
}

export interface DbDeleteResult {
  error: string | null;
}

// ─── Enums / Union Types ────────────────────────────────────

export type BookingStatus = 'pending' | 'approved' | 'rejected';
export type BookingMode = 'single' | 'recurring';
export type BookingType = 'training' | 'match' | 'event' | 'other';
export type HolidayType = 'feiertag' | 'schulferien';
export type ResourceBookingMode = 'free' | 'slotOnly';
export type ResourceGroupIcon = 'outdoor' | 'indoor' | 'shared';
export type ResourceType = 'regular' | 'limited';
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

// ─── Booking ────────────────────────────────────────────────

export interface Booking {
  id: string;
  resourceId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  bookingType: BookingType;
  userId: string;
  teamId: string | null;
  status: BookingStatus;
  seriesId: string | null;
  parentBooking: boolean;
}

export interface BookingCreateData {
  resourceId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  bookingType: BookingType;
  userId: string;
  teamId?: string | null;
  status?: BookingStatus;
  seriesId?: string | null;
  parentBooking?: boolean;
}

export interface BookingUpdates {
  title?: string;
  description?: string;
  bookingType?: BookingType;
  date?: string;
  startTime?: string;
  endTime?: string;
  resourceId?: string;
  teamId?: string | null;
  status?: BookingStatus;
}

// ─── Facilities / Resources ─────────────────────────────────

export interface Facility {
  id: string;
  name: string;
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  sortOrder: number;
}

export interface FacilityCreateData {
  name: string;
  street?: string;
  houseNumber?: string;
  zip?: string;
  city?: string;
  sortOrder?: number;
  operatorId?: string;
}

export interface ResourceGroup {
  id: string;
  facilityId: string;
  name: string;
  icon: ResourceGroupIcon;
  sortOrder: number;
  sharedScheduling: boolean;
}

export interface ResourceGroupCreateData {
  facilityId: string;
  name: string;
  icon?: ResourceGroupIcon;
  sortOrder?: number;
  sharedScheduling?: boolean;
}

export interface SubResource {
  id: string;
  name: string;
  color: string;
}

export interface Resource {
  id: string;
  groupId: string;
  name: string;
  color: string;
  splittable: boolean;
  bookingMode: ResourceBookingMode;
  subResources: SubResource[];
}

export interface ResourceCreateData {
  groupId: string;
  name: string;
  color?: string;
  splittable?: boolean;
  bookingMode?: ResourceBookingMode;
  parentResourceId?: string | null;
  sortOrder?: number;
}

export interface ResourceUpdateData extends ResourceCreateData {
  id: string;
  subResources?: SubResource[];
}

export interface BookableResource {
  id: string;
  name: string;
  type: ResourceType;
  category: ResourceGroupIcon;
  groupId: string;
  color: string;
  isComposite?: boolean;
  includes?: string[];
  partOf?: string;
}

export interface Slot {
  id: string;
  resourceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom: string | null;
  validUntil: string | null;
}

export interface SlotCreateData {
  resourceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom?: string | null;
  validUntil?: string | null;
}

// ─── Organization ───────────────────────────────────────────

export interface Club {
  id: string;
  name: string;
  shortName: string;
  color: string;
  isHomeClub: boolean;
}

export interface ClubCreateData {
  name: string;
  shortName?: string;
  color?: string;
  isHomeClub?: boolean;
}

export interface Department {
  id: string;
  clubId: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface DepartmentCreateData {
  clubId: string;
  name: string;
  icon?: string | null;
  sortOrder?: number;
}

export interface Team {
  id: string;
  departmentId: string;
  name: string;
  shortName: string;
  color: string;
  sortOrder: number;
  eventTypes: BookingType[];
  istJugendmannschaft: boolean;
}

export interface TeamCreateData {
  departmentId: string;
  name: string;
  shortName?: string;
  color?: string;
  sortOrder?: number;
  eventTypes?: BookingType[];
  istJugendmannschaft?: boolean;
}

export interface TrainerAssignment {
  id: string;
  userId: string;
  teamId: string;
  isPrimary: boolean;
}

// ─── User / Profile ─────────────────────────────────────────

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  operatorId: string | null;
  isPassive: boolean;
  invitedAt: string | null;
  istTrainer: boolean;
  kannBuchen: boolean;
  kannGenehmigen: boolean;
  kannVerwalten: boolean;
  kannAdministrieren: boolean;
  stammvereinId: string | null;
  stammvereinAndere: string | null;
}

export interface UserCreateData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  operatorId?: string | null;
  isPassive?: boolean;
  istTrainer?: boolean;
  kannBuchen?: boolean;
  kannGenehmigen?: boolean;
  kannVerwalten?: boolean;
  kannAdministrieren?: boolean;
  stammvereinId?: string | null;
  stammvereinAndere?: string | null;
}

/** Profile direkt aus der DB (snake_case) – wie in AuthContext.profile */
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  operator_id: string | null;
  is_passive: boolean;
  invited_at: string | null;
  ist_trainer: boolean;
  kann_buchen: boolean;
  kann_genehmigen: boolean;
  kann_verwalten: boolean;
  kann_administrieren: boolean;
  stammverein_id: string | null;
  stammverein_andere: string | null;
}

// ─── Operator ───────────────────────────────────────────────

export interface Operator {
  id: string;
  name: string;
}

// ─── Holidays ───────────────────────────────────────────────

export interface Holiday {
  id: string;
  name: string;
  type: HolidayType;
  startDate: string;
  endDate: string;
  year: number;
}

export interface HolidayCreateData {
  name: string;
  type: HolidayType;
  startDate: string;
  endDate: string;
  year: number;
}

// ─── Genehmiger Resource Assignment ─────────────────────────

export interface GenehmigerResourceAssignment {
  id: string;
  user_id: string;
  resource_id: string;
}

// ─── Trainer ────────────────────────────────────────────────

export interface TrainerProfileDetails {
  id: string;
  bio: string;
  photoUrl: string | null;
  iban: string;
  chipId: string;
  fuehrungszeugnisUrl: string | null;
  fuehrungszeugnisVerified: boolean;
  fuehrungszeugnisDate: string | null;
  verhaltenskodexUrl: string | null;
  verhaltenskodexVerified: boolean;
  unterlagenVollstaendig: boolean;
  notizen: string;
  profilVeroeffentlichen: boolean;
  kontaktVeroeffentlichen: boolean;
  adresseStrasse: string;
  adressePlz: string;
  adresseOrt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainerProfileUpsertData {
  bio?: string | null;
  photoUrl?: string | null;
  iban?: string | null;
  profilVeroeffentlichen?: boolean;
  kontaktVeroeffentlichen?: boolean;
  adresseStrasse?: string | null;
  adressePlz?: string | null;
  adresseOrt?: string | null;
}

export interface TrainerLizenz {
  id: string;
  trainerId: string;
  bezeichnung: string;
  ausstellendeOrg: string;
  ausstellungsdatum: string | null;
  ablaufdatum: string | null;
  createdAt: string;
}

export interface TrainerLizenzCreateData {
  bezeichnung: string;
  ausstellendeOrg?: string;
  ausstellungsdatum?: string | null;
  ablaufdatum?: string | null;
}

export interface TrainerErfolg {
  id: string;
  trainerId: string;
  jahr: number;
  mannschaft: string;
  titel: string;
  sortOrder: number;
  createdAt: string;
}

export interface TrainerErfolgCreateData {
  jahr: number;
  mannschaft: string;
  titel: string;
  sortOrder?: number;
}

/** Trainer in der Admin-Verwaltung (mit Details, Lizenzen, Erfolgen) */
export interface TrainerVerwaltungEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  operatorId: string | null;
  invitedAt: string | null;
  kannBuchen: boolean;
  kannGenehmigen: boolean;
  kannAdministrieren: boolean;
  details: TrainerVerwaltungDetails | null;
  lizenzen: TrainerLizenzPublic[];
  erfolge: TrainerErfolgPublic[];
}

export interface TrainerVerwaltungDetails {
  bio: string;
  photoUrl: string | null;
  iban: string;
  chipId: string;
  fuehrungszeugnisUrl: string | null;
  fuehrungszeugnisVerified: boolean;
  fuehrungszeugnisDate: string | null;
  verhaltenskodexUrl: string | null;
  verhaltenskodexVerified: boolean;
  unterlagenVollstaendig: boolean;
  notizen: string;
}

export interface TrainerAdminFieldsUpdate {
  chipId?: string | null;
  fuehrungszeugnisVerified?: boolean;
  fuehrungszeugnisDate?: string | null;
  verhaltenskodexVerified?: boolean;
  unterlagenVollstaendig?: boolean;
  notizen?: string | null;
}

/** Trainer-Lizenz ohne trainerId (in embedded Trainer-Objekten) */
export interface TrainerLizenzPublic {
  id: string;
  bezeichnung: string;
  ausstellendeOrg: string;
  ausstellungsdatum: string | null;
  ablaufdatum: string | null;
}

/** Trainer-Erfolg ohne trainerId (in embedded Trainer-Objekten) */
export interface TrainerErfolgPublic {
  id: string;
  jahr: number;
  mannschaft: string;
  titel: string;
  sortOrder: number;
}

/** Trainer in der Intranet-Übersicht (öffentliche Daten) */
export interface TrainerUebersichtEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  photoUrl: string | null;
  lizenzen: TrainerLizenzPublic[];
  erfolge: TrainerErfolgPublic[];
}

// ─── Toast ──────────────────────────────────────────────────

export interface Toast {
  id: number;
  message: string;
  type: ToastVariant;
}

// ─── Email ──────────────────────────────────────────────────

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export interface SentEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  status: string;
  sentAt: string;
  errorMessage: string | null;
}

// ─── Config Types ───────────────────────────────────────────

export interface EventType {
  id: BookingType;
  label: string;
  short: string;
  icon: string;
  color: string;
  description: string;
  allowOverlap: boolean;
}

export interface RoleConfig {
  id: string;
  label: string;
  color: string;
  description: string;
}

export interface GroupIconConfig {
  id: ResourceGroupIcon;
  label: string;
  emoji: string;
}

export interface FormClasses {
  input: string;
  label: string;
  section: string;
}

// ─── Conflict Detection ────────────────────────────────────

export type ConflictSeverity = 'error' | 'warning';
export type ConflictType = 'no_slot' | 'outside_slot' | 'time_overlap' | 'composite_blocked' | 'parent_blocked';

export interface ConflictObject {
  type: ConflictType;
  message: string;
  severity: ConflictSeverity;
  booking?: Booking;
  existingType?: EventType;
  explanation?: string;
  slot?: Slot;
}

export interface DateConflicts {
  date: string;
  conflicts: ConflictObject[];
}

// ─── Series Container ──────────────────────────────────────

export interface BookingWithConflicts extends Booking {
  conflicts: Booking[];
}

export interface SeriesContainer extends Booking {
  seriesBookings: BookingWithConflicts[];
  totalCount: number;
  freeCount: number;
  blockedCount: number;
}

// ─── Confirm Dialog ─────────────────────────────────────────

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

// ─── New Booking Handler Data ──────────────────────────────

export interface NewBookingData {
  resourceId: string;
  dates: string[];
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  bookingType: BookingType;
  userId: string;
  teamId?: string | null;
  isComposite?: boolean;
  includedResources?: string[];
}

// ─── Holiday Info (returned by getDateHolidayInfo) ──────────

export interface DateHolidayInfo {
  feiertag: string | null;
  schulferien: string | null;
}

// ─── Team Org Label (returned by getTeamOrgLabel) ───────────

export interface TeamOrgLabel {
  teamName: string;
  departmentName: string;
  clubName: string;
  label: string;
}
