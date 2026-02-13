# SG Hünstetten – Ressourcen-Buchungssystem

## Prototyp-Dokumentation (Stand: 13.02.2026)

> **Zweck dieses Dokuments:** Vollständige Beschreibung des Prototyps als "Source of Truth" für die anschließende Datenbankmodellierung und Backend-Implementierung. Alle Entitäten, Beziehungen, Geschäftsregeln und UI-Seiten sind hier dokumentiert.

---

## 1. Systemübersicht

### 1.1 Zweck

Webbasiertes Buchungssystem für Sportanlagen und -räume. Ermöglicht Vereinen, Abteilungen und Mannschaften die Reservierung von Ressourcen (Sportplätze, Hallen, Räume) über eine zentrale Oberfläche.

### 1.2 Kernkonzepte

Das System besteht aus **drei unabhängigen Verwaltungsbereichen**, die über Buchungen verknüpft werden:

| Bereich | Beschreibung | Admin-Seite |
|---------|-------------|-------------|
| **Anlagenverwaltung** | Physische Orte, Ressourcengruppen, Einzelressourcen, Slots | Anlagen |
| **Organisationsverwaltung** | Vereine, Abteilungen, Mannschaften, Trainer-Zuordnungen | Organisation |
| **Personenverwaltung** | Benutzerkonten mit Rollen und Kontaktdaten | Personen |

### 1.3 Technologie-Stack

- **Frontend:** React (Single Page Application)
- **Styling:** Tailwind CSS + Inline Styles
- **Icons:** Lucide React
- **Backend/Datenbank:** Supabase (PostgreSQL)
- **Supabase-Client:** `@supabase/supabase-js` (via `src/lib/supabase.js`)
- **Deployment:** Vercel (automatisch via GitHub)
- **State:** React Hooks (`useUsers`, `useFacilities`, `useOrganization`, `useBookings`) mit Supabase-Anbindung + Demo-Fallback
- **Repository:** `DMaiworm/sg-huenstetten-buchung` (Branch: main)

---

## 2. Datenmodell

### 2.1 Datenbankschema (Supabase/PostgreSQL)

Die Datenbank wurde über 6 Migrationen aufgebaut:

| Migration | Datei | Inhalt |
|-----------|-------|--------|
| 001 | `001_operators_and_profiles.sql` | Operator-Tabelle + Profiles (Users) mit UUID-PKs |
| 002 | `002_enable_profiles_rls.sql` | Row Level Security für Profiles |
| 003 | `003_facilities_and_resources.sql` | Facilities, ResourceGroups, Resources, SubResources, Slots + Seed-Daten |
| 004 | `004_organization.sql` | Clubs, Departments, Teams, TrainerAssignments + Seed-Daten |
| 005 | `005_bookings.sql` | Bookings-Tabelle mit ENUMs + Konflikterkennung-Funktion + Seed-Daten |
| 006 | `006_fix_sub_resources_as_bookable.sql` | Sub-Resources als reguläre Resources mit `parent_resource_id` (FK-Fix) |

**Vollständiges ER-Diagramm:**

```
operators
 └── profiles (user_id → operators.id)
 └── facilities (operator_id → operators.id)
      └── resource_groups (facility_id → facilities.id)
           └── resources (group_id → resource_groups.id)
                ├── resources [children] (parent_resource_id → resources.id)  ← Migration 006
                ├── slots (resource_id → resources.id)
                └── bookings (resource_id → resources.id)
                     └── bookings.user_id → profiles.id

clubs
 └── departments (club_id → clubs.id)
      └── teams (department_id → departments.id)
           └── trainer_assignments (team_id → teams.id, user_id → profiles.id)
```

> **Alle IDs sind UUIDs** (gen_random_uuid()). Die Legacy-Config-Dateien und Demo-Fallbacks verwenden z.T. noch String-IDs; die Supabase-Hooks konvertieren zwischen DB-Format (snake_case) und Legacy-Format (camelCase).

### 2.2 Hooks-Architektur (src/hooks/useSupabase.js)

