# CLAUDE.md – SG Hünstetten Buchungssystem

## Projektübersicht

Internes Buchungssystem für Sportstätten der SG Hünstetten. React-SPA mit Supabase-Backend.
**Live:** https://sg-huenstetten-buchung-iota.vercel.app

## Tech Stack

- **Frontend:** React 18.2, React Router 6, Tailwind CSS (CDN – nicht als Build-Dependency!)
- **Backend:** Supabase (PostgreSQL, Auth, Row Level Security)
- **PDF:** jsPDF 2.5 (als npm-Dependency)
- **Icons:** Lucide React
- **Datepicker:** react-datepicker 9.1 mit date-fns (deutsche Locale)
- **Hosting:** Vercel (Auto-Deploy auf `main`)
- **Build:** Create React App (react-scripts 5.0.1), `CI=false` beim Build

## Befehle

```bash
npm start          # Dev-Server auf localhost:3000
npm run build      # Production Build (CI=false unterdrückt Warnings als Errors)
npm test           # react-scripts test (aktuell keine Tests vorhanden)
```

## Projektstruktur

```
src/
├── contexts/          # React Context Provider (Auth, Facility, Organization, Booking, User, Holiday)
├── hooks/             # useBookingActions, useConfirm, useSupabase (zentrale DB-Logik, 887 Zeilen)
├── routes/            # ProtectedRoute (Auth-Guard), PermissionRoute (Rollen-Guard)
├── components/
│   ├── ui/            # Shared: Button, Badge, Modal, ConfirmDialog, EmptyState, etc.
│   ├── admin/
│   │   ├── facilities/    # Anlagenverwaltung (Facility → ResourceGroup → Resource)
│   │   ├── organization/  # Vereine → Abteilungen → Mannschaften
│   │   ├── users/         # Benutzerverwaltung + Genehmiger-Zuweisungen
│   │   └── holidays/      # Feiertage
│   ├── CalendarView.js    # Wochenkalender (7–22 Uhr Raster)
│   ├── BookingRequest.js  # Mehrstufiges Buchungsformular
│   ├── MyBookings.js      # Eigene Buchungen mit Serien-Gruppierung
│   └── PDFExportPage.js   # Monatsplan-PDF pro Kategorie
├── config/
│   ├── constants.js       # ROLES, DAYS, COLOR_PRESETS, GROUP_ICONS
│   ├── organizationConfig.js  # EVENT_TYPES, Default-Daten für Demo-Modus
│   └── facilityConfig.js     # Default-Anlagen, buildBookableResources()
├── services/emailService.js   # E-Mail-Templates + Logging
├── lib/supabase.js            # Supabase-Client Init
└── utils/helpers.js           # Datum-/Format-Helfer
```

## Code-Konventionen

- **Sprache:** Deutsch in Kommentaren, UI-Texten, Commit-Messages. Variablen/Funktionen gemischt (deutsch für Domain-Begriffe wie `kannBuchen`, englisch für generische wie `handleSubmit`)
- **Variablen/Funktionen:** camelCase
- **Komponenten/Dateien:** PascalCase
- **Konstanten:** UPPER_SNAKE_CASE
- **DB-Spalten:** snake_case in PostgreSQL, automatisch zu camelCase konvertiert via Mapper in `useSupabase.js`
- **Styling:** Tailwind-Utility-Klassen inline, keine separaten CSS-Dateien
- **Icons:** Lucide React, per Komponente importiert
- **Barrel-Exports:** `index.js` in ui/, admin/, facilities/, organization/, users/

## Architektur-Patterns

**Context-Pattern:** Jeder Context hat Provider + Custom Hook mit Null-Check:
```
createContext(null) → SomeProvider({ children }) → useSome() mit Error bei fehlendem Provider
```

**Demo-Modus:** Contexts prüfen `isDemo` und fallen auf DEFAULT_*-Daten zurück. CRUD gibt `{ error: 'Demo-Modus' }` zurück.

**Daten-Mapping:** `useSupabase.js` enthält alle DB↔App Mapper (mapProfile, mapFacility, mapBooking, etc.) für snake_case↔camelCase.

**Routing:** `<ProtectedRoute>` (Auth) wrapping `<PermissionRoute requiredPermission="kannBuchen">` (Rolle).

**Rollen:** admin, genehmiger, trainer, extern. Berechtigungsprüfung über `kannBuchen`, `kannGenehmigen`, `kannAdministrieren` aus AuthContext.

## Datenbank

