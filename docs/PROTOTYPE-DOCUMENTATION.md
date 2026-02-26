# SG Hünstetten – Ressourcen-Buchungssystem

## Systemdokumentation (Stand: 26.02.2026)

> **Zweck dieses Dokuments:** Vollständige Beschreibung des Systems als "Source of Truth" für die weitere Entwicklung. Alle Entitäten, Beziehungen, Geschäftsregeln und UI-Seiten sind hier dokumentiert.

---

## 1. Systemübersicht

### 1.1 Zweck

Webbasiertes Buchungssystem für Sportanlagen und -räume. Ermöglicht Vereinen, Abteilungen und Mannschaften die Reservierung von Ressourcen (Sportplätze, Hallen, Räume) über eine zentrale Oberfläche mit rollenbasiertem Zugriff und Genehmigungsworkflow.

### 1.2 Kernkonzepte

Das System besteht aus **drei unabhängigen Verwaltungsbereichen**, die über Buchungen verknüpft werden:

| Bereich | Beschreibung | Admin-Seite |
|---------|-------------|-------------|
| **Anlagenverwaltung** | Physische Orte, Ressourcengruppen, Einzelressourcen, Slots | Anlagenverwaltung |
| **Organisationsverwaltung** | Vereine, Abteilungen, Mannschaften, Trainer-Zuordnungen | Organisation |
| **Benutzerverwaltung** | Benutzerkonten mit Rollen, Einladungen, Genehmiger-Zuweisungen | Benutzerverwaltung |

### 1.3 Technologie-Stack

| Schicht | Technologie |
|---------|------------|
| Frontend | React 18.2, React Router 6.23 |
| Styling | Tailwind CSS (CDN) |
| Icons | Lucide React |
| Backend/DB | Supabase (PostgreSQL, Auth, Row Level Security) |
| Auth | Supabase Auth (E-Mail/Passwort, einladungsbasiert) |
| PDF | jsPDF (on-demand CDN-Load) |
| Hosting | Vercel (Auto-Deploy bei Push auf `main`) |
| State | React Contexts (Auth, Facility, Organization, Booking, User, Holiday, Toast) |
| Repository | `DMaiworm/sg-huenstetten-buchung` (Branch: main) |

---

## 2. Datenmodell

### 2.1 Datenbankschema (Supabase/PostgreSQL)

Die Datenbank wurde über mehrere Migrationen aufgebaut:

| Migration | Datei | Inhalt |
|-----------|-------|--------|
| 001 | `001_operators_and_profiles.sql` | Operator-Tabelle + Profiles (Users) mit UUID-PKs |
| 002 | `002_prototype_mode.sql` | Prototype-Mode Flags |
| 003 | `003_facilities_and_resources.sql` | Facilities, ResourceGroups, Resources, SubResources, Slots + Seed-Daten |
| 004 | `004_organization.sql` | Clubs, Departments, Teams, TrainerAssignments + Seed-Daten |
| 005 | `005_bookings.sql` | Bookings-Tabelle mit ENUMs + Konflikterkennung-Funktion + Seed-Daten |
| 006 | `006_fix_sub_resources_as_bookable.sql` | Sub-Resources als reguläre Resources mit `parent_resource_id` (FK-Fix) |
| 007 | `007_drop_deprecated_sub_resources.sql` | Drop der veralteten `sub_resources`-Tabelle |
| 008 | `008_holidays.sql` | `holidays`-Tabelle (Ferien & Feiertage) |
| 009 | `009_sent_emails.sql` | `sent_emails`-Tabelle (E-Mail-Log) |
| 010 | `010_jfv_trainer_profiles.sql` | JFV Trainer-Profile Seed-Daten |
| 011 | `011_bookings_team_id.sql` | `team_id`-Spalte in `bookings` (FK → teams) |
| 012 | `012_backfill_booking_team_id.sql` | Backfill `team_id` für bestehende Buchungen |

**Vollständiges ER-Diagramm:**

```
operators
 └── profiles (user_id → operators.id, verknüpft mit Supabase Auth via auth_user_id)
 └── facilities (operator_id → operators.id)
      └── resource_groups (facility_id → facilities.id)
           └── resources (group_id → resource_groups.id)
                ├── resources [children] (parent_resource_id → resources.id)
                ├── slots (resource_id → resources.id)
                └── bookings (resource_id → resources.id)
                     └── bookings.user_id → profiles.id

clubs
 └── departments (club_id → clubs.id)
      └── teams (department_id → departments.id)
           └── trainer_assignments (team_id → teams.id, user_id → profiles.id)

genehmiger_resource_assignments (user_id → profiles.id, resource_id → resources.id)
```

> **Alle IDs sind UUIDs** (gen_random_uuid()). Die Funktion `buildBookableResources()` flacht die hierarchische Ressourcen-Struktur in ein buchbares Array. Die DB→App-Mapper in `useSupabase.js` konvertieren snake_case (PostgreSQL) → camelCase (JavaScript).

### 2.2 State-Architektur (React Contexts)

Das State-Management nutzt eine Provider-Hierarchie mit 7 Contexts:

```
BrowserRouter (index.js)
  → ToastProvider (index.js)
    → AuthProvider (index.js)
      → FacilityProvider
        → OrganizationProvider
          → BookingProvider
            → UserProvider
              → HolidayProvider
                → Routes (App.js)
```

| Context | Datei | Verantwortung |
|---------|-------|---------------|
| `AuthContext` | `contexts/AuthContext.js` | Supabase Auth Session, Login/Logout, Profil-Laden, Rollen-Checks (`kannBuchen`, `kannGenehmigen`, `kannAdministrieren`, `isAdmin`) |
| `FacilityContext` | `contexts/FacilityContext.js` | Facilities, ResourceGroups, Resources (Config), Slots, `RESOURCES` (flaches Array via `buildBookableResources()`) |
| `OrganizationContext` | `contexts/OrganizationContext.js` | Clubs, Departments, Teams, TrainerAssignments + CRUD |
| `BookingContext` | `contexts/BookingContext.js` | Bookings laden, erstellen, Status-Updates, Löschen |
| `UserContext` | `contexts/UserContext.js` | User-Profile, Einladungen, Genehmiger-Zuweisungen (`genehmiger_resource_assignments`) |
| `HolidayContext` | `contexts/HolidayContext.js` | Ferien & Feiertage laden + CRUD |
| `ToastContext` | `contexts/ToastContext.js` | In-App Toast-Benachrichtigungen (success, error, warning, info) |