Jeder Hook folgt dem Muster: Laden bei Mount → DB-Format konvertieren → Fallback auf Demo-Daten bei Fehler → CRUD-Callbacks.

| Hook | Tabellen | Konverter | Fallback |
|------|----------|-----------|----------|
| `useUsers()` | profiles | `profileToLegacyUser()` | `DEMO_USERS_FALLBACK` |
| `useOperators()` | operators | direkt | Hardcoded SG Hünstetten |
| `useFacilities()` | facilities, resource_groups, resources, slots | `buildConfigResources()` | `DEFAULT_*` aus facilityConfig.js |
| `useOrganization()` | clubs, departments, teams, trainer_assignments | `db*ToLegacy()` | `DEFAULT_*` aus organizationConfig.js |
| `useBookings()` | bookings | `dbBookingToLegacy()` | Leere Liste |

**Besonderheit `buildConfigResources()`** (Migration 006):
Nach Migration 006 sind Sub-Resources (z.B. "Sportplatz - links") auch Zeilen in der `resources`-Tabelle mit gesetztem `parent_resource_id`. Die Funktion `buildConfigResources()` rekonstruiert die Parent-Child-Hierarchie:
- Alle Resources ohne `parent_resource_id` = Top-Level (Parents)
- Alle Resources mit `parent_resource_id` = Children (→ `subResources[]` des Parents)

Dies ersetzt die alte `sub_resources`-Tabellen-Query.

---

### 2.3 Anlagenverwaltung (Facility Domain)

#### 2.3.1 Operator (Betreiber)

Oberste Ebene. Repräsentiert die Organisation, die die Anlagen betreibt. Dies ist **nicht** dasselbe wie ein Verein in der Organisationsverwaltung – ein Betreiber kann auch eine öffentliche Einrichtung oder Kommune sein (z.B. "Gemeinde Hünstetten").

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK (gen_random_uuid) |
| `name` | String | ✅ | Betreibername (z.B. "SG Hünstetten" oder "Gemeinde Hünstetten") |
| `type` | Enum | ✅ | Art des Betreibers: `verein` / `kommune` / `sonstige` |
| `primaryColor` | String | ✅ | Primärfarbe für Branding (Hex) |

> **Entscheidung:** Betreiber und Verein (Organisation) sind **getrennte Tabellen**. Begründung: Der Betreiber kann eine Kommune, ein Verein oder eine andere Einrichtung sein. Admins werden dem Betreiber zugeordnet, nicht einem Verein.

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

**Demo-Daten:**
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
| `sortOrder` | Number | ✅ | Sortierreihenfolge innerhalb der Anlage |
| `sharedScheduling` | Boolean | ✅ | Wenn `true`: Ressourcen dieser Gruppe sind slot-basiert → Zahnrad-Icon für Slot-Verwaltung erscheint |

**Demo-Daten:**

| Gruppe | Anlage | Kategorie | Slot-basiert |
|--------|--------|-----------|-------------|
| Außenanlagen | Biogrund Sportpark | outdoor | ❌ |
| Innenräume | Biogrund Sportpark | indoor | ❌ |
| Mehrzweckhallen | DGH Görsroth | shared | ✅ |

#### 2.3.4 Resource (Ressource)

Einzelne buchbare Einheit. **Nach Migration 006** enthält die `resources`-Tabelle sowohl Top-Level-Ressourcen als auch Sub-Resources (ehem. `sub_resources`-Tabelle).

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `groupId` | UUID | ✅ | FK → ResourceGroup |
| `name` | String | ✅ | Ressourcenname |
| `color` | String | ✅ | Anzeigefarbe (Hex) |
| `splittable` | Boolean | ✅ | Kann in Unterressourcen geteilt werden |
| `bookingMode` | Enum | ✅ | `free` (frei buchbar) / `slotOnly` (nur in zugewiesenen Slots) |
| `parentResourceId` | UUID | ❌ | FK → Resource (self-ref). `NULL` = Top-Level; gesetzt = Sub-Resource |

