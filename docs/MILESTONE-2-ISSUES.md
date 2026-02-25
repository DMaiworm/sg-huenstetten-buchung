# Meilenstein 2: Stabilität & Code-Qualität

> Erstellt am 25.02.2026 – Issues können per `gh issue create` oder manuell auf GitHub angelegt werden.

---

## Bug: Konflikt-Erkennung ignoriert Einzelbuchungen (seriesId: null)

**Labels:** `bug`, `priority: high`

### Beschreibung
`findConflicts()` in `src/utils/helpers.js` vergleicht `other.seriesId !== booking.seriesId`. Bei zwei unabhängigen Einzelbuchungen (beide `seriesId: null`) ergibt `null !== null` → `false`, wodurch sie fälschlich als "gleiche Serie" behandelt werden.

### Auswirkung
Zwei überlappende Einzelbuchungen auf derselben Ressource werden **nicht** als Konflikt erkannt. Nutzer können versehentlich Doppelbuchungen erstellen.

### Betroffene Dateien
- `src/utils/helpers.js` (Zeile 146-155, `findConflicts`)

### Lösungsvorschlag
```javascript
// Statt:
other.seriesId !== booking.seriesId
// Besser:
!(booking.seriesId && other.seriesId && booking.seriesId === other.seriesId)
```

### Akzeptanzkriterien
- [ ] Zwei Einzelbuchungen (seriesId: null) auf gleicher Ressource/Zeit werden als Konflikt erkannt
- [ ] Buchungen derselben Serie werden weiterhin NICHT als Konflikt gewertet
- [ ] Bestehender Test `behandelt null-seriesId als gleiche Serie` wird aktualisiert
- [ ] Alle 46+ Tests grün

---

## Feature: In-App Toast-Benachrichtigungen

**Labels:** `enhancement`, `UX`

### Beschreibung
Aktuell gibt es kein visuelles Feedback nach Aktionen wie Buchung erstellen, Genehmigung, Ablehnung oder Löschung. Nutzer wissen nicht, ob ihre Aktion erfolgreich war.

### Anforderungen
- Toast-Komponente (success, error, info, warning) mit Auto-Dismiss
- Integration in bestehende Aktionen:
  - Buchung erstellt → "Buchungsanfrage gesendet"
  - Buchung genehmigt → "Buchung genehmigt"
  - Buchung abgelehnt → "Buchung abgelehnt"
  - Buchung gelöscht → "Buchung gelöscht"
  - Fehler → Fehlermeldung anzeigen

### Betroffene Dateien
- Neue Datei: `src/components/ui/Toast.js`
- Neuer Context: `src/contexts/ToastContext.js`
- `src/hooks/useBookingActions.js` – Toasts nach Aktionen
- `src/components/admin/Approvals.js` – Toasts nach Genehmigung
- `src/components/ui/index.js` – Export ergänzen

### Akzeptanzkriterien
- [ ] Toast erscheint nach jeder Buchungs-Aktion (erstellen, genehmigen, ablehnen, löschen)
- [ ] Toast verschwindet nach 4 Sekunden automatisch
- [ ] Fehler-Toasts bleiben bis zum manuellen Schließen
- [ ] Toast-Farben passen zum Typ (grün=success, rot=error, blau=info)
- [ ] Keine Abhängigkeit zu externen Libraries (Tailwind-basiert)

---

## Feature: E-Mail-Benachrichtigungen evaluieren

**Labels:** `enhancement`, `needs-decision`

### Beschreibung
Der aktuelle `emailService.js` simuliert E-Mails nur (loggt in DB). Entscheidung nötig: echte E-Mails über Supabase Edge Function + Resend/SendGrid, oder In-App-Notifications als Ersatz.

### Optionen
1. **Supabase Edge Function + Resend** – Echte E-Mails, `.env.example` hat bereits `RESEND_API_KEY` Platzhalter
2. **In-App Notification Center** – Glocken-Icon in Sidebar, Benachrichtigungsliste mit gelesen/ungelesen
3. **Beides** – E-Mail für externe Nutzer, In-App für eingeloggte