**Custom Hooks (DB-Logik, aufgeteilt aus useSupabase.js):**

| Hook | Datei | Verantwortung |
|------|-------|---------------|
| `useBookings` | `hooks/useBookings.js` | Buchungen laden, erstellen, Status-Updates, Löschen |
| `useFacilities` | `hooks/useFacilities.js` | Anlagen, Gruppen, Ressourcen, Slots CRUD |
| `useOrganization` | `hooks/useOrganization.js` | Vereine, Abteilungen, Mannschaften, Trainer-Zuordnungen CRUD |
| `useUsers` | `hooks/useUsers.js` | Benutzer laden, einladen, Rolle ändern |
| `useHolidays` | `hooks/useHolidays.js` | Ferien & Feiertage CRUD + Bulk-Import |
| `useOperators` | `hooks/useOperators.js` | Betreiber laden |
| `useGenehmigerResources` | `hooks/useGenehmigerResources.js` | Genehmiger↔Ressourcen-Zuweisungen |
| `useBookingActions` | `hooks/useBookingActions.js` | Orchestriert Buchen, Genehmigen, Ablehnen, Löschen. Unterstützt `{ singleOnly: true }` für Einzeltermin-Aktionen innerhalb einer Serie. |
| `useConfirm` | `hooks/useConfirm.js` | Promise-basierter Ersatz für `window.confirm()` → rendert `ConfirmDialog` |

> `useSupabase.js` ist nur noch ein dünner Re-Export-Wrapper (~23 Zeilen) für Backwards-Compatibility.

---

### 2.3 Anlagenverwaltung (Facility Domain)

#### 2.3.1 Operator (Betreiber)

Oberste Ebene. Repräsentiert die Organisation, die die Anlagen betreibt. **Nicht** identisch mit einem Verein – ein Betreiber kann auch eine Kommune sein.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK (gen_random_uuid) |
| `name` | String | ✅ | Betreibername |
| `type` | Enum | ✅ | `verein` / `kommune` / `sonstige` |
| `primaryColor` | String | ✅ | Primärfarbe für Branding (Hex) |

#### 2.3.2 Facility (Anlage)

Physischer Standort mit Adresse. Ein Betreiber verwaltet eine oder mehrere Anlagen.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `operatorId` | UUID | ✅ | FK → Operator |
| `name` | String | ✅ | Anlagenname |
| `street` | String | ❌ | Straße |
| `houseNumber` | String | ❌ | Hausnummer |
| `zip` | String | ❌ | PLZ |
| `city` | String | ❌ | Ort |
| `sortOrder` | Number | ✅ | Sortierreihenfolge |

**Seed-Daten:**
- Biogrund Sportpark (Am Sportpark 1, 65510 Hünstetten-Görsroth)
- Dorfgemeinschaftshaus Görsroth (Hauptstraße, 65510 Hünstetten-Görsroth)

#### 2.3.3 ResourceGroup (Ressourcengruppe)

Logische Gruppierung von Ressourcen innerhalb einer Anlage.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `facilityId` | UUID | ✅ | FK → Facility |
| `name` | String | ✅ | Gruppenname (z.B. "Außenanlagen") |
| `icon` | Enum | ✅ | Kategorie: `outdoor` / `indoor` / `shared` |
| `sortOrder` | Number | ✅ | Sortierreihenfolge |
| `sharedScheduling` | Boolean | ✅ | `true` → Slot-basierte Buchung, Zahnrad-Icon für Slot-Verwaltung |

**Seed-Daten:**

| Gruppe | Anlage | Kategorie | Slot-basiert |
|--------|--------|-----------|-------------|
| Außenanlagen | Biogrund Sportpark | outdoor | ❌ |
| Innenräume | Biogrund Sportpark | indoor | ❌ |
| Mehrzweckhallen | DGH Görsroth | shared | ✅ |

#### 2.3.4 Resource (Ressource)

Einzelne buchbare Einheit. Die `resources`-Tabelle enthält sowohl Top-Level-Ressourcen als auch Sub-Resources (seit Migration 006).

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `groupId` | UUID | ✅ | FK → ResourceGroup |
| `name` | String | ✅ | Ressourcenname |
| `color` | String | ✅ | Anzeigefarbe (Hex) |
| `splittable` | Boolean | ✅ | Kann in Unterressourcen geteilt werden |
| `bookingMode` | Enum | ✅ | `free` (frei buchbar) / `slotOnly` (nur in zugewiesenen Slots) |
| `parentResourceId` | UUID | ❌ | FK → Resource (self-ref). `NULL` = Top-Level; gesetzt = Sub-Resource |

**Ressourcen-Filterung in allen Komponenten:**
```js
resources.filter(r => r.groupId === selectedGroupId)
```

**Seed-Daten:**

| Ressource | Gruppe | Teilbar | Buchungsmodus | parent_resource_id |
|-----------|--------|---------|---------------|-------------------|
| Sportplatz - komplett | Außenanlagen | ✅ | free | NULL |
| Sportplatz - links | Außenanlagen | ❌ | free | → Sportplatz komplett |
| Sportplatz - rechts | Außenanlagen | ❌ | free | → Sportplatz komplett |
| Fußball-Kleinfeld | Außenanlagen | ❌ | free | NULL |
| Gymnastikraum | Innenräume | ❌ | free | NULL |
| Fitnessraum | Innenräume | ❌ | free | NULL |
| Vereinsgastronomie | Innenräume | ❌ | free | NULL |
| Große Mehrzweckhalle | Mehrzweckhallen | ❌ | slotOnly | NULL |
| Kleine Mehrzweckhalle | Mehrzweckhallen | ❌ | slotOnly | NULL |

#### 2.3.5 Slot (Zeitfenster)