**Ressourcen-Filterung in Komponenten:**
Alle Komponenten (CalendarView, BookingRequest, MyBookings) filtern Ressourcen konsistent über `groupId`-FK:
```js
resources.filter(r => r.groupId === selectedGroupId)
```
Die alte `category`-basierte Filterung (`r.category === group.icon`) wurde in allen Komponenten durch die FK-basierte ersetzt.

**Demo-Daten:**

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

Zeitfenster für slot-basierte Ressourcen. Nur Ressourcen in Gruppen mit `sharedScheduling = true` können Slots haben.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `resourceId` | UUID | ✅ | FK → Resource |
| `dayOfWeek` | Number | ✅ | Wochentag (0 = Sonntag, 6 = Samstag) |
| `startTime` | Time | ✅ | Startzeit (HH:MM) |
| `endTime` | Time | ✅ | Endzeit (HH:MM) |
| `validFrom` | Date | ❌ | Gültig ab |
| `validUntil` | Date | ❌ | Gültig bis |

**Demo-Daten:**

| Ressource | Wochentag | Zeit | Gültigkeitszeitraum |
|-----------|-----------|------|---------------------|
| Große Mehrzweckhalle | Montag | 17:00–21:00 | 01.01.–30.06.2026 |
| Große Mehrzweckhalle | Mittwoch | 18:00–22:00 | 01.01.–30.06.2026 |
| Große Mehrzweckhalle | Samstag | 09:00–14:00 | 01.01.–30.06.2026 |
| Kleine Mehrzweckhalle | Dienstag | 16:00–20:00 | 01.01.–30.06.2026 |
| Kleine Mehrzweckhalle | Donnerstag | 17:00–21:00 | 01.01.–30.06.2026 |

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
- Wenn eine teilbare Ressource ("komplett") gebucht wird, werden automatisch alle Unterressourcen ("links", "rechts") mitgebucht
- Wenn eine Unterressource gebucht ist, kann die übergeordnete Ressource nicht mehr gebucht werden (Konflikt)
- Slot-basierte Ressourcen können NUR innerhalb zugewiesener Zeitfenster gebucht werden
- Beim Löschen einer Ressource werden zugehörige Slots ebenfalls gelöscht (CASCADE)
- Sub-Resources sind vollwertige `resources`-Zeilen → direkt als `bookings.resource_id` FK-Ziel gültig

---

### 2.4 Organisationsverwaltung (Organization Domain)

#### 2.4.1 Club (Verein – Organisation)

Verein im organisatorischen Sinne. Kann der Heimatverein oder ein Gastverein sein. **Getrennt vom Betreiber** (Operator), da Betreiber auch Kommunen oder andere Einrichtungen sein können.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `name` | String | ✅ | Vereinsname |
| `shortName` | String | ✅ | Kurzname (z.B. "SGH") |
| `color` | String | ✅ | Vereinsfarbe (Hex) |
| `isHomeClub` | Boolean | ✅ | Ist dies der Heimatverein (Betreiber)? |

**Demo-Daten:**

| Verein | Kürzel | Farbe | Heimatverein |
|--------|--------|-------|-------------|
| SG Hünstetten | SGH | #2563eb | ✅ |
| TV Idstein | TVI | #dc2626 | ❌ |
| TSV Wallrabenstein | TSV | #16a34a | ❌ |

#### 2.4.2 Department (Abteilung)

Sportliche Abteilung innerhalb eines Vereins.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `clubId` | UUID | ✅ | FK → Club |
| `name` | String | ✅ | Abteilungsname (z.B. "Fußball") |
| `icon` | String | ✅ | Emoji-Icon |
| `sortOrder` | Number | ✅ | Sortierreihenfolge |

#### 2.4.3 Team (Gruppe/Mannschaft)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `departmentId` | UUID | ✅ | FK → Department |
| `name` | String | ✅ | Mannschaftsname |
| `shortName` | String | ✅ | Kurzname |
| `color` | String | ✅ | Farbe (Hex) |
| `sortOrder` | Number | ✅ | Sortierreihenfolge |
| `eventTypes` | Array<String> | ✅ | Erlaubte Terminarten (IDs aus EVENT_TYPES) |

