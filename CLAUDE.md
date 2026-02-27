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
npm test           # react-scripts test (Tests für helpers.js, ToastContext, useBookingActions)
```

## Projektstruktur

```
src/
├── contexts/          # React Context Provider
│                      #   Auth, Facility, Organization, Booking, User, Holiday, Toast
├── hooks/             # Domain-spezifische DB-Hooks:
│                      #   useBookings, useFacilities, useOrganization, useUsers,
│                      #   useHolidays, useOperators, useGenehmigerResources
│                      #   useTrainerProfile (Self-Service), useTrainerVerwaltung (Admin)
│                      #   useTrainerUebersicht (Intranet-Liste)
│                      #   + useBookingActions, useConfirm
│                      #   useSupabase.js = dünner Re-Export-Wrapper (~23 Zeilen)
├── routes/            # ProtectedRoute (Auth-Guard), PermissionRoute (Rollen-Guard)
├── components/
│   ├── ui/            # Shared: Button, Badge, Modal, ConfirmDialog, EmptyState,
│   │                  #         ErrorBoundary, ExpandableSection, PageHeader, etc.
│   ├── admin/
│   │   ├── facilities/    # Anlagenverwaltung (Facility → ResourceGroup → Resource)
│   │   ├── organization/  # Vereine → Abteilungen → Mannschaften
│   │   ├── users/         # Benutzerverwaltung + Genehmiger-Zuweisungen
│   │   ├── holidays/      # Feiertage & Schulferien
│   │   └── trainer/       # Trainerverwaltung (Admin-Seite)
│   ├── trainer/           # Trainer Self-Service
│   │   ├── TrainerProfil.js   # Mein Trainer-Profil
│   │   ├── LizenzForm.js      # Inline-Formular Lizenz
│   │   └── ErfolgForm.js      # Inline-Formular Erfolg
│   ├── TrainerUebersicht.js   # Intranet-Übersicht (alle Auth-User)
│   ├── TrainerUebersichtCard.js # Kompakte Trainer-Karte
│   ├── TrainerDetailModal.js  # Vollprofil-Modal
│   ├── CalendarView.js    # Wochen-/Tageskalender (7–22 Uhr Raster, Tag/Woche Toggle)
│   ├── BookingRequest.js  # Mehrstufiges Buchungsformular
│   ├── BookingEditModal.js # Buchung bearbeiten
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

**Daten-Mapping:** Die domain-spezifischen Hooks (`useBookings`, `useFacilities`, etc.) enthalten alle DB↔App Mapper (mapProfile, mapFacility, mapBooking, etc.) für snake_case↔camelCase. `useSupabase.js` ist nur noch ein dünner Re-Export-Wrapper.

**Routing:** `<ProtectedRoute>` (Auth) wrapping `<PermissionRoute requiredPermission="kannBuchen">` (Rolle).

**Rollen:** admin, genehmiger, verwalter, trainer, extern. Berechtigungsprüfung über `kannBuchen`, `kannGenehmigen`, `kannAdministrieren`, `kannVerwalten` aus AuthContext.

## Datenbank

Supabase PostgreSQL mit RLS. Migrationen in `supabase/migrations/` (001–023, ab 013 via MCP).

**Wichtige Tabellen:**
- `profiles` – Benutzer (UUID PK, verknüpft mit Supabase Auth). Zusatzfelder für Trainer: `ist_trainer`, `stammverein_id` (FK clubs), `stammverein_andere`
- `facilities` → `resource_groups` → `resources` (hierarchisch, resources können parent_resource_id haben für Splits)
- `bookings` – Einzeltermine + Serien (series_id), Status: pending/approved/rejected
- `clubs` → `departments` → `teams` (mit `ist_jugendmannschaft` Flag) → `trainer_assignments`
- `genehmiger_resource_assignments` – Genehmiger↔Ressourcen-Zuordnung
- `holidays` – Feiertage
- `sent_emails` – E-Mail-Log
- `trainer_profile_details` – Trainer-Profil 1:1 zu profiles (Bio, Foto, IBAN, FZ, VK, Chip-ID, Veröffentlichungs-Flags, Postadresse)
- `trainer_lizenzen` – Lizenzen & Zertifikate 1:n zu profiles
- `trainer_erfolge` – Erfolge 1:n zu profiles

**ENUMs:** user_role, booking_mode (single/recurring), booking_status, booking_type, resource_group_icon

**IDs:** Immer UUID via `gen_random_uuid()`

**Supabase Storage Buckets:**
- `trainer-fotos` – public (Profilfotos)
- `trainer-dokumente` – private (Führungszeugnisse, Zugriff via Signed URL)

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

## Supabase Edge Functions

Liegen in `supabase/functions/<name>/index.ts`. Deployment **direkt via Supabase MCP Tool** (`deploy_edge_function`), kein CLI nötig.

**Projekt-ID:** `zqjheewhgrmcwzjurjlg`

**Deployed Functions:**

| Function | verify_jwt | Zweck |
|---|---|---|
| `send-email` | true | E-Mail via Resend API, loggt in `sent_emails` |
| `invite-trainer` | **false** | Supabase Auth Einladung + `invited_at` Update |
| `ical` | false | iCal-Feed per Ressource |

**Edge Function Struktur:**
```ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  // ... logic
});
```