Zeitfenster für slot-basierte Ressourcen. Nur Ressourcen in Gruppen mit `sharedScheduling = true`.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `resourceId` | UUID | ✅ | FK → Resource |
| `dayOfWeek` | Number | ✅ | Wochentag (0 = Sonntag, 6 = Samstag) |
| `startTime` | Time | ✅ | Startzeit (HH:MM) |
| `endTime` | Time | ✅ | Endzeit (HH:MM) |
| `validFrom` | Date | ❌ | Gültig ab |
| `validUntil` | Date | ❌ | Gültig bis |

#### 2.3.6 Beziehungen (Anlagen)

```
Operator (Betreiber) ← NICHT identisch mit Club (Organisation)
 └── Facility[] (Anlagen)
      └── ResourceGroup[] (Gruppen)
           ├── sharedScheduling: true → Slot-Verwaltung per Zahnrad pro Ressource
           └── Resource[] (Ressourcen)
                ├── parentResourceId: NULL → Top-Level
                ├── parentResourceId: set  → Sub-Resource (buchbar, FK-gültig)
                ├── bookingMode: free / slotOnly
                ├── splittable: true → hat Child-Resources
                └── Slot[] (nur bei slotOnly / sharedScheduling)
```

**Geschäftsregeln:**
- Wenn eine teilbare Ressource ("komplett") gebucht wird, werden automatisch alle Unterressourcen mitgebucht
- Wenn eine Unterressource gebucht ist, kann die übergeordnete Ressource nicht gebucht werden (Konflikt)
- Slot-basierte Ressourcen können NUR innerhalb zugewiesener Zeitfenster gebucht werden
- Beim Löschen einer Ressource werden zugehörige Slots mitgelöscht (CASCADE)

---

### 2.4 Organisationsverwaltung (Organization Domain)

#### 2.4.1 Club (Verein)

Verein im organisatorischen Sinne. **Getrennt vom Betreiber** (Operator).

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `name` | String | ✅ | Vereinsname |
| `shortName` | String | ✅ | Kurzname (z.B. "SGH") |
| `color` | String | ✅ | Vereinsfarbe (Hex) |
| `isHomeClub` | Boolean | ✅ | Heimatverein? |

#### 2.4.2 Department (Abteilung)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `clubId` | UUID | ✅ | FK → Club |
| `name` | String | ✅ | Abteilungsname |
| `icon` | String | ✅ | Emoji-Icon |
| `sortOrder` | Number | ✅ | Sortierreihenfolge |

#### 2.4.3 Team (Mannschaft)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `departmentId` | UUID | ✅ | FK → Department |
| `name` | String | ✅ | Mannschaftsname |
| `shortName` | String | ✅ | Kurzname |
| `color` | String | ✅ | Farbe (Hex) |
| `sortOrder` | Number | ✅ | Sortierreihenfolge |
| `eventTypes` | Array<String> | ✅ | Erlaubte Terminarten (IDs aus EVENT_TYPES) |

#### 2.4.4 EventType (Terminart) – Single Source of Truth

Definiert als `EVENT_TYPES` in `organizationConfig.js`. Perspektivisch DB-Tabelle.

| ID | Label | Icon | Farbe | allowOverlap | Beschreibung |
|----|-------|------|-------|-------------|-------------|
| `training` | Training | 🏃 | #3b82f6 | ❌ | Regelmäßiges Training |
| `match` | Heimspiel | ⚽ | #dc2626 | ❌ | Wettkampf oder Freundschaftsspiel |
| `event` | Event/Wettkampf | 🎉 | #8b5cf6 | ❌ | Turnier, Sonderveranstaltung |
| `other` | Sonstiges | 📋 | #6b7280 | ✅ | Besprechung, Wartung, etc. |

> **`allowOverlap`:** Steuert die Konflikterkennung. Wenn beide sich überlappende Buchungen `allowOverlap: true` haben, wird der Konflikt als Warnung statt als Fehler gemeldet.

#### 2.4.5 TrainerAssignment (Trainer-Zuordnung)

N:M-Beziehung zwischen Profile und Team.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `userId` | UUID | ✅ | FK → profiles |
| `teamId` | UUID | ✅ | FK → teams |
| `isPrimary` | Boolean | ✅ | Haupttrainer (true) oder Co-Trainer (false) |

---

### 2.5 Benutzerverwaltung (User Domain)

#### 2.5.1 Authentifizierung

Das System nutzt **Supabase Auth** mit E-Mail/Passwort. Kein Self-Service-Signup – Benutzer werden ausschließlich per Admin-Einladung angelegt:

1. Admin erstellt Einladung (E-Mail + Rolle)
2. Supabase sendet Einladungs-E-Mail mit Magic Link
3. Benutzer setzt Passwort und wird aktiviert
4. `AuthContext` verknüpft Supabase Auth Session mit `profiles`-Tabelle via `auth_user_id`

**Session-Management:**
- `AuthContext` hört auf `onAuthStateChange` Events
- Profil wird bei Login automatisch geladen
- Rollen-Checks (`kannBuchen`, `kannGenehmigen`, `kannAdministrieren`) werden aus dem Profil abgeleitet
- Geschützte Routen via `ProtectedRoute` (Auth-Guard) und `PermissionRoute` (Rollen-Guard)

#### 2.5.2 Profile (Benutzer)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK (gen_random_uuid) |
| `auth_user_id` | UUID | ❌ | FK → Supabase Auth (gesetzt nach Einladung) |
| `firstName` | String | ✅ | Vorname |
| `lastName` | String | ✅ | Nachname |
| `email` | String | ✅ | E-Mail-Adresse |
| `phone` | String | ❌ | Telefonnummer |
| `role` | Enum | ✅ | `admin` / `trainer` / `extern` / `genehmiger` |
| `operatorId` | UUID | ❌ | FK → Operator (Pflicht für Admins) |

#### 2.5.3 Rollen

