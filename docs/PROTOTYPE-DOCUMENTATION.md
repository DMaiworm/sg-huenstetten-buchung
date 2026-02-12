# SG Hünstetten – Ressourcen-Buchungssystem

## Prototyp-Dokumentation (Stand: 12.02.2026)

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

### 1.3 Technologie-Stack (Prototyp)

- **Frontend:** React (Single Page Application)
- **Styling:** Tailwind CSS + Inline Styles
- **Icons:** Lucide React
- **Deployment:** Vercel (automatisch via GitHub)
- **State:** React useState (kein Backend, alle Daten im Client-State)
- **Repository:** `DMaiworm/sg-huenstetten-buchung` (Branch: main)

---

## 2. Datenmodell

### 2.1 Anlagenverwaltung (Facility Domain)

#### 2.1.1 Club (Verein – Betreiber)

Oberste Ebene. Repräsentiert den Verein, der die Anlagen betreibt.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `name` | String | ✅ | Vereinsname (z.B. "SG Hünstetten") |
| `primaryColor` | String | ✅ | Primärfarbe für Branding (Hex) |

> **Hinweis:** Im Prototyp existiert nur ein Betreiber-Verein. In der DB-Implementierung könnte dies Multi-Tenancy ermöglichen.

#### 2.1.2 Facility (Anlage)

Physischer Standort mit Adresse. Ein Verein betreibt eine oder mehrere Anlagen.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | String | ✅ | Eindeutige ID (z.B. "facility-biogrund") |
| `name` | String | ✅ | Anlagenname |
| `street` | String | ❌ | Straße |
| `houseNumber` | String | ❌ | Hausnummer |
| `zip` | String | ❌ | PLZ |
| `city` | String | ❌ | Ort |
| `sortOrder` | Number | ✅ | Sortierreihenfolge |

**Demo-Daten:**
- Biogrund Sportpark (Am Sportpark 1, 65510 Hünstetten-Görsroth)
- Dorfgemeinschaftshaus Görsroth (Hauptstraße, 65510 Hünstetten-Görsroth)

#### 2.1.3 ResourceGroup (Ressourcengruppe)

Logische Gruppierung von Ressourcen innerhalb einer Anlage.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | String | ✅ | Eindeutige ID |
| `facilityId` | String | ✅ | FK → Facility |
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

#### 2.1.4 Resource (Ressource)

Einzelne buchbare Einheit.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | String | ✅ | Eindeutige ID |
| `groupId` | String | ✅ | FK → ResourceGroup |
| `name` | String | ✅ | Ressourcenname |
| `color` | String | ✅ | Anzeigefarbe (Hex) |
| `splittable` | Boolean | ✅ | Kann in Unterressourcen geteilt werden |
| `bookingMode` | Enum | ✅ | `free` (frei buchbar) / `slotOnly` (nur in zugewiesenen Slots) |
| `subResources` | Array | ❌ | Unterressourcen (wenn `splittable = true`) |

**SubResource-Struktur:**

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | String | ✅ | Eindeutige ID |
| `name` | String | ✅ | Name (z.B. "Sportplatz - links") |
| `color` | String | ✅ | Eigene Farbe |

**Demo-Daten:**

| Ressource | Gruppe | Teilbar | Buchungsmodus | Unterressourcen |
|-----------|--------|---------|---------------|-----------------|
| Sportplatz - komplett | Außenanlagen | ✅ | free | links, rechts |
| Fußball-Kleinfeld | Außenanlagen | ❌ | free | – |
| Gymnastikraum | Innenräume | ❌ | free | – |
| Fitnessraum | Innenräume | ❌ | free | – |
| Vereinsgastronomie | Innenräume | ❌ | free | – |
| Große Mehrzweckhalle | Mehrzweckhallen | ❌ | slotOnly | – |
| Kleine Mehrzweckhalle | Mehrzweckhallen | ❌ | slotOnly | – |

#### 2.1.5 Slot (Zeitfenster)