#### 2.4.4 EventType (Terminart)

Globale Aufzählung der möglichen Terminarten. Definiert in `organizationConfig.js` → perspektivisch DB-Tabelle.

| ID | Label | Icon | Farbe | Beschreibung |
|----|-------|------|-------|-------------|
| `training` | Training | 🏃 | #3b82f6 | Regelmäßiges Training |
| `match` | Heimspiel | ⚽ | #dc2626 | Wettkampf oder Freundschaftsspiel |
| `event` | Event/Wettkampf | 🎉 | #8b5cf6 | Turnier, Wettkampf, Sonderveranstaltung |
| `other` | Sonstiges | 📋 | #6b7280 | Besprechung, Wartung, etc. |

#### 2.4.5 TrainerAssignment (Trainer-Zuordnung)

Verknüpfung zwischen Person (Profile) und Mannschaft (Team). N:M-Beziehung.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `userId` | UUID | ✅ | FK → profiles |
| `teamId` | UUID | ✅ | FK → teams |
| `isPrimary` | Boolean | ✅ | Haupttrainer (true) oder Co-Trainer (false) |

---

### 2.5 Personenverwaltung (User Domain)

#### 2.5.1 Profile (Benutzer/Person)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK (gen_random_uuid) |
| `firstName` | String | ✅ | Vorname |
| `lastName` | String | ✅ | Nachname |
| `email` | String | ✅ | E-Mail-Adresse |
| `phone` | String | ❌ | Telefonnummer |
| `role` | Enum | ✅ | Rolle: `admin` / `trainer` / `extern` |
| `operatorId` | UUID | ❌ | FK → Operator (Pflicht für Admins) |

#### 2.5.2 Rollen

| Rolle | Label | Beschreibung | Genehmigungspflicht |
|-------|-------|-------------|---------------------|
| `admin` | Administrator | Volle Rechte. Muss einem Betreiber zugeordnet sein. | ❌ Auto-genehmigt |
| `trainer` | Trainer | Eigene Buchungen erstellen und verwalten | ❌ Auto-genehmigt |
| `extern` | Extern | Nur Anfragen stellen | ✅ Muss genehmigt werden |

---

### 2.6 Buchungen (Booking Domain)

#### 2.6.1 Booking (Buchung)

Einzelner Termin einer Ressource.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | UUID | ✅ | PK |
| `resourceId` | UUID | ✅ | FK → resources |
| `date` | Date | ✅ | Datum (ISO: YYYY-MM-DD) |
| `startTime` | Time | ✅ | Startzeit (HH:MM) |
| `endTime` | Time | ✅ | Endzeit (HH:MM) |
| `title` | String | ✅ | Titel (z.B. "A-Jugend Training") |
| `description` | String | ❌ | Beschreibung |
| `bookingType` | Enum | ✅ | `training` / `match` / `event` / `other` |
| `userId` | UUID | ✅ | FK → profiles (Ersteller / Haupttrainer) |
| `status` | Enum | ✅ | `pending` / `approved` / `rejected` / `cancelled` |
| `seriesId` | String | ❌ | Serien-ID (wenn Teil einer Terminserie oder Composite-Booking) |
| `parentBooking` | Boolean | ❌ | `true` = Auto-generierte Teilfeld-Buchung (nicht in Approvals angezeigt) |

#### 2.6.2 Buchungslogik

**Einzeltermin:**
- Ein einzelnes Datum mit Start- und Endzeit
- Erzeugt genau eine Booking-Zeile

**Terminserie:**
- Wochentag + Startdatum + Enddatum + Start-/Endzeit
- Erzeugt N Booking-Zeilen (eine pro Woche im Zeitraum)
- Alle teilen dieselbe `seriesId`
- Können einzeln oder als Serie gelöscht werden