| Rolle | Label | Beschreibung | Buchungsrecht | Genehmigungsrecht | Admin-Bereich |
|-------|-------|-------------|---------------|-------------------|---------------|
| `admin` | Administrator | Volle Rechte | ✅ | ✅ Alle Ressourcen | ✅ |
| `genehmiger` | Genehmiger | Genehmigt Anfragen für zugewiesene Ressourcen | ✅ | ✅ Nur zugewiesene | ❌ |
| `trainer` | Trainer | Eigene Buchungen erstellen | ✅ | ❌ | ❌ |
| `extern` | Extern | Nur Anfragen stellen (genehmigungspflichtig) | ✅ | ❌ | ❌ |

**Rollen-Checks im AuthContext:**

| Check | Wer | Verwendet in |
|-------|-----|-------------|
| `kannBuchen` | Alle eingeloggten Benutzer | PermissionRoute, Sidebar |
| `kannGenehmigen` | admin + genehmiger | PermissionRoute, Sidebar, Approvals |
| `kannAdministrieren` | admin | PermissionRoute, Sidebar, Admin-Bereich |
| `isAdmin` | admin | MyBookings (Lösch-Buttons) |

#### 2.5.4 GenehmigerResourceAssignment (Genehmiger-Ressourcen-Zuweisung)

Admins weisen Genehmigern gezielt einzelne Ressourcen zu. Genehmiger sehen in der Approvals-Ansicht nur Anfragen für ihre zugewiesenen Ressourcen.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `user_id` | UUID | ✅ | FK → profiles (Rolle muss `genehmiger` sein) |
| `resource_id` | UUID | ✅ | FK → resources |

**Logik in AppLayout:**
```js
const myGenehmigerResources = kannAdministrieren
  ? null                                        // Admin sieht alles
  : (kannGenehmigen ? getResourcesForUser(profile?.id) : null);

// Pending-Count filtert nach zugewiesenen Ressourcen
const pendingCount = bookings.filter(b => {
  if (b.status !== 'pending' || b.parentBooking) return false;
  if (kannAdministrieren) return true;
  if (kannGenehmigen) return myGenehmigerResources?.includes(b.resourceId);
  return false;
}).length;
```

---

### 2.6 Buchungen (Booking Domain)

#### 2.6.1 Booking (Buchung)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `resourceId` | UUID | ✅ | FK → resources |
| `date` | Date | ✅ | Datum (ISO: YYYY-MM-DD) |
| `startTime` | Time | ✅ | Startzeit (HH:MM) |
| `endTime` | Time | ✅ | Endzeit (HH:MM) |
| `title` | String | ✅ | Titel |
| `description` | String | ❌ | Beschreibung |
| `bookingType` | Enum | ✅ | `training` / `match` / `event` / `other` |
| `userId` | UUID | ✅ | FK → profiles (Ersteller) |
| `status` | Enum | ✅ | `pending` / `approved` / `rejected` / `cancelled` |
| `seriesId` | String | ❌ | Serien-ID (Terminserie oder Composite-Booking) |
| `parentBooking` | Boolean | ❌ | `true` = Auto-generierte Teilfeld-Buchung |

#### 2.6.2 Buchungslogik

**Einzeltermin:** Ein Datum mit Start-/Endzeit → eine Booking-Zeile.

**Terminserie:** Wochentag + Zeitraum → N Booking-Zeilen mit geteilter `seriesId`. Einzeln oder als Serie löschbar.

**Teilbare Ressourcen (Composite):**
- Buchung von "Sportplatz - komplett" erzeugt automatisch Zusatzbuchungen für "links" und "rechts"
- Zusatzbuchungen haben `parentBooking: true` und dieselbe `seriesId`
- Auch Einzeltermin-Composites erhalten eine `seriesId`

**Genehmigungsworkflow:**

```
Neue Buchung erstellt
    ├── User.role = admin/trainer/genehmiger → status = 'approved' (sofort)
    └── User.role = extern → status = 'pending'
         ├── Admin/Genehmiger genehmigt Serie → status = 'approved' (alle mit gleicher seriesId)
         ├── Admin/Genehmiger lehnt Serie ab → status = 'rejected' (alle mit gleicher seriesId)
         └── Bei Zeitkonflikten: Einzeltermin separat genehmigen/ablehnen (singleOnly)
```

> **Genehmiger sehen nur Anfragen für ihre zugewiesenen Ressourcen.** Admins sehen alle.
> **Serien werden als aufklappbare Container dargestellt.** Einzeltermin-Aktionen nur bei Zeitkonflikten.

#### 2.6.3 Konflikterkennung

| Konflikttyp | Schweregrad | Beschreibung |
|-------------|------------|-------------|
| `time_overlap` | error/warning | Zeitüberschneidung (Schweregrad abhängig von `allowOverlap`) |
| `composite_blocked` | error/warning | Teilfeld belegt → Ganzes Feld nicht buchbar |
| `parent_blocked` | error/warning | Ganzes Feld gebucht → Teilfeld nicht buchbar |
| `no_slot` | error | Kein verfügbarer Slot an diesem Tag (nur slot-basiert) |
| `outside_slot` | error | Gewünschte Zeit liegt außerhalb des Slots |

**Konflikterkennung in Serien-Containern:**

`findConflicts()` in `helpers.js` prüft für jeden Einzeltermin einer Serie, ob er mit einer anderen genehmigten oder ausstehenden Buchung auf derselben Ressource zeitlich kollidiert. Bookings innerhalb derselben Serie werden dabei ausgeschlossen. Das Ergebnis wird in MyBookings und Approvals als "frei"/"Konflikt" Badge angezeigt.

---

## 3. Seiten und UI-Komponenten

### 3.1 Navigation (Sidebar)

Responsive Sidebar mit Hamburger-Menü auf Mobile (eingeklappt, Overlay bei Öffnen).

