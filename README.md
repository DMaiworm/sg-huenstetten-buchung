# SG Hünstetten - Ressourcen-Buchungssystem

Ein modernes Buchungssystem für Sportstätten und Räumlichkeiten mit intelligenter Konfliktprüfung und E-Mail-Benachrichtigungen.

## ✨ Features

- 📅 **Kalenderansicht** - Wochenübersicht mit allen Buchungen
- 🔄 **Wiederkehrende Buchungen** - Serien für regelmäßige Trainings
- 🎯 **Buchungstypen** - Training, Spiel, Veranstaltung, Sonstiges
- ⚠️ **Konfliktprüfung** - Live-Erkennung von Überschneidungen
- 📧 **E-Mail-Benachrichtigungen** - Automatische Bestätigungen (Prototyp)
- 👥 **Benutzerverwaltung** - Admin, Trainer, Externe
- 📊 **E-Mail-Log** - Vorschau aller versendeten E-Mails
- 📄 **PDF-Export** - Monatskalender als PDF

## 🚀 Quick Start

Dieses Repository wurde von Claude erstellt und ist deployment-ready für Vercel!

### Sofort deployen auf Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DMaiworm/sg-huenstetten-buchung)

### Manuelles Deployment:

1. Gehe zu [vercel.com](https://vercel.com)
2. "Add New Project" → "Import Git Repository"
3. Wähle dieses Repository
4. Klicke "Deploy"
5. Fertig! 🎉

## 💻 Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Development Server starten
npm start
```

Die App öffnet sich auf `http://localhost:3000`

## 📱 Demo-Modus

Die Anwendung läuft im **Prototyp-Modus**:
- Alle Buchungen werden im Browser-Speicher gehalten
- E-Mails werden simuliert (siehe E-Mail-Log)
- Keine Datenbank erforderlich
- Perfekt für Demos!

**Admin-Modus:** Checkbox oben rechts aktivieren

## 📖 Dokumentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detaillierte Deployment-Anleitung
- [BUCHUNGSTYPEN-FEATURE.md](./BUCHUNGSTYPEN-FEATURE.md) - Feature-Dokumentation
- [EMAIL-BENACHRICHTIGUNGEN.md](./EMAIL-BENACHRICHTIGUNGEN.md) - E-Mail-System

## 🔄 Automatische Updates

Jeder `git push` triggert automatisch ein neues Deployment auf Vercel!

---

**Von Claude erstellt für SG Hünstetten** ❤️