**Teilbare Ressourcen (Composite):**
- Bei Buchung von "Sportplatz - komplett" werden automatisch zusätzliche Buchungen für "Sportplatz - links" und "Sportplatz - rechts" erzeugt
- Diese Zusatzbuchungen haben `parentBooking: true` und dieselbe `seriesId`
- **Auch Einzeltermin-Composites erhalten eine `seriesId`** (um die Verknüpfung herzustellen)
- Sub-Resource-IDs sind gültige FK-Targets (seit Migration 006)

**Genehmigungsworkflow:**

```
Neue Buchung erstellt
    ├── User.role = admin/trainer → status = 'approved' (sofort)
    └── User.role = extern → status = 'pending' (wartet auf Admin)
         ├── Admin genehmigt → status = 'approved' (+ alle mit gleicher seriesId)
         └── Admin lehnt ab → status = 'rejected' (+ alle mit gleicher seriesId)
```

> **Cascading Approve/Reject:** Beim Genehmigen/Ablehnen werden alle Bookings mit derselben `seriesId` gleichzeitig aktualisiert (`updateSeriesStatus()`). Dadurch werden Composite-Buchungen (Ganzes Feld + Teilflächen) als Einheit behandelt. In der Approvals-Ansicht erscheinen nur die Haupt-Buchungen (`parentBooking !== true`), mit einem Info-Banner über die Anzahl verknüpfter Buchungen.

#### 2.6.3 Konflikterkennung

| Konflikttyp | Schweregrad | Beschreibung |
|-------------|------------|-------------|
| `time_overlap` | error/warning | Zeitüberschneidung mit bestehender Buchung auf derselben Ressource |
| `composite_blocked` | error/warning | Teilfeld belegt → Ganzes Feld nicht buchbar |
| `parent_blocked` | error/warning | Ganzes Feld gebucht → Teilfeld nicht buchbar |
| `no_slot` | error | Kein verfügbarer Slot an diesem Tag (nur slot-basiert) |
| `outside_slot` | error | Gewünschte Zeit liegt außerhalb des Slots |

---

## 3. Seiten und UI-Komponenten

### 3.1 Navigation (Sidebar)

```
┌─────────────────────┐
│ 🏠 SG Hünstetten    │
│    Ressourcen-Buchung│
├─────────────────────┤
│ 📅 Kalender         │
│ 📋 Meine Buchungen  │
│ ➕ Neue Anfrage     │
├─────────────────────┤
│ EXPORT              │
│ 📥 Monatsplan PDF   │
├─────────────────────┤
│ ADMINISTRATION      │  ← nur wenn Admin-Modus aktiv
│ ✅ Genehmigungen    │
│ 👤 Personen         │
│ 🏢 Organisation     │
│ 🏗️ Anlagen          │
│ 📧 E-Mail-Log       │
└─────────────────────┘
```

### 3.2 Kalender (CalendarView) ✅ Refactored

**Zweck:** Wochenübersicht aller Buchungen pro Ressource

**Aufbau:**
1. **Facility-Dropdown** (oben): Auswahl der Anlage + Anzeige der Adresse
2. **Gruppen-Tabs**: Ressourcengruppen der gewählten Anlage, dynamisch via `groupId`-FK
3. **Ressourcen-Tabs**: Einzelressourcen der gewählten Gruppe via `r.groupId === selectedGroupId`
4. **Wochennavigation**: ← Prev | "KW XX: DD.MM – DD.MM.YYYY" | Next →
5. **Kalender-Grid**: 7 Tage × Zeitslots (8:00–22:00), Buchungen als farbige Blöcke

### 3.3 Meine Buchungen (MyBookings) ✅ Refactored

**Zweck:** Übersicht aller Buchungen des aktuellen Benutzers (oder aller, im Admin-Modus)

**Layout:** 4-Spalten Flexbox mit Farbbalken, dynamische Gruppen-Tabs aus `resourceGroups`-Prop.

### 3.4 Neue Anfrage (BookingRequest) ✅ Refactored

**Zweck:** Neue Buchungsanfrage erstellen

**Formular-Schritte:**