```
┌─────────────────────┐
│ SG  SG Hünstetten    │
│     Buchungssystem   │
├─────────────────────┤
│ ALLGEMEIN            │
│ 📅 Kalender         │
│ 📋 Meine Buchungen  │
│ 📝 Neue Anfrage     │  ← nur wenn kannBuchen
│ 📥 PDF-Export       │
├─────────────────────┤
│ GENEHMIGUNGEN        │  ← nur wenn kannGenehmigen
│ 🛡️ Genehmigungen (N)│  ← Badge mit pendingCount
├─────────────────────┤
│ ADMINISTRATION       │  ← nur wenn kannAdministrieren
│ 👥 Benutzerverwaltung│
│ 🏢 Anlagenverwaltung│
│ ⚙️ Organisation     │
│ 🗓️ Ferien & Feiertage│
│ 📧 E-Mail-Log       │
├─────────────────────┤
│ DM  Daniel Maiworm   │  ← UserMenu (Name, Rollen, Logout)
│     Admin · Genehm…  │
└─────────────────────┘
```

### 3.2 Login (LoginPage)

**Route:** `/login`

Supabase Auth Login-Formular (E-Mail + Passwort). Nach erfolgreicher Anmeldung Redirect auf `/`. Kein Registrierungsformular – Benutzer werden per Admin-Einladung angelegt.

### 3.3 Kalender (CalendarView)

**Route:** `/`

**Aufbau:**
1. **Facility-Dropdown** + Adressanzeige
2. **Gruppen-Tabs** (Ressourcengruppen der Anlage, dynamisch via `groupId`-FK) mit Buchungs-Count
3. **Ressourcen-Tabs** (Einzelressourcen der Gruppe) mit Farbbalken und Buchungs-Count
4. **Resource-Info** (Name, Farbe, Badges: "Nur in zugewiesenen Slots", "Beide Hälften") + **Navigation** (← | DatePicker | → | Heute) + **Tag/Woche Toggle**
5. **Kalender-Grid**: Woche (7 Tage × 7:00–22:00 Uhr, 48px/Stunde) oder Tagesansicht (einzelner Tag, detaillierter). Buchungen als farbige Blöcke (approved = Ressourcenfarbe, pending = gelb, blocking = grau gestrichelt). Slot-Shading (grün/grau) bei limitierten Ressourcen.
6. **Legende**: Genehmigt, Ausstehend, Blockiert, Event-Types, Slot-Info

### 3.4 Meine Buchungen (MyBookings)

**Route:** `/meine-buchungen`

**Aufbau:**
1. **Gruppen-Filter-Tabs** (dynamisch aus `resourceGroups`, mit "Alle Buchungen" Tab)
2. **Ressourcen-Sub-Filter** (wenn Gruppe ausgewählt)
3. **Booking-Cards** (4-Spalten-Layout):
   - Col 1: Titel, Ressource, Wochentag, Zeit, Datumsbereich (+ Serien-Badge mit Anzahl)
   - Col 2: Trainer/Übungsleiter (Primary + Co)
   - Col 3: Buchungstyp + Organisations-Hierarchie (Verein → Abteilung → Mannschaft)
   - Col 4: Status-Badge (Genehmigt/Ausstehend/Abgelehnt) + Lösch-Aktionen (Admin: 1 Termin / Serie)

**Serien-Container (aufklappbar):**
Terminserien werden als einzelner Container dargestellt statt als viele Einzelkarten:
- **Zusammenfassung**: Serien-Badge (Nx), Konfliktstatus-Badges ("X frei", "Y Konflikte")
- **Aufklapp-Button** (Chevron): Zeigt alle Einzeltermine mit:
  - Datum, Wochentag, Uhrzeit
  - Status-Badge pro Termin
  - Konfliktdetails (welche andere Buchung kollidiert)
  - Frei-Termine mit grünem CheckCircle, Konflikte mit amber AlertTriangle
- Konflikterkennung via `findConflicts()` aus `helpers.js`

### 3.5 Neue Anfrage (BookingRequest)

**Route:** `/buchen` (nur `kannBuchen`)

**Formular-Schritte:**

| Schritt | Sektion | Felder |
|---------|---------|--------|
| 1 | Ressource auswählen | Anlage → Bereich → Ressource (3 kaskadierende Dropdowns via `groupId`-FK) |
| 2 | Mannschaft auswählen | Verein → Abteilung → Mannschaft + Trainer-Anzeige + Warnung bei fehlendem Trainer |
| 3 | Terminart | Gefiltert auf erlaubte Terminarten der Mannschaft |
| 4 | Terminplanung | Toggle: Einzeltermin / Terminserie |
| 5 | Buchungsdetails | Titel (auto-vorgeschlagen), Beschreibung |
| 6 | Vorschau | Terminliste mit Konfliktprüfung (grün/gelb/rot) |
| 7 | Zusammenfassung | Alle gewählten Daten |
| 8 | Absenden | Button mit Terminanzahl, deaktiviert bei Konflikten oder fehlendem Trainer |

### 3.6 Genehmigungen (Approvals)

**Route:** `/genehmigungen` (nur `kannGenehmigen`)

- Filtert `status === 'pending' && !parentBooking`
- **Genehmiger** sehen nur Anfragen für ihre zugewiesenen Ressourcen
- **Admins** sehen alle ausstehenden Anfragen
- Optionaler Kommentar bei Ablehnung

**Serien-Container (aufklappbar):**
Terminserien werden als ein aufklappbarer Container dargestellt:
- **Header**: Titel, Ressource, Zeitraum, Serien-Badge (Nx), Konfliktstatus ("X frei", "Y Konflikte")
- **Serien-Aktionen**: "Alle genehmigen" / "Alle ablehnen" Buttons (wirkt auf die gesamte Serie via `seriesId`)
- **Aufklapp-Ansicht**: Einzeltermine mit Datum, Uhrzeit und Konfliktstatus
- **Einzeltermin-Aktionen bei Konflikten**: Termine mit Zeitkonflikten erhalten eigene "Genehmigen"/"Ablehnen" Buttons (`singleOnly: true` → nur dieser eine Termin wird aktualisiert)
- **Konflikterkennung**: `findConflicts()` prüft Überschneidungen mit anderen genehmigten/ausstehenden Buchungen auf derselben Ressource
- **Zähler**: Header zeigt Anzahl der Anfragen (gruppiert), nicht Einzeltermine

### 3.7 PDF-Export (PDFExportPage)

**Route:** `/export`