**Env-Variablen in Edge Functions** (automatisch verfügbar, kein Setup nötig):
- `SUPABASE_URL` – Projekt-URL
- `SUPABASE_SERVICE_ROLE_KEY` – bypassed RLS, nur serverseitig verwenden
- `RESEND_API_KEY`, `FROM_EMAIL` – manuell in Supabase Dashboard hinterlegt

**verify_jwt:** Standardmäßig `true`. Auf `false` setzen wenn:
- Die Funktion vom Frontend ohne garantierte Auth-Session aufgerufen wird
- Die Funktion einen eigenen Auth-Mechanismus hat (z.B. Service Role Key intern)

## Supabase MCP

Claude hat direkten Zugriff auf das Supabase-Projekt via MCP:
- `execute_sql` – SQL direkt ausführen (für Abfragen, kein DDL)
- `apply_migration` – DDL-Migrationen anlegen (neue Tabellen, Spalten, Policies)
- `deploy_edge_function` – Edge Function direkt deployen ohne CLI
- `get_logs` – Logs für api/postgres/edge-function/auth/storage abrufen
- `get_advisors` – Security- und Performance-Hinweise

## RLS Policy Konventionen (seit Migration 021)

**Alle 17 Tabellen haben RLS aktiviert.** Hilfsfunktion `is_admin()` prüft `kann_administrieren`.

```sql
-- SELECT: Immer auf authenticated beschränkt
CREATE POLICY "select_authenticated" ON my_table FOR SELECT TO authenticated USING (true);

-- INSERT/UPDATE/DELETE: Admin-only für Konfigurationstabellen
CREATE POLICY "insert_admin" ON my_table FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Bookings: eigene oder Admin/Genehmiger
CREATE POLICY "update_own_or_admin_or_genehmiger" ON bookings FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin() OR EXISTS (...kann_genehmigen...));

-- Profiles: eigene oder Admin (Trigger schützt Berechtigungs-Flags)
CREATE POLICY "update_own_or_admin" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin());
```

**Trigger `protect_permission_flags`:** Non-Admins können eigene Profile-Felder ändern, aber nicht `kann_buchen`, `kann_genehmigen`, `kann_administrieren`, `kann_verwalten`, `ist_trainer`, `operator_id`, `role`.

Edge Functions mit `SUPABASE_SERVICE_ROLE_KEY` umgehen RLS vollständig.

## Bekannte Einschränkungen

- **Tests:** Tests für `utils/helpers.js` (46), `ToastContext` und `useBookingActions` vorhanden. `npm test` nach Änderungen an Helfer-/Logik-Funktionen ausführen.
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

- DB-Operationen sind auf Domain-Hooks aufgeteilt: `useBookings`, `useFacilities`, `useOrganization`, `useUsers`, `useHolidays`, `useOperators`, `useGenehmigerResources`, `useTrainerProfile`, `useTrainerVerwaltung`, `useTrainerUebersicht`
- `useSupabase.js` ist nur noch ein dünner Re-Export-Wrapper, nicht mehr die zentrale Logik-Datei
- Tailwind-Klassen direkt in JSX, keine CSS-Dateien anlegen
- Bestehende UI-Komponenten aus `components/ui/` wiederverwenden (Button, Modal, Badge, ErrorBoundary, etc.)
- Dokumentation in `docs/PROTOTYPE-DOCUMENTATION.md` enthält ER-Diagramme, API-Details, Berechtigungsmatrix
- Bei Supabase-Queries: snake_case verwenden, Mapper im jeweiligen Domain-Hook konvertieren zu camelCase
- Neue Komponenten immer in den passenden Unterordner legen und im jeweiligen `index.js` exportieren

## Trainer-Portal – wichtige Patterns

**Vereinszuordnung aus Team-Assignments ableiten:**
Niemals `aktivFuer`-Clubs separat speichern. Die Vereins-/Abteilungszugehörigkeit ergibt sich immer live aus:
```js
trainerAssignments → teams → departments → clubs
```

**Partielles Upsert in `useTrainerProfile`:**
`upsertProfile(data)` verwendet `'key' in data`-Checks, sodass nur explizit übergebene Felder gesetzt werden (kein versehentliches null-Überschreiben):
```js
if ('bio' in data) dbData.bio = data.bio ?? null;
if ('profilVeroeffentlichen' in data) dbData.profil_veroeffentlichen = data.profilVeroeffentlichen;
// etc.
```

**AuthContext `profile` ist snake_case:**
`profile.first_name`, `profile.last_name`, `profile.email` – kommt direkt aus DB ohne Mapping.
Users aus `useUserContext()` sind dagegen camelCase-gemappt.

**`stammvereinAndere` Semantik:**
- `null` = "Andere" nicht ausgewählt
- `''` (leerer String) = "Andere" ausgewählt, aber Freitext noch leer
- `'Vereinsname'` = "Andere" ausgewählt mit Text

## Bekannte SQL-Fallstricke

- `CREATE POLICY IF NOT EXISTS` existiert in PostgreSQL **nicht** → stattdessen `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE ...) THEN CREATE POLICY...; END IF; END $$;`
- Supabase upsert (PostgREST) updated bei Konflikt **nur die im Payload enthaltenen Spalten** – andere Spalten bleiben unverändert
- `UsersRound` gibt es in lucide-react nicht → `Users` verwenden
- `PageHeader` nimmt `actions` (nicht `action`) als Prop für Buttons oben rechts