| Schritt | Sektion | Felder |
|---------|---------|--------|
| 1 | **Ressource auswählen** | Anlage → Bereich → Ressource (3 kaskadierende Dropdowns, via `groupId`-FK) |
| 2 | **Mannschaft auswählen** | Verein → Abteilung → Mannschaft + Trainer-Anzeige + Warnung bei fehlendem Trainer |
| 3 | **Terminart** | Gefiltert auf erlaubte Terminarten der Mannschaft |
| 4 | **Terminplanung** | Toggle: Einzeltermin / Terminserie |
| 5 | **Buchungsdetails** | Titel (auto-vorgeschlagen), Beschreibung |
| 6 | **Vorschau** | Terminliste mit Konfliktprüfung (grün/gelb/rot) |
| 7 | **Zusammenfassung** | Alle gewählten Daten auf einen Blick |
| 8 | **Absenden** | Button mit Terminanzahl, deaktiviert bei Konflikten oder fehlendem Trainer |

**Validierungen vor Submit:**
- `resourceId` muss gesetzt sein
- `previewDates` darf nicht leer sein
- `userId` wird aus Primary Trainer aufgelöst – wenn leer, Warnung + Submit blockiert
- Slot-Validierung für limitierte Ressourcen
- Konflikt-Prüfung (Errors blockieren Submit)

### 3.5 Genehmigungen (Approvals) ✅ Refactored

**Zweck:** Admin-Übersicht ausstehender Buchungsanfragen

**Features:**
- Filtert `status === 'pending' && !parentBooking` (auto-generierte Sperren ausgeblendet)
- Info-Banner: "Genehmigung gilt auch für X verknüpfte Buchungen"
- Approve/Reject cascaded via `seriesId` auf alle zugehörigen Buchungen
- E-Mail-Benachrichtigung bei Genehmigung/Ablehnung

### 3.6 Personen (UserManagement)

**Zweck:** Benutzerkonten verwalten (CRUD über Supabase)

### 3.7 Organisation (OrganizationManagement)

**Zweck:** Vereine, Abteilungen, Mannschaften und Trainer-Zuordnungen verwalten (Daten aus Supabase)

### 3.8 Anlagen (FacilityManagement)

**Zweck:** Physische Standorte, Ressourcengruppen und Ressourcen verwalten (Daten aus Supabase)

### 3.9 E-Mail-Log (EmailLog)

**Zweck:** Übersicht aller versendeten E-Mail-Benachrichtigungen (Demo/Mock)

### 3.10 Monatsplan PDF (PDFExportPage)

**Zweck:** PDF-Export des Buchungsplans für einen Monat

---

## 4. Legacy-Kompatibilität

### 4.1 buildLegacyResources()

Die Funktion `buildLegacyResources()` in `facilityConfig.js` konvertiert das hierarchische Ressourcenmodell (aus `useFacilities()` / DB) in das flache Format, das bestehende Komponenten erwarten:

- `resource.bookingMode === 'slotOnly'` → `type: 'limited'`
- `resource.bookingMode === 'free'` → `type: 'regular'`
- `resource.splittable + subResources` → `isComposite: true` + `includes[]` + separate Einträge mit `partOf`

### 4.2 constants.js – Auflösung (teilweise erledigt)

| Bisheriger Inhalt | Status | Ziel |
|-------------------|--------|------|
| `RESOURCES` | ✅ Erledigt | DB `resources` via `useFacilities()` |
| `BOOKING_TYPES` | 🟡 Noch aktiv in Approvals/constants | `EVENT_TYPES` aus organizationConfig |
| `ROLES` | 🟡 Frontend-Konstante | Bleibt vorerst |
| `DEMO_USERS` | ✅ Erledigt | DB `profiles` via `useUsers()` |
| `DEMO_BOOKINGS` | ✅ Erledigt | DB `bookings` via `useBookings()` |
| `DEMO_SLOTS` | ✅ Erledigt | DB `slots` via `useFacilities()` |
| `DAYS` / `DAYS_FULL` | ✅ Bleibt | Reine Frontend-Anzeigelogik |

---

## 5. Geschäftsregeln (Zusammenfassung)

### 5.1 Buchungsregeln