Zeitfenster für slot-basierte Ressourcen. Nur Ressourcen in Gruppen mit `sharedScheduling = true` können Slots haben.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | Number | ✅ | Eindeutige ID |
| `resourceId` | String | ✅ | FK → Resource |
| `dayOfWeek` | Number | ✅ | Wochentag (0 = Sonntag, 6 = Samstag) |
| `startTime` | String | ✅ | Startzeit (HH:MM) |
| `endTime` | String | ✅ | Endzeit (HH:MM) |
| `validFrom` | String | ❌ | Gültig ab (ISO-Datum) |
| `validUntil` | String | ❌ | Gültig bis (ISO-Datum) |

**Demo-Daten:**

| Ressource | Wochentag | Zeit | Gültigkeitszeitraum |
|-----------|-----------|------|---------------------|
| Große Mehrzweckhalle | Montag | 17:00–21:00 | 01.01.–30.06.2026 |
| Große Mehrzweckhalle | Mittwoch | 18:00–22:00 | 01.01.–30.06.2026 |
| Große Mehrzweckhalle | Samstag | 09:00–14:00 | 01.01.–30.06.2026 |
| Kleine Mehrzweckhalle | Dienstag | 16:00–20:00 | 01.01.–30.06.2026 |
| Kleine Mehrzweckhalle | Donnerstag | 17:00–21:00 | 01.01.–30.06.2026 |

#### 2.1.6 Beziehungen (Anlagen)

```
Club (Betreiber)
 └── Facility[] (Anlagen)
      └── ResourceGroup[] (Gruppen)
           ├── sharedScheduling: true → Slot-Verwaltung per Zahnrad pro Ressource
           └── Resource[] (Ressourcen)
                ├── bookingMode: free / slotOnly
                ├── splittable: true → SubResource[]
                └── Slot[] (nur bei slotOnly / sharedScheduling)
```

**Geschäftsregeln:**
- Wenn eine teilbare Ressource ("komplett") gebucht wird, werden automatisch alle Unterressourcen ("links", "rechts") mitgebucht
- Wenn eine Unterressource gebucht ist, kann die übergeordnete Ressource nicht mehr gebucht werden (Konflikt)
- Slot-basierte Ressourcen können NUR innerhalb zugewiesener Zeitfenster gebucht werden
- Beim Löschen einer Ressource werden zugehörige Slots ebenfalls gelöscht
- Beim Löschen einer Gruppe werden alle Ressourcen und deren Slots gelöscht
- Beim Löschen einer Anlage werden alle Gruppen, Ressourcen und Slots gelöscht

---

### 2.2 Organisationsverwaltung (Organization Domain)

#### 2.2.1 Club (Verein – Organisation)

Verein im organisatorischen Sinne. Kann der Heimatverein oder ein Gastverein sein.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | String | ✅ | Eindeutige ID |
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

> **Hinweis:** Heimatverein hat volle Organisationsstruktur. Gastvereine buchen nur bestimmte Anlagen (z.B. Mehrzweckhallen) und haben eine vereinfachte Struktur.

#### 2.2.2 Department (Abteilung)

Sportliche Abteilung innerhalb eines Vereins.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | String | ✅ | Eindeutige ID |
| `clubId` | String | ✅ | FK → Club (Organisation) |
| `name` | String | ✅ | Abteilungsname (z.B. "Fußball") |
| `icon` | String | ✅ | Emoji-Icon |
| `sortOrder` | Number | ✅ | Sortierreihenfolge |

**Demo-Daten:**

| Abteilung | Verein | Icon |
|-----------|--------|------|
| Fußball | SG Hünstetten | ⚽ |
| Leichtathletik | SG Hünstetten | 🏃 |
| Yoga | SG Hünstetten | 🧘‍♂️ |
| Tischtennis | SG Hünstetten | 🏓 |
| Gymnastik | SG Hünstetten | 🤸 |
| Seniorensport | SG Hünstetten | 💪 |
| Handball | TV Idstein | 🤾 |
| Fußball | TSV Wallrabenstein | ⚽ |

#### 2.2.3 Team (Gruppe/Mannschaft)