Export des Buchungsplans als PDF (Querformat A4):
- **Kategorie-Auswahl**: Dynamisch aus tatsächlichen `resourceGroups` aufgebaut (nicht mehr hardcoded). Erhält `resourceGroups` als Prop und baut Kategorien per `groupId` auf. Gruppen ohne Ressourcen werden ausgeblendet.
- Vorschau der enthaltenen Anlagen mit Farbpills
- Monats-/Jahresauswahl
- Generiert Kalender-Grid mit farbigen Buchungsblöcken + Legende
- Nutzt jsPDF (on-demand CDN-Load)

### 3.8 Admin: Benutzerverwaltung (UserManagement)

**Route:** `/admin/benutzer` (nur `kannAdministrieren`)

- Benutzer einladen (E-Mail + Rolle → Supabase Auth Invite)
- Rollen ändern
- Trainer-Status verwalten
- **Genehmiger-Ressourcen zuweisen**: Bei Rolle `genehmiger` erscheint eine Ressourcen-Liste mit Checkboxen zum Aktivieren/Deaktivieren einzelner Ressourcen

### 3.9 Admin: Anlagenverwaltung (FacilityManagement)

**Route:** `/admin/anlagen` (nur `kannAdministrieren`)

- Facilities, ResourceGroups, Resources CRUD
- Slot-Verwaltung für `sharedScheduling`-Gruppen (Zahnrad-Icon)
- Splittable-Ressourcen verwalten

### 3.10 Admin: Organisation (OrganizationManagement)

**Route:** `/admin/organisation` (nur `kannAdministrieren`)

- Vereine, Abteilungen, Mannschaften CRUD
- Trainer-Zuordnungen (Primary/Co) mit Benutzer-Dropdown
- Erlaubte Terminarten pro Mannschaft

### 3.11 Shared UI-Komponenten

| Komponente | Datei | Beschreibung |
|-----------|-------|-------------|
| `AddButton` | `ui/AddButton.js` | Standardisierter "Hinzufügen"-Button |
| `Badge` | `ui/Badge.js` | Status-Badges (success, warning, error, info, neutral) |
| `Button` | `ui/Button.js` | Einheitliche Buttons (primary, secondary, danger, ghost) |
| `ColorPicker` | `ui/ColorPicker.js` | Farbauswahl-Komponente |
| `ConfirmDialog` | `ui/ConfirmDialog.js` | Modal-basierter `window.confirm()`-Ersatz (via `useConfirm`) |
| `DebouncedInput` | `ui/DebouncedInput.js` | Input mit Debounce für Suche/Filter |
| `EmptyState` | `ui/EmptyState.js` | Platzhalter für leere Listen |
| `ErrorBoundary` | `ui/ErrorBoundary.js` | React Error Boundary mit benutzerfreundlicher Fehlerseite |
| `ExpandableSection` | `ui/ExpandableSection.js` | Aufklappbarer Abschnitt (Akkordeon) |
| `Modal` | `ui/Modal.js` | Overlay-Dialog mit Backdrop |
| `PageHeader` | `ui/PageHeader.js` | Standardisierter Seiten-Header |

### 3.12 Admin: Ferien & Feiertage (HolidayManagement)

**Route:** `/admin/ferien-feiertage` (nur `kannAdministrieren`)

- Feiertage und Schulferien manuell anlegen/bearbeiten/löschen
- Bulk-Import: Schulferien eines Jahres automatisch importieren
- Jahrgangsweise Löschung möglich

---

## 4. Routing

| Route | Komponente | Guard | Sichtbarkeit |
|-------|-----------|-------|-------------|
| `/login` | LoginPage | – | Nur unauthentifiziert |
| `/` | CalendarView | ProtectedRoute | Alle |
| `/meine-buchungen` | MyBookings | ProtectedRoute | Alle |
| `/buchen` | BookingRequest | PermissionRoute(kannBuchen) | Alle eingeloggten |
| `/export` | PDFExportPage | ProtectedRoute | Alle |
| `/teams` | TeamOverview | ProtectedRoute | Alle |
| `/genehmigungen` | Approvals | PermissionRoute(kannGenehmigen) | Admin + Genehmiger |
| `/admin/benutzer` | UserManagement | PermissionRoute(kannAdministrieren) | Admin |
| `/admin/anlagen` | FacilityManagement | PermissionRoute(kannAdministrieren) | Admin |
| `/admin/organisation` | OrganizationManagement | PermissionRoute(kannAdministrieren) | Admin |
| `/admin/ferien-feiertage` | HolidayManagement | PermissionRoute(kannAdministrieren) | Admin |
| `/admin/emails` | EmailLog | PermissionRoute(kannAdministrieren) | Admin |
| `*` | → Redirect `/` | – | Fallback |

---

## 5. Geschäftsregeln (Zusammenfassung)

### 5.1 Buchungsregeln

1. Slot-basierte Ressourcen können **nur** innerhalb zugewiesener Zeitfenster gebucht werden
2. Bei Buchung einer teilbaren Ressource ("komplett") werden **automatisch** alle Unterressourcen mitgebucht (`parentBooking: true`, gleiche `seriesId`)
3. Wenn eine Unterressource belegt ist, kann das "Ganze" **nicht** gebucht werden
4. Titel wird **automatisch vorgeschlagen**: "{Mannschaft} {Terminart}"
5. Buchungen von `extern`-Benutzern erfordern **Genehmigung**
6. Genehmigung/Ablehnung **cascaded** auf alle Bookings mit derselben `seriesId` (Standard-Verhalten)
7. Bei **Zeitkonflikten** innerhalb einer Serie können Einzeltermine separat genehmigt/abgelehnt werden (`singleOnly: true`)
8. `parentBooking`-Einträge erscheinen **nicht** in der Genehmigungsansicht
9. Überlappungskonflikte sind nur **Warnungen** wenn beide Terminarten `allowOverlap: true` haben

### 5.2 Löschregeln

1. Einzeltermin löschen: Nur dieser eine Termin
2. Serie löschen: Alle Termine mit derselber `seriesId`
3. Ressource löschen: Zugehörige Slots werden mitgelöscht (CASCADE)
4. Gruppe löschen: Alle Ressourcen und Slots werden mitgelöscht (CASCADE)
5. Anlage löschen: Alles darunter wird mitgelöscht (CASCADE)