1. Slot-basierte Ressourcen können **nur** innerhalb zugewiesener Zeitfenster gebucht werden
2. Bei Buchung einer teilbaren Ressource ("komplett") werden **automatisch** alle Unterressourcen mitgebucht (gleiche `seriesId`, `parentBooking: true`)
3. Wenn eine Unterressource belegt ist, kann das übergeordnete "Ganze" **nicht** gebucht werden
4. Termine vom Typ `training` sind **typischerweise Terminserien** (wöchentlich wiederkehrend)
5. Termine vom Typ `match` und `event` sind **typischerweise Einzeltermine**
6. Der Titel wird **automatisch vorgeschlagen**: "{Mannschaft} {Terminart}"
7. Buchungen von `extern`-Benutzern erfordern **Admin-Genehmigung**
8. Genehmigung/Ablehnung **cascaded** auf alle Bookings mit derselber `seriesId`
9. `parentBooking`-Einträge erscheinen **nicht** in der Genehmigungsansicht

### 5.2 Löschregeln

1. Einzeltermin löschen: Nur dieser eine Termin
2. Serie löschen: Alle Termine mit derselben `seriesId`
3. Ressource löschen: Zugehörige Slots werden mitgelöscht (CASCADE)
4. Gruppe löschen: Alle Ressourcen und Slots werden mitgelöscht (CASCADE)
5. Anlage löschen: Alles darunter wird mitgelöscht (CASCADE)

### 5.3 Organisations-Regeln

1. Jede Mannschaft hat eine **Whitelist** erlaubter Terminarten
2. Ein Trainer kann **mehreren** Mannschaften zugeordnet sein
3. Eine Mannschaft kann **mehrere** Trainer haben (Haupt + Co)
4. Buchung erfordert einen **zugeordneten Trainer** (userId wird aus Primary Trainer aufgelöst)

### 5.4 Betreiber-Regeln

1. Betreiber und Verein (Organisation) sind **getrennte Entitäten**
2. Admins müssen einem **Betreiber** zugeordnet sein (nicht einem Verein)
3. Ein Betreiber verwaltet eine oder mehrere **Anlagen**

---

## 6. Datei-Struktur

```
src/
├── App.js                          # Hauptkomponente, State-Management, Routing
├── index.js                        # React Entry Point
├── index.css                       # Globale Styles + Tailwind
├── lib/
│   └── supabase.js                 # Supabase-Client Konfiguration
├── hooks/
│   └── useSupabase.js              # Alle Supabase-Hooks (useUsers, useFacilities, useOrganization, useBookings)
├── config/
│   ├── constants.js                # [WIRD AUFGELÖST] Legacy-Konstanten → nur noch DAYS, ROLES, BOOKING_TYPES
│   ├── facilityConfig.js           # Demo-Fallback Daten + buildLegacyResources()
│   └── organizationConfig.js       # Demo-Fallback Daten + EventTypes
├── components/
│   ├── Sidebar.js                  # Navigation
│   ├── CalendarView.js             # ✅ Refactored: groupId-FK Filterung, JSDoc
│   ├── BookingRequest.js           # ✅ Refactored: groupId-FK, userId-Validierung, JSDoc
│   ├── MyBookings.js               # ✅ Refactored: dynamische Group-Tabs, JSDoc
│   ├── PDFExportPage.js            # PDF-Export
│   ├── PDFExportDialog.js          # PDF-Export-Dialog
│   ├── ui/
│   │   └── Badge.js                # Badge + Button Komponenten
│   └── admin/
│       ├── Approvals.js            # ✅ Refactored: parentBooking-Filter, Cascade-Info, JSDoc
│       ├── UserManagement.js       # Personen-Verwaltung
│       ├── OrganizationManagement.js # ✅ Refactored: Unused vars entfernt
│       ├── FacilityManagement.js   # ✅ Refactored: Unused vars entfernt
│       ├── SlotManagement.js       # [DEPRECATED] Alte Slot-Seite (nicht mehr verlinkt)
│       └── EmailLog.js             # E-Mail-Protokoll
├── services/
│   └── emailService.js             # E-Mail-Service (Mock)
└── utils/
    └── helpers.js                  # Hilfsfunktionen (Datum, Konflikte, etc.)

supabase/
└── migrations/
    ├── 001_operators_and_profiles.sql
    ├── 002_enable_profiles_rls.sql
    ├── 003_facilities_and_resources.sql
    ├── 004_organization.sql
    ├── 005_bookings.sql
    └── 006_fix_sub_resources_as_bookable.sql
```