Supabase PostgreSQL mit RLS. Migrationen in `supabase/migrations/` (001–012).

**Wichtige Tabellen:**
- `profiles` – Benutzer (UUID PK, verknüpft mit Supabase Auth)
- `facilities` → `resource_groups` → `resources` (hierarchisch, resources können parent_resource_id haben für Splits)
- `bookings` – Einzeltermine + Serien (series_id), Status: pending/approved/rejected
- `clubs` → `departments` → `teams` → `trainer_assignments`
- `genehmiger_resource_assignments` – Genehmiger↔Ressourcen-Zuordnung
- `holidays` – Feiertage
- `sent_emails` – E-Mail-Log

**ENUMs:** user_role, booking_mode (single/recurring), booking_status, booking_type, resource_group_icon

**IDs:** Immer UUID via `gen_random_uuid()`

## Datum/Zeit

- **DB-Format:** YYYY-MM-DD (Datum), HH:mm (Zeit, 24h)
- **UI-Format:** dd.MM.yyyy (deutsch)
- **Helfer:** `formatDate()`, `formatDateISO()`, `getWeekStart()`, `getWeekDates()` in utils/helpers.js
- **Kalender:** Woche Mo–So, Stunden 7–22

## Umgebungsvariablen

```
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=xxx
```

Vorlage in `.env.example`. Niemals `.env` committen.

## Deployment

- Push auf `main` → automatisches Vercel-Deployment
- `vercel.json` enthält SPA-Rewrites (alle Routen → index.html)
- Env-Variablen in Vercel Dashboard pflegen

## Bekannte Einschränkungen

- **Tests:** Basis-Tests für `utils/helpers.js` vorhanden (46 Tests). `npm test` ausführen nach Änderungen an Helfer-/Logik-Funktionen
- **Tailwind via CDN** – kein Purging, keine Build-Time-Optimierung
- **Keine TypeScript** – reines JavaScript
- **Kein Linting-Setup** – nur Standard react-app ESLint-Config

## Workflow: Visuelle Änderungen (UI, PDF, Layout)

Claude kann keine gerenderten Ergebnisse sehen. Bei visuellen Aufgaben diesen Ablauf einhalten:

1. **Vorher:** User liefert Screenshot des aktuellen Zustands
2. **Akzeptanzkriterien definieren** bevor Code geschrieben wird, z.B.:
   - "4 Zeilen pro Tag, max 5mm Blockhöhe, Schrift lesbar ab 2.5pt"
   - "Mobile: Sidebar eingeklappt, Kalender scrollbar"
   - "Farbe X für Status Y, Abstand Z zwischen Elementen"
3. **Umsetzung** basierend auf konkreten Zahlenwerten, nicht auf vagen Beschreibungen
4. **Nachher:** User liefert Screenshot → Vergleich mit Akzeptanzkriterien
5. **Korrekturen** nur mit erneutem Screenshot und konkreter Beschreibung ("Abstand zu groß" → "Abstand soll 4px statt 12px sein")

**Warum:** Ohne diesen Ablauf entstehen viele Iterationsschleifen, weil Claude blind an Pixel-Werten arbeitet.

## Workflow: Aufgaben strukturiert angehen

Vor Beginn jeder größeren Aufgabe:

1. **Scope klären** – Was genau soll sich ändern? Welche Dateien sind betroffen?
2. **Akzeptanzkriterien festlegen** – Wann ist die Aufgabe fertig?
3. **Bestehenden Code lesen** – Nie Code ändern, ohne ihn vorher gelesen zu haben
4. **Plan erstellen** – Bei Tasks >3 Schritte: TodoWrite nutzen oder Plan-Agent verwenden
5. **Testen** – Nach Änderungen: `npm run build` prüfen, Tests laufen lassen (wenn vorhanden)

## Hinweise für Claude Code Sessions

- `useSupabase.js` ist die zentrale Datei für alle DB-Operationen (887 Zeilen) – bei DB-Änderungen immer dort prüfen
- Tailwind-Klassen direkt in JSX, keine CSS-Dateien anlegen
- Bestehende UI-Komponenten aus `components/ui/` wiederverwenden (Button, Modal, Badge, etc.)
- Dokumentation in `docs/PROTOTYPE-DOCUMENTATION.md` (37KB) enthält ER-Diagramme, API-Details, Berechtigungsmatrix
- Bei Supabase-Queries: snake_case verwenden, Mapper in useSupabase.js konvertieren zu camelCase
- Neue Komponenten immer in den passenden Unterordner legen und im jeweiligen `index.js` exportieren