Konkrete Trainings- oder Wettkampfgruppe.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | String | ✅ | Eindeutige ID |
| `departmentId` | String | ✅ | FK → Department |
| `name` | String | ✅ | Mannschaftsname |
| `shortName` | String | ✅ | Kurzname |
| `color` | String | ✅ | Farbe (Hex) |
| `sortOrder` | Number | ✅ | Sortierreihenfolge |
| `eventTypes` | Array<String> | ✅ | Erlaubte Terminarten (IDs aus EVENT_TYPES) |

**Demo-Daten (Auszug SG Hünstetten → Fußball):**

| Mannschaft | Kurzname | Terminarten |
|-----------|----------|------------|
| 1. Mannschaft (Herren) | Herren I | training, match |
| 2. Mannschaft (Herren) | Herren II | training, match |
| A-Jugend | A-Jgd | training, match |
| B-Jugend | B-Jgd | training, match |
| F-Jugend | F-Jgd | training, match |

**Demo-Daten (Auszug SG Hünstetten → andere Abteilungen):**

| Mannschaft | Abteilung | Terminarten |
|-----------|-----------|------------|
| Leichtathletik 6–8 Jahre | Leichtathletik | training, event |
| Leichtathletik 9–12 Jahre | Leichtathletik | training, event |
| Herren-Yoga | Yoga | training |
| Yoga Mixed | Yoga | training |
| Tischtennis Senioren | Tischtennis | training, match |
| Gymnastikgruppe | Gymnastik | training |
| Seniorensport | Seniorensport | training |

**Demo-Daten (Gastvereine):**

| Mannschaft | Verein / Abteilung | Terminarten |
|-----------|-------------------|------------|
| Handball Damen | TV Idstein / Handball | training, match |
| Herren | TSV Wallrabenstein / Fußball | training, match |

#### 2.2.4 EventType (Terminart)

Globale Aufzählung der möglichen Terminarten.

| ID | Label | Icon | Farbe | Beschreibung |
|----|-------|------|-------|-------------|
| `training` | Training | 🏃 | #3b82f6 | Regelmäßiges Training |
| `match` | Heimspiel | ⚽ | #dc2626 | Wettkampf oder Freundschaftsspiel |
| `event` | Event/Wettkampf | 🎉 | #8b5cf6 | Turnier, Wettkampf, Sonderveranstaltung |
| `other` | Sonstiges | 📋 | #6b7280 | Besprechung, Wartung, etc. |

> **Geschäftsregel:** Eine Mannschaft hat eine Whitelist an erlaubten Terminarten. Die Buchungsanfrage filtert die verfügbaren Terminarten basierend auf der gewählten Mannschaft.

#### 2.2.5 TrainerAssignment (Trainer-Zuordnung)

Verknüpfung zwischen Person (User) und Mannschaft (Team). N:M-Beziehung.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | String | ✅ | Eindeutige ID |
| `userId` | Number | ✅ | FK → User |
| `teamId` | String | ✅ | FK → Team |
| `isPrimary` | Boolean | ✅ | Haupttrainer (true) oder Co-Trainer (false) |

**Geschäftsregeln:**
- Ein Trainer kann mehreren Mannschaften zugeordnet sein (z.B. Anna Schmidt → Herren-Yoga + Yoga Mixed)
- Eine Mannschaft kann mehrere Trainer haben (z.B. 1. Mannschaft → Tom Weber als Haupttrainer + Peter König als Co-Trainer)
- `isPrimary` bestimmt die Anzeige (★ Stern für Haupttrainer, "(Co)" für Co-Trainer)

#### 2.2.6 Beziehungen (Organisation)

```
Club[] (Vereine)
 └── Department[] (Abteilungen)
      └── Team[] (Mannschaften)
           ├── eventTypes[] (erlaubte Terminarten)
           └── TrainerAssignment[] ←→ User[] (N:M)
```

---

### 2.3 Personenverwaltung (User Domain)