---

## 7. Entscheidungen für die weitere Entwicklung

### 7.1 Getroffene Entscheidungen

| Frage | Entscheidung | Begründung |
|-------|-------------|------------|
| Betreiber = Verein? | **Nein, getrennte Tabellen** | Betreiber kann auch Kommune sein |
| Multi-Tenancy | Betreiber ist eigene Organisation; Admins dem Betreiber zugeordnet | Flexible Betreibermodelle |
| Sub-Resources | **In `resources` mit `parent_resource_id`** (Migration 006) | Sub-Resources müssen als FK-Ziel für Bookings gültig sein |
| Composite Approve/Reject | **Cascade via `seriesId`** | Ganzes Feld + Teilflächen als Einheit behandeln |
| Resource-Filterung | **`groupId`-FK statt `category`-String** | Konsistent, bruchsicher, DB-nativ |
| constants.js | Auflösen – Daten in DB | Nur Wochentag-Labels + Rollen bleiben |
| Historische Buchungen | Soft-Delete via Status | Daten bleiben erhalten |

### 7.2 Fehlende Features (Roadmap)

| Priorität | Feature | Beschreibung |
|-----------|---------|-------------|
| 🔴 Hoch | Authentifizierung | Login-System mit E-Mail/Passwort oder SSO |
| 🔴 Hoch | Echte E-Mail-Versendung | Aktuell nur Mock – Anbindung an E-Mail-Service |
| 🟡 Mittel | Buchungs-Bearbeitung | Aktuell nur Löschen möglich |
| 🟡 Mittel | Tagesansicht Kalender | Detaillierte Tagesansicht |
| 🟡 Mittel | Mobile-Optimierung | Responsive Layouts |
| 🟢 Niedrig | Benutzer-Selbstregistrierung | Neue Benutzer können sich selbst anmelden |
| 🟢 Niedrig | Audit-Log | Änderungshistorie für alle Entitäten |
| 🟢 Niedrig | iCal-Export | Buchungen als Kalender-Abonnement |

### 7.3 Technische Schulden

| Datei/Komponente | Status | Aktion |
|-----------------|--------|--------|
| `SlotManagement.js` | ⬜ TODO | Löschen (durch FacilityManagement ersetzt) |
| `constants.js` → `BOOKING_TYPES` | ⬜ TODO | Durch `EVENT_TYPES` aus organizationConfig ersetzen |
| `helpers.js` → `BOOKING_TYPES` Import | ⬜ TODO | Umstellen auf `EVENT_TYPES` |
| `buildLegacyResources()` | 🟡 Aktiv | Perspektivisch entfernen – DB liefert hierarchisches Modell |
| `facilityConfig.js` Demo-Daten | 🟡 Fallback | Seed-Daten in DB, Config bleibt als Fallback |
| `organizationConfig.js` Demo-Daten | 🟡 Fallback | Seed-Daten in DB, Config bleibt als Fallback |
| `sub_resources`-Tabelle | 🟡 Deprecated | Daten wurden nach `resources` kopiert (Mig. 006), Tabelle kann entfernt werden |
| CalendarView | ✅ Refactored | groupId-FK, JSDoc, consolidated helpers |
| MyBookings | ✅ Refactored | Dynamic group tabs, groupId-FK, JSDoc |
| BookingRequest | ✅ Refactored | groupId-FK, userId validation, JSDoc |
| Approvals | ✅ Refactored | parentBooking filter, cascade info, JSDoc |
| FacilityManagement | ✅ Cleaned | Unused vars removed |
| OrganizationManagement | ✅ Cleaned | Unused vars removed |
