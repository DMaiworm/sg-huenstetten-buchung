# SG Hünstetten – Ressourcen-Buchungssystem

Internes Buchungssystem für Sportstätten und Räumlichkeiten der SG Hünstetten. Mitglieder können Anlagen buchen, Genehmiger prüfen Anfragen, und Admins verwalten Benutzer, Anlagen und Organisationsstruktur.

**Live:** [sg-huenstetten-buchung-iota.vercel.app](https://sg-huenstetten-buchung-iota.vercel.app)

## Features

- **Kalender** – Wochen- und Tagesansicht (Toggle), Stundenraster (7–22 Uhr), Facility-/Gruppen-/Ressource-Auswahl
- **Buchungsanfragen** – Einzeltermine und wiederkehrende Serien mit Live-Konfliktprüfung
- **Genehmigungsworkflow** – Anfragen genehmigen oder ablehnen, mit optionalem Kommentar
- **Rollen & Berechtigungen** – Admin, Trainer, Genehmiger, Extern (einladungsbasiert)
- **Genehmiger-Ressourcen** – Admins weisen Genehmigern gezielt einzelne Ressourcen zu
- **Anlagenverwaltung** – Anlagen → Gruppen → Ressourcen (inklusive Unter-Ressourcen, Splittable-Felder, Slot-basierte Verfügbarkeit)
- **Organisationsstruktur** – Vereine → Abteilungen → Mannschaften, Trainer-Zuordnung
- **Benutzerverwaltung** – Einladung per E-Mail, Rollenzuweisung, Trainer-Status, Stammverein
- **Trainer-Portal** – Self-Service-Profil (Bio, Foto, IBAN, Kontaktdaten, Lizenzen, Erfolge, Einwilligungen), Admin-Verwaltung (FZ, Chip-ID, Notizen)
- **Trainerübersicht** – Intranet-Seite mit gefilterten Trainer-Karten und Vollprofil-Modal
- **PDF-Export** – Monatsplan pro Kategorie als PDF (jsPDF)
- **Meine Buchungen** – Filterbarer Überblick aller eigenen Buchungen mit Serien-Gruppierung
- **Ferien & Feiertage** – Verwaltung und Import von Schulferien/Feiertagen
- **iCal-Feed** – Buchungen als Kalender-Abonnement pro Ressource (Supabase Edge Function)
- **Toast-Benachrichtigungen** – In-App-Feedback nach Aktionen (Buchen, Genehmigen, etc.)
- **Mobile-Optimierung** – Responsive Sidebar mit Hamburger-Menü
- **Error Boundaries** – Benutzerfreundliche Fehlerseite bei unerwarteten Fehlern

## Tech Stack

| Schicht | Technologie |
|---------|------------|
| Frontend | React 18, React Router 6, Tailwind CSS (CDN) |
| Backend | Supabase (PostgreSQL, Auth, Row Level Security) |
| Hosting | Vercel (Auto-Deploy bei Push auf `main`) |
| PDF | jsPDF (on-demand CDN-Load) |
| Icons | Lucide React |

## Projektstruktur

```
src/
├── App.js                    # Root – Provider-Hierarchie + Routing
├── index.js                  # BrowserRouter + AuthProvider + ToastProvider
├── contexts/                 # React Contexts
│   ├── AuthContext.js        #   Login, Session, Rollen-Check
│   ├── FacilityContext.js    #   Anlagen, Gruppen, Ressourcen, Slots
│   ├── OrganizationContext.js#   Vereine, Abteilungen, Mannschaften
│   ├── BookingContext.js     #   Buchungen (CRUD)
│   ├── UserContext.js        #   Benutzer, Genehmiger-Zuweisungen
│   ├── HolidayContext.js     #   Ferien & Feiertage
│   └── ToastContext.js       #   In-App Toast-Benachrichtigungen
├── hooks/                    # Domain-spezifische DB-Hooks
│   ├── useBookings.js        #   Buchungen (DB-Logik)
│   ├── useFacilities.js      #   Anlagen, Gruppen, Ressourcen, Slots
│   ├── useOrganization.js    #   Vereine, Abteilungen, Mannschaften
│   ├── useUsers.js           #   Benutzer, Einladungen
│   ├── useHolidays.js        #   Ferien & Feiertage
│   ├── useOperators.js       #   Betreiber
│   ├── useGenehmigerResources.js # Genehmiger-Ressourcen-Zuweisungen
│   ├── useBookingActions.js  #   Buchen, Genehmigen, Ablehnen, Löschen
│   └── useConfirm.js         #   Promise-basierter ConfirmDialog-Ersatz
├── routes/
│   ├── ProtectedRoute.js     #   Auth-Guard (Redirect → /login)
│   └── PermissionRoute.js    #   Rollen-Guard (kannBuchen, kannGenehmigen, etc.)
├── components/
│   ├── ui/                   #   Shared UI (Badge, Button, Modal, ErrorBoundary, etc.)
│   ├── admin/
│   │   ├── facilities/       #   Anlagenverwaltung
│   │   ├── organization/     #   Organisationsverwaltung
│   │   ├── users/            #   Benutzerverwaltung
│   │   ├── holidays/         #   Ferien & Feiertage
│   │   ├── Approvals.js      #   Genehmigungen
│   │   └── EmailLog.js       #   E-Mail-Protokoll
│   ├── CalendarView.js       #   Wochen-/Tageskalender (Tag/Woche Toggle)
│   ├── BookingRequest.js     #   Buchungsformular
│   ├── BookingEditModal.js   #   Buchung bearbeiten
│   ├── MyBookings.js         #   Meine Buchungen
│   ├── PDFExportPage.js      #   PDF-Export
│   ├── Sidebar.js            #   Navigation (responsive, Hamburger-Menü)
│   └── LoginPage.js          #   Login
├── config/
│   ├── constants.js          #   UI-Konstanten, Farben, Icons
│   └── organizationConfig.js #   Buchungstypen, Event-Types
├── services/
│   └── emailService.js       #   E-Mail-Simulation
├── lib/
│   └── supabase.js           #   Supabase-Client
└── utils/
    └── helpers.js            #   Datum, Format, Kalender-Helfer

supabase/
├── functions/
│   ├── ical/                 # iCal-Feed Edge Function
│   └── send-email/           # E-Mail Edge Function
└── migrations/               # 001–012
```

## Rollen

| Rolle | Rechte |
|-------|--------|
| **Admin** | Alles – Benutzer, Anlagen, Organisation, alle Genehmigungen |
| **Genehmiger** | Genehmigt/lehnt Anfragen für zugewiesene Ressourcen ab |
| **Trainer** | Kann Buchungsanfragen stellen |
| **Extern** | Kann Buchungsanfragen stellen (eingeschränkt) |

Benutzer werden ausschließlich per Admin-Einladung angelegt. Kein Self-Service-Signup.

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# .env konfigurieren (Supabase-Credentials)
cp .env.example .env
# REACT_APP_SUPABASE_URL und REACT_APP_SUPABASE_ANON_KEY eintragen

# Development Server starten
npm start
```

Die App öffnet sich auf `http://localhost:3000`.

## Deployment

Jeder Push auf `main` triggert automatisch ein Vercel-Deployment. Umgebungsvariablen in Vercel Settings hinterlegen:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## Datenbank

Die App nutzt Supabase (PostgreSQL) mit Row Level Security. Migrationen liegen in `supabase/migrations/` (001–019). Wichtige Tabellen:

- `profiles` – Benutzerprofile (verknüpft mit Supabase Auth), inkl. `ist_trainer`, `stammverein_id`
- `facilities`, `resource_groups`, `resources` – Anlagenstruktur (Sub-Resources via `parent_resource_id`)
- `slots` – Verfügbarkeitsfenster für limitierte Ressourcen
- `bookings` – Buchungen (Einzel + Serien, inkl. `team_id`)
- `clubs`, `departments`, `teams`, `trainer_assignments` – Organisationsstruktur
- `genehmiger_resource_assignments` – Ressourcen-Zuweisung für Genehmiger
- `trainer_profile_details` – Trainer-Profil 1:1 (Bio, Foto, IBAN, FZ, Chip-ID, Veröffentlichungs-Flags)
- `trainer_lizenzen`, `trainer_erfolge` – Trainer-Unterlagen (1:n)
- `holidays` – Ferien & Feiertage
- `sent_emails` – E-Mail-Protokoll

**Supabase Storage:** `trainer-fotos` (public), `trainer-dokumente` (private, Signed URLs)