### Akzeptanzkriterien
- [ ] Entscheidung dokumentiert
- [ ] Gewählte Variante implementiert
- [ ] Nutzer werden bei Statusänderung ihrer Buchung informiert

---

## Refactoring: useSupabase.js aufteilen

**Labels:** `refactoring`, `code-quality`

### Beschreibung
`src/hooks/useSupabase.js` ist mit 887 Zeilen die größte Datei im Projekt. Sie enthält alle DB-Operationen, Mapper und CRUD-Logik für alle Domains.

### Vorgeschlagene Aufteilung
```
src/hooks/
├── useSupabase.js          → Entfällt (wird aufgeteilt)
├── mappers.js              → Alle snake_case↔camelCase Mapper
├── useFacilities.js        → Facilities, ResourceGroups, Resources, Slots
├── useOrganization.js      → Clubs, Departments, Teams, TrainerAssignments
├── useBookings.js          → Booking CRUD + Queries
├── useProfiles.js          → User Profiles + Genehmiger-Zuweisungen
└── useHolidays.js          → Holiday CRUD
```

### Betroffene Dateien
- `src/hooks/useSupabase.js` → Split in 6 Dateien
- `src/contexts/*.js` → Imports aktualisieren (jeder Context importiert seinen Hook)

### Akzeptanzkriterien
- [ ] useSupabase.js durch domain-spezifische Hooks ersetzt
- [ ] Jeder Hook < 200 Zeilen
- [ ] Mapper-Funktionen in eigener Datei
- [ ] Alle bestehenden Context-Provider funktionieren unverändert
- [ ] `npm run build` erfolgreich
- [ ] Alle Tests grün

---

## Feature: Error Boundaries einführen

**Labels:** `enhancement`, `code-quality`

### Beschreibung
Aktuell werden Fehler mit `console.error` geloggt, aber dem Nutzer nicht angezeigt. Bei Netzwerkfehlern oder Supabase-Problemen sieht der Nutzer eine leere oder kaputte Seite.

### Anforderungen
- React Error Boundary Komponente
- Fallback-UI: "Etwas ist schiefgelaufen" mit Retry-Button
- Wrapping um Hauptbereiche (Kalender, Buchungsformular, Admin-Seiten)
- Fehler an Console loggen UND dem User zeigen

### Betroffene Dateien
- Neue Datei: `src/components/ui/ErrorBoundary.js`
- `src/App.js` – Error Boundaries um Route-Gruppen
- `src/components/ui/index.js` – Export

### Akzeptanzkriterien
- [ ] Error Boundary fängt Render-Fehler in Hauptbereichen
- [ ] Fallback-UI mit verständlicher Fehlermeldung
- [ ] Retry-Button lädt den betroffenen Bereich neu
- [ ] Fehler werden weiterhin in Console geloggt

---

## Feature: Test-Coverage erweitern

**Labels:** `testing`, `code-quality`

### Beschreibung
Aktuell nur 46 Tests für `utils/helpers.js`. Keine Tests für Contexts, Hooks oder Komponenten.

### Vorgeschlagene Erweiterungen (Prioritätsreihenfolge)

**Phase 1: Hooks & Logik**
- `useBookingActions.js` – Buchung erstellen, genehmigen, ablehnen
- `mappers.js` (nach Refactoring) – snake_case↔camelCase Konvertierung

**Phase 2: Contexts (mit Supabase-Mock)**
- `AuthContext.js` – Login, Rollen-Check
- `BookingContext.js` – CRUD-Operationen

**Phase 3: Komponenten**
- `BookingRequest.js` – Formular-Validierung, Schritt-Navigation
- `CalendarView.js` – Buchungs-Rendering, Wochenwechsel

### Akzeptanzkriterien
- [ ] Mindestens Phase 1 implementiert
- [ ] Supabase-Mock für Context-Tests vorbereitet
- [ ] `npm test` läuft in CI ohne Supabase-Verbindung
- [ ] Coverage-Report eingerichtet (`npm test -- --coverage`)