#### 2.3.1 User (Benutzer/Person)

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | Number | ✅ | Eindeutige ID |
| `firstName` | String | ✅ | Vorname |
| `lastName` | String | ✅ | Nachname |
| `club` | String | ❌ | Vereinsname (Legacy, wird durch Org-Struktur ersetzt) |
| `team` | String | ❌ | Mannschaftsname (Legacy) |
| `email` | String | ✅ | E-Mail-Adresse |
| `phone` | String | ❌ | Telefonnummer |
| `role` | Enum | ✅ | Rolle: `admin` / `trainer` / `extern` |

#### 2.3.2 Rollen

| Rolle | Label | Beschreibung | Genehmigungspflicht |
|-------|-------|-------------|---------------------|
| `admin` | Administrator | Volle Rechte: Buchungen, Genehmigungen, Verwaltung | ❌ Automatisch genehmigt |
| `trainer` | Trainer | Eigene Buchungen erstellen und verwalten | ❌ Automatisch genehmigt |
| `extern` | Extern | Nur Anfragen stellen | ✅ Muss genehmigt werden |

**Demo-Daten:**

| Person | Verein | Rolle | Trainer-Zuordnung |
|--------|--------|-------|-------------------|
| Max Müller | SG Hünstetten | trainer | A-Jugend (Haupt) |
| Anna Schmidt | SG Hünstetten | trainer | Yoga Mixed (Haupt), Herren-Yoga (Haupt) |
| Tom Weber | SG Hünstetten | trainer | 1. Mannschaft (Haupt) |
| Lisa Braun | SG Hünstetten | trainer | F-Jugend (Haupt) |
| Hans Meier | SG Hünstetten | trainer | Seniorensport (Haupt) |
| Peter König | SG Hünstetten | admin | 1. Mannschaft (Co) |
| Sandra Fischer | TV Idstein | extern | Handball Damen (Haupt) |
| Michael Wagner | TSV Wallrabenstein | extern | Herren (Haupt) |

---

### 2.4 Buchungen (Booking Domain)

#### 2.4.1 Booking (Buchung)

Einzelner Termin einer Ressource.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `id` | Number | ✅ | Eindeutige ID |
| `resourceId` | String | ✅ | FK → Resource |
| `date` | String | ✅ | Datum (ISO: YYYY-MM-DD) |
| `startTime` | String | ✅ | Startzeit (HH:MM) |
| `endTime` | String | ✅ | Endzeit (HH:MM) |
| `title` | String | ✅ | Titel (z.B. "A-Jugend Training") |
| `description` | String | ❌ | Beschreibung |
| `bookingType` | String | ✅ | FK → EventType.id |
| `userId` | Number | ✅ | FK → User (Ersteller / Haupttrainer) |
| `status` | Enum | ✅ | `pending` / `approved` / `rejected` |
| `seriesId` | String | ❌ | Serien-ID (wenn Teil einer Terminserie) |
| `parentBooking` | Boolean | ❌ | Automatisch erzeugte Teilfeld-Buchung |

#### 2.4.2 Buchungslogik

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
- Diese Zusatzbuchungen haben `parentBooking: true`

**Genehmigungsworkflow:**

```
Neue Buchung erstellt
    ├── User.role = admin/trainer → status = 'approved' (sofort)
    └── User.role = extern → status = 'pending' (wartet auf Admin)
         ├── Admin genehmigt → status = 'approved'
         └── Admin lehnt ab → status = 'rejected' (mit Begründung)
```

#### 2.4.3 Konflikterkennung

Bei Buchungsanfragen werden folgende Konflikte erkannt:

| Konflikttyp | Schweregrad | Beschreibung |
|-------------|------------|-------------|
| `time_overlap` | error/warning | Zeitüberschneidung mit bestehender Buchung auf derselben Ressource |
| `composite_blocked` | error/warning | Teilfeld belegt → Ganzes Feld nicht buchbar |
| `parent_blocked` | error/warning | Ganzes Feld gebucht → Teilfeld nicht buchbar |
| `no_slot` | error | Kein verfügbarer Slot an diesem Tag (nur slot-basiert) |
| `outside_slot` | error | Gewünschte Zeit liegt außerhalb des Slots |