### 5.3 Organisations-Regeln

1. Jede Mannschaft hat eine **Whitelist** erlaubter Terminarten
2. Ein Trainer kann **mehreren** Mannschaften zugeordnet sein
3. Eine Mannschaft kann **mehrere** Trainer haben (Haupt + Co)
4. Buchung erfordert einen **zugeordneten Trainer** (userId wird aus Primary Trainer aufgelöst)

### 5.4 Benutzer- und Rollen-Regeln

1. Benutzer werden ausschließlich per **Admin-Einladung** angelegt (kein Self-Service-Signup)
2. Admins müssen einem **Betreiber** zugeordnet sein
3. **Genehmiger** sehen nur Anfragen für Ressourcen, die ihnen von einem Admin zugewiesen wurden
4. **Admins** sehen und genehmigen alle Anfragen
5. Betreiber und Verein sind **getrennte Entitäten**

---

## 6. Datei-Struktur

```
src/
├── App.js                              # Root: Provider-Hierarchie + Routing (AppLayout)
├── index.js                            # BrowserRouter + AuthProvider
├── index.css                           # Projekt-spezifische Styles (Body, Reset)
│
├── lib/
│   └── supabase.js                     # Supabase-Client Konfiguration
│
├── contexts/
│   ├── AuthContext.js                   # Login, Session, Profil, Rollen-Checks
│   ├── FacilityContext.js              # Anlagen, Gruppen, Ressourcen, Slots, RESOURCES
│   ├── OrganizationContext.js          # Vereine, Abteilungen, Mannschaften + CRUD
│   ├── BookingContext.js               # Buchungen laden, erstellen, Status-Updates
│   ├── UserContext.js                  # User-Profile, Einladungen, Genehmiger-Zuweisungen
│   ├── HolidayContext.js               # Ferien & Feiertage
│   └── ToastContext.js                 # In-App Toast-Benachrichtigungen
│
├── hooks/
│   ├── useBookings.js                  # Buchungen (DB-Logik)
│   ├── useFacilities.js               # Anlagen, Gruppen, Ressourcen, Slots
│   ├── useOrganization.js             # Vereine, Abteilungen, Mannschaften
│   ├── useUsers.js                    # Benutzer, Einladungen
│   ├── useHolidays.js                 # Ferien & Feiertage
│   ├── useOperators.js                # Betreiber
│   ├── useGenehmigerResources.js      # Genehmiger-Ressourcen-Zuweisungen
│   ├── useSupabase.js                 # Dünner Re-Export-Wrapper (~23 Zeilen)
│   ├── useBookingActions.js           # Buchen, Genehmigen, Ablehnen, Löschen
│   └── useConfirm.js                  # Promise-basierter ConfirmDialog
│
├── routes/
│   ├── ProtectedRoute.js               # Auth-Guard (→ /login wenn nicht eingeloggt)
│   └── PermissionRoute.js              # Rollen-Guard (→ / wenn keine Berechtigung)
│
├── components/
│   ├── ui/                             # Shared UI-Komponenten
│   │   ├── Badge.js                    #   Status-Badges + Legacy Button-Reexport
│   │   ├── Button.js                   #   Einheitliche Buttons
│   │   ├── Card.js                     #   Content-Container
│   │   ├── ConfirmDialog.js            #   Modal-Confirm (via useConfirm)
│   │   ├── EmptyState.js              #   Platzhalter leere Listen
│   │   ├── FormField.js               #   Label + Input-Wrapper
│   │   ├── InfoBanner.js              #   Farbige Hinweisboxen
│   │   ├── LoadingSpinner.js          #   Lade-Animation
│   │   ├── Modal.js                   #   Overlay-Dialog
│   │   ├── SectionHeader.js           #   Sektions-Überschrift
│   │   └── TabBar.js                  #   Wiederverwendbare Tabs
│   │
│   ├── admin/
│   │   ├── facilities/                 #   Anlagenverwaltung
│   │   │   ├── index.js               #     Barrel Export
│   │   │   ├── FacilitySection.js     #     Anlagen CRUD
│   │   │   ├── FacilityCard.js        #     Anlagen-Karte
│   │   │   ├── FacilityEditor.js      #     Anlagen-Editor
│   │   │   ├── ResourceGroupSection.js#     Gruppen CRUD
│   │   │   ├── ResourceCard.js        #     Ressourcen-Karte
│   │   │   ├── SubResourceRow.js      #     Sub-Ressourcen-Zeile
│   │   │   └── SlotPanel.js           #     Slot-Verwaltung
│   │   │
│   │   ├── organization/               #   Organisationsverwaltung
│   │   │   ├── index.js               #     Barrel Export
│   │   │   ├── ClubSection.js         #     Vereine CRUD
│   │   │   ├── DepartmentSection.js   #     Abteilungen CRUD
│   │   │   ├── TeamCard.js            #     Mannschafts-Karte
│   │   │   ├── TrainerAssignmentRow.js#     Trainer-Zuordnungs-Zeile
│   │   │   └── OrganizationManagement.js # Container
│   │   │
│   │   ├── users/                      #   Benutzerverwaltung
│   │   │   ├── index.js               #     Barrel Export
│   │   │   ├── UserManagement.js      #     Container
│   │   │   ├── UserCard.js            #     Benutzer-Karte
│   │   │   ├── UserFormModal.js       #     Benutzerformular (Modal)
│   │   │   ├── ResourceAssignment.js  #     Genehmiger-Ressourcen-Zuweisung
│   │   │   ├── PermBadges.js          #     Berechtigungs-Badges
│   │   │   ├── StatusBadge.js         #     Status-Badge
│   │   │   └── userConstants.js       #     Konstanten für Benutzerverwaltung
│   │   │
│   │   ├── holidays/                   #   Ferien & Feiertage
│   │   │   ├── HolidayManagement.js   #     Container
│   │   │   ├── HolidayFormModal.js    #     Formular-Modal
│   │   │   ├── HolidayImportModal.js  #     Bulk-Import-Modal
│   │   │   └── HolidayRow.js          #     Zeile in der Liste
│   │   │
│   │   ├── Approvals.js               #   Genehmigungen
│   │   ├── EmailLog.js                 #   E-Mail-Protokoll
│   │   ├── HolidayManagement.js        #   Ferien & Feiertage (Container-Wrapper)
│   │   ├── FacilityManagement.js       #   Container für facilities/
│   │   ├── OrganizationManagement.js   #   Container für organization/
│   │   └── UserManagement.js           #   Container für users/
│   │
│   ├── CalendarView.js                 #   Wochen-/Tageskalender (Tag/Woche Toggle)
│   ├── BookingRequest.js               #   Buchungsformular
│   ├── BookingEditModal.js             #   Buchung bearbeiten (Modal)
│   ├── MyBookings.js                   #   Meine Buchungen
│   ├── PDFExportPage.js                #   PDF-Export
│   ├── TeamOverview.js                 #   Mannschaftsübersicht
│   ├── TeamOverviewCard.js             #   Mannschafts-Karte
│   ├── Sidebar.js                      #   Navigation (responsive, Hamburger-Menü)
│   ├── LoginPage.js                    #   Login-Formular
│   └── UserMenu.js                     #   Benutzer-Menü (Name, Rollen, Logout)
│
├── config/
│   ├── constants.js                    # ROLES, DAYS, DAYS_FULL, COLOR_PRESETS
│   ├── facilityConfig.js              # buildBookableResources()
│   └── organizationConfig.js           # EVENT_TYPES (Single Source of Truth)
│
├── services/
│   └── emailService.js                 # E-Mail-Service (Mock)
│
└── utils/
    └── helpers.js                      # Datum, Format, Kalender, Konflikterkennung

public/
└── index.html                          # Tailwind CDN Script + Meta-Tags

supabase/
├── functions/
│   ├── ical/                           # iCal-Feed Edge Function
│   └── send-email/                     # E-Mail Edge Function
└── migrations/
    ├── 001_operators_and_profiles.sql
    ├── 002_prototype_mode.sql
    ├── 003_facilities_and_resources.sql
    ├── 004_organization.sql
    ├── 005_bookings.sql
    ├── 006_fix_sub_resources_as_bookable.sql
    ├── 007_drop_deprecated_sub_resources.sql
    ├── 008_holidays.sql
    ├── 009_sent_emails.sql
    ├── 010_jfv_trainer_profiles.sql
    ├── 011_bookings_team_id.sql
    └── 012_backfill_booking_team_id.sql
```