> `allowOverlap` auf dem EventType bestimmt ob eine Überschneidung ein Error (blockiert) oder eine Warning (erlaubt mit Hinweis) ist. Aktuell hat nur "Sonstiges" `allowOverlap: true`.

---

## 3. Seiten & UI-Komponenten

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

### 3.2 Kalender (CalendarView)

**Zweck:** Wochenübersicht aller Buchungen pro Ressource

**Aufbau:**
1. **Facility-Dropdown** (oben): Auswahl der Anlage + Anzeige der Adresse
2. **Gruppen-Tabs**: Ressourcengruppen der gewählten Anlage (z.B. Außenanlagen | Innenräume)
3. **Ressourcen-Tabs**: Einzelressourcen der gewählten Gruppe
4. **Wochennavigation**: ← Prev | "KW XX: DD.MM – DD.MM.YYYY" | Next →
5. **Kalender-Grid**: 7 Tage × Zeitslots (8:00–22:00), Buchungen als farbige Blöcke

**Features:**
- Buchungen zeigen Titel, Zeit, Typ-Icon und Trainer-Name
- Farbcodierung nach Ressource
- Status-Badges: Genehmigt (grün), Ausstehend (gelb), Abgelehnt (rot)
- Klick auf Datum → Tagesansicht (TODO)

### 3.3 Meine Buchungen (MyBookings)

**Zweck:** Übersicht aller Buchungen des aktuellen Benutzers (oder aller, im Admin-Modus)

**Layout:** 4-Spalten Flexbox mit Farbbalken

```
┌─┬──────────────────┬─────────────────┬──────────────────┬──────────┐
│▌│ Spalte 1          │ Spalte 2        │ Spalte 3         │ Spalte 4 │
│▌│ Buchungsinfo      │ Trainer         │ Organisation     │ Status   │
├─┼──────────────────┼─────────────────┼──────────────────┼──────────┤
│▌│ "A-Jugend Train." │ TRAINER/ÜBUNSGL │ 🏃 Training      │ Genehmigt│
│▌│ 📍 Sportplatz li. │ ★ Max Müller    │ 🔵 SG Hünstetten │ × 1 Term.│
│▌│ 📅 Jeden Dienstag │                 │   ⚽ Fußball      │ × Serie  │
│▌│ 🕐 16:00 – 18:00  │                 │     A-Jugend     │          │
│▌│ 📅 10.02.–30.06.  │                 │                  │          │
└─┴──────────────────┴─────────────────┴──────────────────┴──────────┘
```

**Features:**
- Farbbalken links = Ressourcenfarbe
- Spalte 1: Titel, Ressource (📍), Wochentag (📅), Uhrzeit (🕐), Datumsbereich (📅)
- Spalte 2: Header "TRAINER / ÜBUNGSLEITER", Trainerliste mit ★ (Haupt) und (Co)
- Spalte 3: Event-Typ mit Icon, Vereinsname mit Farbpunkt, Abteilung mit Icon, Mannschaft
- Spalte 4: Status-Badge (Pill), Lösch-Buttons (einzeln / Serie) als rote Pills
- Lösch-Bestätigung mit Ja/Nein Dialog

### 3.4 Neue Anfrage (BookingRequest)

**Zweck:** Neue Buchungsanfrage erstellen

**Formular-Schritte:**

| Schritt | Sektion | Felder |
|---------|---------|--------|
| 1 | **Ressource auswählen** | Anlage → Bereich → Ressource (3 kaskadierende Dropdowns) |
| 2 | **Mannschaft auswählen** | Verein → Abteilung → Mannschaft (3 kaskadierende Dropdowns) + Trainer-Anzeige |
| 3 | **Terminart** | Gefiltert auf erlaubte Terminarten der Mannschaft (Kacheln) |
| 4 | **Terminplanung** | Toggle: Einzeltermin / Terminserie |
| 4a | – Einzeltermin | Datum, Startzeit, Endzeit |
| 4b | – Terminserie | Wochentag, Startzeit, Endzeit, Startdatum, Enddatum |
| 5 | **Buchungsdetails** | Titel (auto-vorgeschlagen aus Mannschaft + Terminart), Beschreibung |
| 6 | **Vorschau** | Terminliste mit Konfliktprüfung (grün/gelb/rot) |
| 7 | **Zusammenfassung** | Alle gewählten Daten auf einen Blick |
| 8 | **Absenden** | Button mit Terminanzahl |