---

## 7. Daten-Transformation

### 7.1 buildBookableResources()

Die Funktion in `facilityConfig.js` flacht das hierarchische Ressourcenmodell in ein Array buchbarer Ressourcen:

- `bookingMode === 'slotOnly'` → `type: 'limited'`
- `bookingMode === 'free'` → `type: 'regular'`
- `splittable + subResources` → `isComposite: true` + `includes[]` + separate Eintraege mit `partOf`

Wird in `FacilityContext` per `useMemo` aufgerufen und als `RESOURCES` an alle Komponenten weitergegeben.

---

## 8. Entscheidungen und Roadmap

### 8.1 Getroffene Entscheidungen

| Frage | Entscheidung | Begründung |
|-------|-------------|------------|
| Betreiber = Verein? | **Nein, getrennte Tabellen** | Betreiber kann auch Kommune sein |
| Authentifizierung | **Supabase Auth, einladungsbasiert** | Internes System, kein Self-Signup |
| Genehmiger-Rolle | **Eigene Rolle mit Ressourcen-Zuweisung** | Granulare Kontrolle pro Ressource |
| Sub-Resources | **In `resources` mit `parent_resource_id`** | Müssen als FK-Ziel für Bookings gültig sein |
| Composite Approve/Reject | **Cascade via `seriesId`** | Ganzes Feld + Teilflächen als Einheit |
| Resource-Filterung | **`groupId`-FK statt `category`-String** | Konsistent, DB-nativ |
| Event-Types | **`EVENT_TYPES` in `organizationConfig.js`** | Single Source of Truth |
| State Management | **React Contexts** (5 Provider) | Prop-Drilling eliminiert, klare Zuständigkeiten |
| Styling | **Tailwind CSS via CDN** | Keine Build-Konfiguration nötig |
| Routing | **React Router v6** mit Auth-/Permission-Guards | Deklarativ, geschützte Routen |
| Confirm-Dialoge | **useConfirm Hook + ConfirmDialog** | Ersetzt `window.confirm()` |

### 8.2 Offene Features (Roadmap)

| Priorität | Feature | Beschreibung |
|-----------|---------|-------------|
| 🟡 Mittel | Buchungs-Bearbeitung | Modal (`BookingEditModal.js`) vorhanden, Integrationstiefe prüfen |
| 🟢 Niedrig | Audit-Log | Änderungshistorie für alle Entitäten |

**Abgeschlossen:**

| Feature | PR | Beschreibung |
|---------|-----|-------------|
| ✅ Mobile-Optimierung | #5 | Responsive Sidebar mit Hamburger-Menü |
| ✅ Tagesansicht Kalender | #6 | Tag/Woche Toggle in CalendarView |
| ✅ iCal-Feed | #7 | Edge Function `ical/` – Buchungen als Kalender-Abonnement pro Ressource |
| ✅ Toast-Benachrichtigungen | #9 | In-App Feedback nach Aktionen via ToastContext |
| ✅ Error Boundaries | #12 | Benutzerfreundliche Fehlerseite bei unerwarteten Fehlern |
| ✅ Ferien & Feiertage | Migration 008 | Verwaltung + Bulk-Import von Schulferien |
| ✅ E-Mail-Log | #4 | Link in Sidebar + EmailLog-Seite |

### 8.3 Technische Schulden

| Item | Status | Aktion |
|------|--------|--------|
| ~~`buildLegacyResources()`~~ | Erledigt | Umbenannt zu `buildBookableResources()` – ist die offizielle Transformation |