**Geschäftsregeln:**
- Titel wird automatisch vorgeschlagen: "{Mannschaftsname} {Terminart}" (z.B. "A-Jugend Training")
- Bei Heimspiel/Event springt Terminplanung automatisch auf "Einzeltermin"
- Trainer werden automatisch aus der Mannschafts-Zuordnung ermittelt
- Primärer Trainer wird als buchende Person verwendet
- Slot-basierte Ressourcen zeigen verfügbare Zeitfenster an
- Teilbare Ressourcen zeigen Hinweis "Reserviert automatisch beide Hälften"
- Submit-Button zeigt Terminanzahl und ist deaktiviert bei Konflikten

### 3.5 Genehmigungen (Approvals)

**Zweck:** Admin-Übersicht ausstehender Buchungsanfragen

**Features:**
- Filtert `status === 'pending'`
- Zeigt: Titel, Ressource, Datum/Zeit, Buchungstyp, Benutzer
- Aktionen: Genehmigen / Ablehnen (mit optionaler Begründung)
- E-Mail-Benachrichtigung bei Genehmigung/Ablehnung

### 3.6 Personen (UserManagement)

**Zweck:** Benutzerkonten verwalten (CRUD)

**Features:**
- Benutzerliste mit Vor-/Nachname, E-Mail, Telefon, Verein, Mannschaft, Rolle
- Neuen Benutzer anlegen
- Benutzer bearbeiten / löschen
- Rollenauswahl: Administrator / Trainer / Extern
- Farbcodierung nach Rolle

### 3.7 Organisation (OrganizationManagement)

**Zweck:** Vereine, Abteilungen, Mannschaften und Trainer-Zuordnungen verwalten

**Aufbau (3 Ebenen, aufklappbar):**

```
🔵 SG Hünstetten (SGH) ← Vereins-Farbpunkt + Name + Kürzel
├── ⚽ Fußball ← Abteilung mit Icon
│   ├── 1. Mannschaft (Herren)
│   │   ├── ★ Tom Weber (Haupttrainer)
│   │   └── Peter König (Co-Trainer)
│   ├── A-Jugend
│   │   └── ★ Max Müller (Haupttrainer)
│   └── ... weitere Mannschaften
├── 🏃 Leichtathletik
│   └── ...
└── ... weitere Abteilungen

🔴 TV Idstein (TVI)
└── 🤾 Handball
    └── Handball Damen
        └── ★ Sandra Fischer (extern)
```

**Features pro Ebene:**
- **Verein:** Name, Kürzel, Farbe, Heimatverein-Flag; CRUD
- **Abteilung:** Name, Icon (Emoji aus Dropdown), Sortierung; CRUD
- **Mannschaft:** Name, Kurzname, Farbe, erlaubte Terminarten (Checkboxen); CRUD
- **Trainer-Zuordnung:** Person (Dropdown aus Benutzerliste), Haupt-/Co-Trainer Toggle; Hinzufügen/Entfernen

### 3.8 Anlagen (FacilityManagement)

**Zweck:** Physische Standorte, Ressourcengruppen und Ressourcen verwalten

**Aufbau (3 Ebenen, aufklappbar):**

```
🏗️ Biogrund Sportpark ← Anlage
│  Am Sportpark 1, 65510 Hünstetten-Görsroth
├── 🏟️ Außenanlagen ← Gruppe (outdoor, Slots: ❌)
│   ├── [■] Sportplatz - komplett [✓ Teilbar] [Farbwähler] [🗑]
│   │   ├── Sportplatz - links [Farbwähler] [🗑]
│   │   └── Sportplatz - rechts [Farbwähler] [🗑]
│   ├── [■] Fußball-Kleinfeld [Farbwähler] [🗑]
│   └── [+ Neue Ressource]
├── 🏠 Innenräume ← Gruppe (indoor, Slots: ❌)
│   ├── Gymnastikraum
│   ├── Fitnessraum
│   └── Vereinsgastronomie
└── [+ Neue Ressourcengruppe]

🏗️ DGH Görsroth
├── 🏛️ Mehrzweckhallen ← Gruppe (shared, Slots: ✅)
│   ├── [■] Große Mehrzweckhalle [⚙️ 3] ← Zahnrad mit Slot-Anzahl
│   │   └── 🕐 Zeitfenster (Slots)  ← Gelbes Inline-Panel
│   │       ├── Mo 17:00–21:00 (01.01.–30.06.2026)
│   │       ├── Mi 18:00–22:00 (01.01.–30.06.2026)
│   │       ├── Sa 09:00–14:00 (01.01.–30.06.2026)
│   │       └── [+ Neuer Slot]
│   └── [■] Kleine Mehrzweckhalle [⚙️ 2]
└── [+ Neue Ressourcengruppe]
```

**Features pro Ebene:**
- **Anlage:** Name, Adresse (Straße, Nr, PLZ, Ort); Bearbeiten/Löschen
- **Gruppe:** Name (inline-editierbar), Kategorie-Dropdown (outdoor/indoor/shared), Slots-Checkbox, Löschen
- **Ressource:** Name (inline-editierbar), Farbe (Farbwähler + Presets), Teilbar-Checkbox, Slot-Pflicht-Checkbox
  - Bei Teilbar: Unterressourcen mit eigenem Namen und Farbe
  - Bei Gruppe mit Slots ✅: Zahnrad-Icon pro Ressource → Inline-Slot-Panel
- **Slot-Panel (gelb):** Wochentag, Start-/Endzeit, Gültigkeitszeitraum; Anlegen/Löschen

### 3.9 E-Mail-Log (EmailLog)

**Zweck:** Übersicht aller versendeten E-Mail-Benachrichtigungen (Demo)

**E-Mail-Templates:**
- `bookingCreated`: Bestätigung an Ersteller
- `bookingApproved`: Genehmigungsbenachrichtigung
- `bookingRejected`: Ablehnungsbenachrichtigung (mit Begründung)
- `adminNewBooking`: Benachrichtigung an Admins bei externen Anfragen

### 3.10 Monatsplan PDF (PDFExportPage)

**Zweck:** PDF-Export des Buchungsplans für einen Monat

**Features:**
- Monats-/Jahresauswahl
- Ressource-Filter
- PDF-Generierung mit Buchungsübersicht

---

## 4. Legacy-Kompatibilität

### 4.1 buildLegacyResources()

Die Funktion `buildLegacyResources()` in `facilityConfig.js` konvertiert das neue hierarchische Ressourcenmodell in das flache Format, das bestehende Komponenten (Kalender, Buchungsanfragen, Konfliktprüfung) erwarten:

**Neues Modell → Legacy-Format:**
- `resource.bookingMode === 'slotOnly'` → `type: 'limited'`
- `resource.bookingMode === 'free'` → `type: 'regular'`
- `resourceGroup.icon` → `category` (outdoor/indoor/shared)
- `resource.splittable + subResources` → `isComposite: true` + `includes[]` + separate Einträge mit `partOf`

> **Für die DB-Implementierung:** Diese Konvertierungsfunktion wird nicht mehr benötigt. Das Datenmodell wird direkt auf dem neuen hierarchischen Modell aufbauen.

### 4.2 constants.js (Alt-Daten)

Die Datei `constants.js` enthält noch alte, hartcodierte Demo-Daten:
- `RESOURCES` – ersetzt durch `facilityConfig.js`
- `BOOKING_TYPES` – ersetzt durch `EVENT_TYPES` in `organizationConfig.js`
- `ROLES` – wird beibehalten (Rollen-Definition)
- `DEMO_USERS` – wird in DB migriert
- `DEMO_BOOKINGS` – wird in DB migriert
- `DEMO_SLOTS` – wird in DB migriert
- `DAYS` / `DAYS_FULL` – Utility-Konstanten, bleiben

---

## 5. Geschäftsregeln (Zusammenfassung)

### 5.1 Buchungsregeln

1. Slot-basierte Ressourcen können **nur** innerhalb zugewiesener Zeitfenster gebucht werden
2. Bei Buchung einer teilbaren Ressource ("komplett") werden **automatisch** alle Unterressourcen mitgebucht
3. Wenn eine Unterressource belegt ist, kann das übergeordnete "Ganze" **nicht** gebucht werden
4. Termine vom Typ `training` sind **typischerweise Terminserien** (wöchentlich wiederkehrend)
5. Termine vom Typ `match` und `event` sind **typischerweise Einzeltermine**
6. Der Titel wird **automatisch vorgeschlagen**: "{Mannschaft} {Terminart}"
7. Buchungen von `extern`-Benutzern erfordern **Admin-Genehmigung**

### 5.2 Löschregeln

1. Einzeltermin löschen: Nur dieser eine Termin
2. Serie löschen: Alle Termine mit derselben `seriesId`
3. Ressource löschen: Zugehörige Slots werden mitgelöscht
4. Gruppe löschen: Alle Ressourcen und Slots werden mitgelöscht
5. Anlage löschen: Alles darunter (Gruppen, Ressourcen, Slots) wird mitgelöscht
6. Alle kaskadierenden Löschungen erfordern **Bestätigung**

### 5.3 Organisations-Regeln

1. Jede Mannschaft hat eine **Whitelist** erlaubter Terminarten
2. Ein Trainer kann **mehreren** Mannschaften zugeordnet sein
3. Eine Mannschaft kann **mehrere** Trainer haben (Haupt + Co)
4. Der **Heimatverein** hat volle Organisationsstruktur
5. **Gastvereine** buchen nur bestimmte Anlagen (z.B. Mehrzweckhallen)

---

## 6. Datei-Struktur (Prototyp)

```
src/
├── App.js                          # Hauptkomponente, State-Management, Routing
├── index.js                        # React Entry Point
├── index.css                       # Globale Styles + Tailwind
├── config/
│   ├── constants.js                # Legacy-Konstanten, Demo-Daten, Rollen
│   ├── facilityConfig.js           # Anlagen-Datenmodell + buildLegacyResources()
│   └── organizationConfig.js       # Organisations-Datenmodell + EventTypes
├── components/
│   ├── Sidebar.js                  # Navigation
│   ├── CalendarView.js             # Kalender-Wochenansicht
│   ├── BookingRequest.js           # Neue Buchungsanfrage
│   ├── MyBookings.js               # Buchungsübersicht
│   ├── PDFExportPage.js            # PDF-Export
│   ├── PDFExportDialog.js          # PDF-Export-Dialog
│   ├── ui/
│   │   └── Badge.js                # Badge + Button Komponenten
│   └── admin/
│       ├── Approvals.js            # Genehmigungen
│       ├── UserManagement.js       # Personen-Verwaltung
│       ├── OrganizationManagement.js # Organisation (Vereine/Abteilungen/Mannschaften)
│       ├── FacilityManagement.js   # Anlagen (inkl. Slot-Verwaltung)
│       ├── SlotManagement.js       # [DEPRECATED] Alte Slot-Seite (nicht mehr verlinkt)
│       └── EmailLog.js             # E-Mail-Protokoll
├── services/
│   └── emailService.js             # E-Mail-Service (Mock)
└── utils/
    └── helpers.js                  # Hilfsfunktionen (Datum, Konflikte, etc.)
```

---

## 7. Offene Punkte / TODO für DB-Implementierung

### 7.1 Datenmodell-Entscheidungen

- [ ] Soll `Club` (Betreiber) und `Club` (Organisation) dieselbe Tabelle sein?
- [ ] Wie wird Multi-Tenancy umgesetzt? (Mehrere Betreiber-Vereine?)
- [ ] Soll `constants.js` komplett aufgelöst werden?
- [ ] Wie werden historische Buchungen archiviert?

### 7.2 Fehlende Features

- [ ] Authentifizierung / Login-System
- [ ] Echte E-Mail-Vers