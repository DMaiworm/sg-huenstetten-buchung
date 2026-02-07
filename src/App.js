import React, { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, Users, Check, X, Plus, ChevronLeft, ChevronRight, Settings, Home, List, Shield, Repeat, Maximize, UserPlus, Mail, Phone, Building, FileDown } from 'lucide-react';

// Ressourcen-Konfiguration
const RESOURCES = [
  { id: 'sportplatz-ganz', name: 'Sportplatz - komplett', type: 'regular', category: 'outdoor', color: '#15803d', isComposite: true, includes: ['sportplatz-links', 'sportplatz-rechts'] },
  { id: 'sportplatz-links', name: 'Sportplatz - links', type: 'regular', category: 'outdoor', color: '#22c55e', partOf: 'sportplatz-ganz' },
  { id: 'sportplatz-rechts', name: 'Sportplatz - rechts', type: 'regular', category: 'outdoor', color: '#16a34a', partOf: 'sportplatz-ganz' },
  { id: 'kleinfeld', name: 'Fußball-Kleinfeld', type: 'regular', category: 'outdoor', color: '#84cc16' },
  { id: 'gymnastik', name: 'Gymnastikraum', type: 'regular', category: 'indoor', color: '#8b5cf6' },
  { id: 'fitness', name: 'Fitnessraum', type: 'regular', category: 'indoor', color: '#a855f7' },
  { id: 'gastronomie', name: 'Vereinsgastronomie', type: 'regular', category: 'indoor', color: '#f59e0b' },
  { id: 'halle-gross', name: 'Große Mehrzweckhalle', type: 'limited', category: 'shared', color: '#ef4444' },
  { id: 'halle-klein', name: 'Kleine Mehrzweckhalle', type: 'limited', category: 'shared', color: '#f97316' },
];

// Demo-Daten
const DEMO_SLOTS = [
  { id: 1, resourceId: 'halle-gross', dayOfWeek: 1, startTime: '17:00', endTime: '21:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 2, resourceId: 'halle-gross', dayOfWeek: 3, startTime: '18:00', endTime: '22:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 3, resourceId: 'halle-gross', dayOfWeek: 6, startTime: '09:00', endTime: '14:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 4, resourceId: 'halle-klein', dayOfWeek: 2, startTime: '16:00', endTime: '20:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 5, resourceId: 'halle-klein', dayOfWeek: 4, startTime: '17:00', endTime: '21:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
];

// Buchungstypen-Konfiguration
const BOOKING_TYPES = [
  { 
    id: 'training', 
    label: 'Training', 
    icon: '🏃',
    color: '#3b82f6',
    description: 'Regelmäßiges Training',
    allowOverlap: false // Trainings dürfen sich nicht überschneiden
  },
  { 
    id: 'match', 
    label: 'Spiel', 
    icon: '⚽',
    color: '#dc2626',
    description: 'Wettkampf oder Freundschaftsspiel',
    allowOverlap: false // Spiele haben höchste Priorität
  },
  { 
    id: 'event', 
    label: 'Veranstaltung', 
    icon: '🎉',
    color: '#8b5cf6',
    description: 'Turnier, Fest, Sonderveranstaltung',
    allowOverlap: false // Events sind exklusiv
  },
  { 
    id: 'other', 
    label: 'Sonstiges', 
    icon: '📋',
    color: '#6b7280',
    description: 'Besprechung, Wartung, etc.',
    allowOverlap: true // Sonstiges kann flexibel sein
  },
];

// Rollen-Konfiguration
const ROLES = [
  { id: 'admin', label: 'Administrator', color: '#dc2626', description: 'Volle Rechte: Buchungen, Genehmigungen, Benutzerverwaltung' },
  { id: 'trainer', label: 'Trainer', color: '#2563eb', description: 'Eigene Buchungen erstellen und verwalten' },
  { id: 'extern', label: 'Extern', color: '#6b7280', description: 'Nur Anfragen stellen (müssen genehmigt werden)' },
];

// Demo-Benutzer
const DEMO_USERS = [
  { id: 1, firstName: 'Max', lastName: 'Müller', club: 'SG Hünstetten', team: 'A-Jugend', email: 'max.mueller@sg-huenstetten.de', phone: '0171-1234567', role: 'trainer' },
  { id: 2, firstName: 'Anna', lastName: 'Schmidt', club: 'SG Hünstetten', team: 'Yoga', email: 'anna.schmidt@sg-huenstetten.de', phone: '0172-2345678', role: 'trainer' },
  { id: 3, firstName: 'Tom', lastName: 'Weber', club: 'SG Hünstetten', team: '1. Mannschaft', email: 'tom.weber@sg-huenstetten.de', phone: '0173-3456789', role: 'trainer' },
  { id: 4, firstName: 'Lisa', lastName: 'Braun', club: 'SG Hünstetten', team: 'F-Jugend', email: 'lisa.braun@sg-huenstetten.de', phone: '0174-4567890', role: 'trainer' },
  { id: 5, firstName: 'Hans', lastName: 'Meier', club: 'SG Hünstetten', team: 'Seniorensport', email: 'hans.meier@sg-huenstetten.de', phone: '0175-5678901', role: 'trainer' },
  { id: 6, firstName: 'Peter', lastName: 'König', club: 'SG Hünstetten', team: '1. Mannschaft', email: 'peter.koenig@sg-huenstetten.de', phone: '0176-6789012', role: 'admin' },
  { id: 7, firstName: 'Sandra', lastName: 'Fischer', club: 'TV Idstein', team: 'Handball', email: 'sandra.fischer@tv-idstein.de', phone: '0177-7890123', role: 'extern' },
  { id: 8, firstName: 'Michael', lastName: 'Wagner', club: 'TSV Wallrabenstein', team: 'Fußball', email: 'm.wagner@tsv-wallrabenstein.de', phone: '0178-8901234', role: 'extern' },
];

const DEMO_BOOKINGS = [
  { id: 1, resourceId: 'sportplatz-links', date: '2026-02-10', startTime: '16:00', endTime: '18:00', title: 'A-Jugend Training', bookingType: 'training', userId: 1, status: 'approved', seriesId: 'series-1' },
  { id: 2, resourceId: 'gymnastik', date: '2026-02-10', startTime: '19:00', endTime: '20:30', title: 'Yoga Kurs', bookingType: 'training', userId: 2, status: 'approved', seriesId: 'series-2' },
  { id: 3, resourceId: 'halle-gross', date: '2026-02-10', startTime: '18:00', endTime: '20:00', title: 'Hallenfußball', bookingType: 'training', userId: 3, status: 'pending', seriesId: 'series-3' },
  { id: 4, resourceId: 'kleinfeld', date: '2026-02-11', startTime: '15:00', endTime: '17:00', title: 'F-Jugend Training', bookingType: 'training', userId: 4, status: 'pending' },
  { id: 5, resourceId: 'fitness', date: '2026-02-12', startTime: '10:00', endTime: '11:30', title: 'Seniorensport', bookingType: 'training', userId: 5, status: 'approved' },
  { id: 6, resourceId: 'sportplatz-ganz', date: '2026-02-15', startTime: '14:00', endTime: '17:00', title: 'Heimspiel 1. Mannschaft', bookingType: 'match', userId: 6, status: 'approved' },
];

const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const DAYS_FULL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

// E-Mail-Template-System
const EMAIL_TEMPLATES = {
  bookingCreated: (booking, user, resource) => ({
    to: user.email,
    subject: `✅ Buchung bestätigt: ${booking.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0 0 10px 0;">🎉 Buchung bestätigt</h1>
            <p style="color: #6b7280; margin: 0;">Ihre Buchungsanfrage wurde erfolgreich erstellt</p>
          </div>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">${booking.title}</h2>
            <div style="color: #374151; line-height: 1.8;">
              <p style="margin: 5px 0;"><strong>📍 Ressource:</strong> ${resource.name}</p>
              <p style="margin: 5px 0;"><strong>📅 Datum:</strong> ${new Date(booking.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p style="margin: 5px 0;"><strong>🕐 Uhrzeit:</strong> ${booking.startTime} - ${booking.endTime} Uhr</p>
              ${booking.bookingType ? `<p style="margin: 5px 0;"><strong>🏷️ Art:</strong> ${BOOKING_TYPES.find(t => t.id === booking.bookingType)?.icon} ${BOOKING_TYPES.find(t => t.id === booking.bookingType)?.label}</p>` : ''}
              ${booking.seriesId ? `<p style="margin: 5px 0;"><strong>🔄 Serie:</strong> Wiederkehrende Buchung</p>` : ''}
            </div>
          </div>
          
          ${user.role === 'extern' ? `
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>⏳ Wartet auf Genehmigung</strong><br>
                Ihre Anfrage wird von einem Administrator geprüft. Sie erhalten eine weitere E-Mail, sobald eine Entscheidung getroffen wurde.
              </p>
            </div>
          ` : `
            <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                <strong>✅ Automatisch genehmigt</strong><br>
                Ihre Buchung wurde automatisch genehmigt und ist damit verbindlich.
              </p>
            </div>
          `}
          
          ${booking.description ? `
            <div style="margin: 20px 0;">
              <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 14px;"><strong>Beschreibung:</strong></p>
              <p style="color: #374151; margin: 0; font-size: 14px;">${booking.description}</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              SG Hünstetten - Ressourcen-Buchungssystem<br>
              Bei Fragen wenden Sie sich bitte an den Vorstand.
            </p>
          </div>
        </div>
      </div>
    `
  }),

  bookingApproved: (booking, user, resource, approver) => ({
    to: user.email,
    subject: `✅ Buchung genehmigt: ${booking.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin: 0 0 10px 0;">✅ Buchung genehmigt</h1>
            <p style="color: #6b7280; margin: 0;">Ihre Buchungsanfrage wurde genehmigt</p>
          </div>
          
          <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">${booking.title}</h2>
            <div style="color: #374151; line-height: 1.8;">
              <p style="margin: 5px 0;"><strong>📍 Ressource:</strong> ${resource.name}</p>
              <p style="margin: 5px 0;"><strong>📅 Datum:</strong> ${new Date(booking.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p style="margin: 5px 0;"><strong>🕐 Uhrzeit:</strong> ${booking.startTime} - ${booking.endTime} Uhr</p>
              ${booking.bookingType ? `<p style="margin: 5px 0;"><strong>🏷️ Art:</strong> ${BOOKING_TYPES.find(t => t.id === booking.bookingType)?.icon} ${BOOKING_TYPES.find(t => t.id === booking.bookingType)?.label}</p>` : ''}
            </div>
          </div>
          
          <div style="background-color: #f0f9ff; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
              <strong>👤 Genehmigt von:</strong> ${approver.firstName} ${approver.lastName}
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              SG Hünstetten - Ressourcen-Buchungssystem<br>
              Bei Fragen wenden Sie sich bitte an den Vorstand.
            </p>
          </div>
        </div>
      </div>
    `
  }),

  bookingRejected: (booking, user, resource, approver, reason) => ({
    to: user.email,
    subject: `❌ Buchung abgelehnt: ${booking.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0 0 10px 0;">❌ Buchung abgelehnt</h1>
            <p style="color: #6b7280; margin: 0;">Ihre Buchungsanfrage wurde leider abgelehnt</p>
          </div>
          
          <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="color: #991b1b; margin: 0 0 15px 0; font-size: 18px;">${booking.title}</h2>
            <div style="color: #374151; line-height: 1.8;">
              <p style="margin: 5px 0;"><strong>📍 Ressource:</strong> ${resource.name}</p>
              <p style="margin: 5px 0;"><strong>📅 Datum:</strong> ${new Date(booking.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p style="margin: 5px 0;"><strong>🕐 Uhrzeit:</strong> ${booking.startTime} - ${booking.endTime} Uhr</p>
            </div>
          </div>
          
          ${reason ? `
            <div style="background-color: #fef3c7; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
              <p style="color: #92400e; margin: 0 0 5px 0; font-size: 14px;"><strong>Grund:</strong></p>
              <p style="color: #78350f; margin: 0; font-size: 14px;">${reason}</p>
            </div>
          ` : ''}
          
          <div style="background-color: #f0f9ff; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
              <strong>👤 Abgelehnt von:</strong> ${approver.firstName} ${approver.lastName}
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px;">
            <p style="color: #374151; margin: 0; font-size: 14px;">
              💡 <strong>Tipp:</strong> Versuchen Sie eine andere Zeit oder kontaktieren Sie den Vorstand für weitere Informationen.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              SG Hünstetten - Ressourcen-Buchungssystem<br>
              Bei Fragen wenden Sie sich bitte an den Vorstand.
            </p>
          </div>
        </div>
      </div>
    `
  }),

  adminNewBooking: (booking, user, resource, adminEmail) => ({
    to: adminEmail,
    subject: `📬 Neue Buchungsanfrage von ${user.firstName} ${user.lastName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0 0 10px 0;">📬 Neue Buchungsanfrage</h1>
            <p style="color: #6b7280; margin: 0;">Wartet auf Ihre Genehmigung</p>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="color: #78350f; margin: 0 0 15px 0; font-size: 18px;">${booking.title}</h2>
            <div style="color: #374151; line-height: 1.8;">
              <p style="margin: 5px 0;"><strong>📍 Ressource:</strong> ${resource.name}</p>
              <p style="margin: 5px 0;"><strong>📅 Datum:</strong> ${new Date(booking.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p style="margin: 5px 0;"><strong>🕐 Uhrzeit:</strong> ${booking.startTime} - ${booking.endTime} Uhr</p>
              ${booking.bookingType ? `<p style="margin: 5px 0;"><strong>🏷️ Art:</strong> ${BOOKING_TYPES.find(t => t.id === booking.bookingType)?.icon} ${BOOKING_TYPES.find(t => t.id === booking.bookingType)?.label}</p>` : ''}
              ${booking.seriesId ? `<p style="margin: 5px 0;"><strong>🔄 Serie:</strong> Wiederkehrende Buchung</p>` : ''}
            </div>
          </div>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">👤 Anfrager</h3>
            <div style="color: #374151; line-height: 1.8; font-size: 14px;">
              <p style="margin: 5px 0;"><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
              <p style="margin: 5px 0;"><strong>Verein:</strong> ${user.club}</p>
              ${user.team ? `<p style="margin: 5px 0;"><strong>Mannschaft:</strong> ${user.team}</p>` : ''}
              <p style="margin: 5px 0;"><strong>E-Mail:</strong> ${user.email}</p>
              ${user.phone ? `<p style="margin: 5px 0;"><strong>Telefon:</strong> ${user.phone}</p>` : ''}
            </div>
          </div>
          
          ${booking.description ? `
            <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 4px;">
              <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 14px;"><strong>Beschreibung:</strong></p>
              <p style="color: #374151; margin: 0; font-size: 14px;">${booking.description}</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #1f2937; margin: 0 0 15px 0; font-size: 14px;">
              <strong>Bitte bearbeiten Sie diese Anfrage im Buchungssystem.</strong>
            </p>
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              SG Hünstetten - Ressourcen-Buchungssystem
            </p>
          </div>
        </div>
      </div>
    `
  })
};

// E-Mail-Service (Mock für Prototyp)
class EmailService {
  constructor() {
    this.sentEmails = [];
  }

  async send(emailData) {
    // Simuliere E-Mail-Versand
    const email = {
      id: Date.now(),
      ...emailData,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };
    
    this.sentEmails.push(email);
    
    // Simuliere leichte Verzögerung
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('📧 E-Mail versendet:', email.subject, 'an', email.to);
    return email;
  }

  getSentEmails() {
    return this.sentEmails;
  }

  clearEmails() {
    this.sentEmails = [];
  }
}

// Hilfsfunktionen
const formatDate = (date) => {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateISO = (date) => {
  return date.toISOString().split('T')[0];
};

const getWeekDates = (date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Generiere alle Termine einer Serie
const generateSeriesDates = (dayOfWeek, startDate, endDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Finde ersten passenden Wochentag
  let current = new Date(start);
  while (current.getDay() !== dayOfWeek) {
    current.setDate(current.getDate() + 1);
  }

  while (current <= end) {
    dates.push(formatDateISO(current));
    current.setDate(current.getDate() + 7);
  }

  return dates;
};

// Prüfe ob zwei Zeiträume sich überschneiden
const hasTimeOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

// Prüfe Konflikte für eine Buchungsanfrage
const checkBookingConflicts = (resourceId, dates, startTime, endTime, bookingType, bookings, slots, resources) => {
  const conflicts = [];
  const resource = resources.find(r => r.id === resourceId);
  const isLimited = resource?.type === 'limited';
  const isComposite = resource?.isComposite;
  const requestedType = BOOKING_TYPES.find(t => t.id === bookingType);

  dates.forEach(date => {
    const dateConflicts = [];
    const dayOfWeek = new Date(date).getDay();

    // 1. Prüfe Slot-Verfügbarkeit bei limitierten Ressourcen
    if (isLimited) {
      const availableSlot = slots.find(s => 
        s.resourceId === resourceId && 
        s.dayOfWeek === dayOfWeek &&
        new Date(date) >= new Date(s.validFrom) &&
        new Date(date) <= new Date(s.validUntil)
      );

      if (!availableSlot) {
        dateConflicts.push({
          type: 'no_slot',
          message: 'Kein verfügbarer Slot an diesem Tag',
          severity: 'error'
        });
      } else {
        const reqStart = timeToMinutes(startTime);
        const reqEnd = timeToMinutes(endTime);
        const slotStart = timeToMinutes(availableSlot.startTime);
        const slotEnd = timeToMinutes(availableSlot.endTime);

        if (reqStart < slotStart || reqEnd > slotEnd) {
          dateConflicts.push({
            type: 'outside_slot',
            message: `Zeit außerhalb des Slots (${availableSlot.startTime}-${availableSlot.endTime})`,
            severity: 'error',
            slot: availableSlot
          });
        }
      }
    }

    // 2. Prüfe Überschneidungen mit bestehenden Buchungen
    const relevantBookings = bookings.filter(b => b.date === date && b.status !== 'rejected');
    
    relevantBookings.forEach(booking => {
      const existingType = BOOKING_TYPES.find(t => t.id === booking.bookingType);
      
      // Prüfe ob es eine zeitliche Überschneidung gibt
      const hasOverlap = hasTimeOverlap(startTime, endTime, booking.startTime, booking.endTime);
      
      if (!hasOverlap) return; // Keine Überschneidung, alles gut

      // Direkte Überschneidung auf derselben Ressource
      if (booking.resourceId === resourceId) {
        // Bestimme Schweregrad basierend auf Buchungstypen
        const severity = (!requestedType?.allowOverlap || !existingType?.allowOverlap) ? 'error' : 'warning';
        
        dateConflicts.push({
          type: 'time_overlap',
          message: `${existingType?.icon || '📋'} ${existingType?.label || 'Buchung'}: "${booking.title}"`,
          severity: severity,
          booking: booking,
          existingType: existingType,
          explanation: severity === 'error' 
            ? 'Diese Buchungstypen können sich nicht überschneiden'
            : 'Überschneidung möglich, aber prüfen Sie ob sinnvoll'
        });
      }

      // Bei Composite-Ressource: Prüfe ob Teil-Ressourcen belegt sind
      if (isComposite && resource.includes?.includes(booking.resourceId)) {
        const severity = (!requestedType?.allowOverlap || !existingType?.allowOverlap) ? 'error' : 'warning';
        
        dateConflicts.push({
          type: 'composite_blocked',
          message: `Teilfeld belegt: ${existingType?.icon || '📋'} "${booking.title}"`,
          severity: severity,
          booking: booking,
          existingType: existingType
        });
      }

      // Bei Teil-Ressource: Prüfe ob Ganzes Feld gebucht ist
      if (resource?.partOf && booking.resourceId === resource.partOf) {
        const severity = (!requestedType?.allowOverlap || !existingType?.allowOverlap) ? 'error' : 'warning';
        
        dateConflicts.push({
          type: 'parent_blocked',
          message: `Ganzes Feld gebucht: ${existingType?.icon || '📋'} "${booking.title}"`,
          severity: severity,
          booking: booking,
          existingType: existingType
        });
      }
    });

    if (dateConflicts.length > 0) {
      conflicts.push({
        date,
        conflicts: dateConflicts
      });
    }
  });

  return conflicts;
};

// Komponenten
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent hover:bg-gray-100',
  };
  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  return (
    <button className={`rounded-lg font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Navigations-Sidebar
const Sidebar = ({ currentView, setCurrentView, isAdmin, onExportPDF, emailService }) => {
  const navItems = [
    { id: 'calendar', label: 'Kalender', icon: Calendar },
    { id: 'bookings', label: 'Meine Buchungen', icon: List },
    { id: 'request', label: 'Neue Anfrage', icon: Plus },
  ];

  const adminItems = [
    { id: 'approvals', label: 'Genehmigungen', icon: Check },
    { id: 'slots', label: 'Slot-Verwaltung', icon: Settings },
    { id: 'users', label: 'Benutzerverwaltung', icon: UserPlus },
    { id: 'emails', label: 'E-Mail-Log', icon: Mail, badge: emailService?.getSentEmails().length || 0 },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Home className="w-6 h-6 text-blue-600" />
          SG Hünstetten
        </h1>
        <p className="text-sm text-gray-500 mt-1">Ressourcen-Buchung</p>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                currentView === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* PDF Export */}
        <div className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-400 uppercase">
          Export
        </div>
        <button
          onClick={onExportPDF}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-600 hover:bg-green-50 hover:text-green-700"
        >
          <FileDown className="w-5 h-5" />
          Monatsplan PDF
        </button>

        {isAdmin && (
          <>
            <div className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-400 uppercase">
              Administration
            </div>
            <div className="space-y-1">
              {adminItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors ${
                    currentView === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Demo User</p>
            <p className="text-xs text-gray-500">{isAdmin ? 'Administrator' : 'Trainer'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ressourcen-Tab-Komponente
const ResourceTab = ({ resource, isSelected, onClick, bookingCount }) => {
  const isLimited = resource.type === 'limited';
  const isComposite = resource.isComposite;

  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
        isSelected
          ? 'bg-white border-b-transparent text-gray-900 shadow-sm'
          : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800'
      }`}
      style={isSelected ? { borderTopColor: resource.color, borderTopWidth: '3px' } : {}}
    >
      <span className="flex items-center gap-1.5">
        {isComposite && <span title="Ganzes Spielfeld">⭐</span>}
        {isLimited && <span title="Limitierte Ressource">⚠️</span>}
        {resource.name.replace('Große ', '').replace('Kleine ', 'Kl. ')}
      </span>
      {bookingCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
          {bookingCount}
        </span>
      )}
    </button>
  );
};

// Kalender-Ansicht mit Tabs
const CalendarView = ({ bookings, slots, selectedResource, setSelectedResource, currentDate, setCurrentDate, users }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unbekannt';
  };

  const weekDates = getWeekDates(currentDate);
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

  const resource = RESOURCES.find(r => r.id === selectedResource);
  const isLimited = resource?.type === 'limited';
  const isComposite = resource?.isComposite;

  const categories = [
    { id: 'all', label: 'Alle Anlagen', icon: '📋' },
    { id: 'outdoor', label: 'Außenanlagen', icon: '🏟️' },
    { id: 'indoor', label: 'Innenräume', icon: '🏠' },
    { id: 'shared', label: 'Geteilte Hallen', icon: '🤝' },
  ];

  // Ressourcen der gewählten Kategorie
  const categoryResources = selectedCategory === 'all'
    ? RESOURCES
    : RESOURCES.filter(r => r.category === selectedCategory);

  // Zähle Buchungen pro Kategorie für diese Woche
  const getBookingCountForCategory = (catId) => {
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    if (catId === 'all') {
      return bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= weekStart && bookingDate <= weekEnd;
      }).length;
    }
    const categoryResourceIds = RESOURCES.filter(r => r.category === catId).map(r => r.id);
    return bookings.filter(b => {
      if (!categoryResourceIds.includes(b.resourceId)) return false;
      const bookingDate = new Date(b.date);
      return bookingDate >= weekStart && bookingDate <= weekEnd;
    }).length;
  };

  // Zähle Buchungen pro Ressource für diese Woche
  const getBookingCountForResource = (resId) => {
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    return bookings.filter(b => {
      if (b.resourceId !== resId) return false;
      const bookingDate = new Date(b.date);
      return bookingDate >= weekStart && bookingDate <= weekEnd;
    }).length;
  };

  // Bei Kategorie-Wechsel: Erste Ressource der Kategorie auswählen
  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      setSelectedResource(RESOURCES[0].id);
    } else {
      const firstResource = RESOURCES.find(r => r.category === catId);
      if (firstResource) {
        setSelectedResource(firstResource.id);
      }
    }
  };

  const getSlotForDay = (dayOfWeek) => {
    if (!isLimited) return null;
    return slots.find(s => s.resourceId === selectedResource && s.dayOfWeek === dayOfWeek);
  };

  const getBookingsForDay = (date) => {
    const dateStr = formatDateISO(date);
    const result = [];

    bookings.forEach(b => {
      if (b.date !== dateStr) return;

      // Direkte Buchung dieser Ressource
      if (b.resourceId === selectedResource) {
        result.push({ ...b, isBlocking: false });
        return;
      }

      // Bei Teilressource (Links/Rechts): Zeige "Ganzes Feld"-Buchungen als blockierend
      if (resource?.partOf && b.resourceId === resource.partOf) {
        result.push({ ...b, isBlocking: true, blockingReason: 'Ganzes Feld gebucht' });
        return;
      }

      // Bei "Ganzes Feld": Zeige Links/Rechts-Buchungen als blockierend
      if (isComposite && resource.includes?.includes(b.resourceId)) {
        result.push({ ...b, isBlocking: true, blockingReason: RESOURCES.find(r => r.id === b.resourceId)?.name });
        return;
      }
    });

    return result;
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Kategorie-Tabs (Hauptebene) */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-lg">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                selectedCategory === cat.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {getBookingCountForCategory(cat.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ressourcen-Tabs (zweite Ebene) */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
          {categoryResources.map(res => (
            <button
              key={res.id}
              onClick={() => setSelectedResource(res.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all flex items-center gap-1.5 ${
                selectedResource === res.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={selectedResource === res.id ? { borderLeft: `3px solid ${res.color}` } : {}}
            >
              {res.isComposite && <span>⭐</span>}
              {res.type === 'limited' && <span>⚠️</span>}
              {res.name.replace('Große ', '').replace('Kleine ', 'Kl. ')}
              {getBookingCountForResource(res.id) > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {getBookingCountForResource(res.id)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Aktuelle Ressource Info + Navigation */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-8 rounded" style={{ backgroundColor: resource?.color }} />
          <div>
            <h3 className="font-semibold text-gray-800">{resource?.name}</h3>
            <div className="flex items-center gap-2">
              {isLimited && (
                <Badge variant="warning">
                  <Shield className="w-3 h-3 inline mr-1" />
                  Nur in zugewiesenen Slots
                </Badge>
              )}
              {isComposite && (
                <Badge variant="info">
                  <Maximize className="w-3 h-3 inline mr-1" />
                  Beide Hälften
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-medium min-w-48 text-center">
            {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
          </span>
          <Button variant="ghost" onClick={() => navigateWeek(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>
            Heute
          </Button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 380px)', minHeight: '400px' }}>
        {/* Fixierter Wochen-Header */}
        <div className="grid grid-cols-8 min-w-[800px] flex-shrink-0">
          <div className="bg-gray-50 border-b border-r border-gray-200 p-2"></div>
          {weekDates.map((date, i) => (
            <div key={i} className="bg-gray-50 border-b border-gray-200 p-2 text-center">
              <div className="text-xs text-gray-500">{DAYS[date.getDay()]}</div>
              <div className={`text-lg font-semibold ${
                date.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-800'
              }`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollbarer Uhrzeiten-Bereich */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8 min-w-[800px]">
            {/* Uhrzeiten-Spalte */}
            <div className="border-r border-gray-200">
              {hours.map(hour => (
                <div key={hour} className="h-12 border-b border-gray-200 p-2 text-xs text-gray-500 text-right">
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Tages-Spalten mit positionierten Buchungen */}
            {weekDates.map((date, dayIndex) => {
              const slot = getSlotForDay(date.getDay());
              const dayBookings = getBookingsForDay(date);
              const firstHour = hours[0]; // 7

              return (
                <div key={dayIndex} className="relative border-r border-gray-200 last:border-r-0">
                  {/* Stunden-Hintergrund */}
                  {hours.map(hour => {
                    const hourStart = hour * 60;
                    const hourEnd = (hour + 1) * 60;

                    let isInSlot = !isLimited;
                    if (isLimited && slot) {
                      const slotStart = timeToMinutes(slot.startTime);
                      const slotEnd = timeToMinutes(slot.endTime);
                      isInSlot = hourStart >= slotStart && hourEnd <= slotEnd;
                    }

                    return (
                      <div
                        key={hour}
                        className={`h-12 border-b border-gray-200 ${
                          isLimited && !isInSlot ? 'bg-gray-100' : 'bg-white'
                        } ${isLimited && isInSlot ? 'bg-green-50' : ''}`}
                      />
                    );
                  })}

                  {/* Buchungen als positionierte Blöcke */}
                  {dayBookings.map(booking => {
                    const bookingResource = RESOURCES.find(r => r.id === booking.resourceId);
                    const isBlocking = booking.isBlocking;

                    const startMinutes = timeToMinutes(booking.startTime);
                    const endMinutes = timeToMinutes(booking.endTime);
                    const durationMinutes = endMinutes - startMinutes;

                    // Position relativ zum ersten angezeigten Stunde (7:00)
                    const topPx = ((startMinutes - firstHour * 60) / 60) * 48; // 48px = h-12
                    const heightPx = (durationMinutes / 60) * 48;

                    return (
                      <div
                        key={`${booking.id}-${isBlocking ? 'block' : 'own'}`}
                        className={`absolute left-1 right-1 rounded px-1 py-0.5 text-xs overflow-hidden ${
                          isBlocking
                            ? 'bg-gray-300 text-gray-600 border border-gray-400 border-dashed'
                            : booking.status === 'approved'
                              ? 'text-white'
                              : 'bg-yellow-200 text-yellow-800 border border-yellow-400'
                        }`}
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx - 2}px`,
                          backgroundColor: !isBlocking && booking.status === 'approved' ? bookingResource?.color : undefined,
                          zIndex: isBlocking ? 5 : 10,
                        }}
                        title={isBlocking
                          ? `⚠️ Blockiert: ${booking.title} (${booking.blockingReason}) ${booking.startTime}-${booking.endTime}`
                          : `${booking.bookingType ? BOOKING_TYPES.find(t => t.id === booking.bookingType)?.icon + ' ' : ''}${booking.title} (${booking.startTime}-${booking.endTime})${booking.seriesId ? ' 🔄' : ''} - ${getUserName(booking.userId)}`
                        }
                      >
                        <div className="font-medium truncate">
                          {isBlocking && '🚫 '}
                          {!isBlocking && booking.bookingType && BOOKING_TYPES.find(t => t.id === booking.bookingType)?.icon && `${BOOKING_TYPES.find(t => t.id === booking.bookingType)?.icon} `}
                          {booking.seriesId && !isBlocking && '🔄 '}
                          {booking.title}
                        </div>
                        {heightPx > 30 && (
                          <div className="text-xs opacity-80 truncate">
                            {booking.startTime} - {booking.endTime}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Genehmigt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
          <span>Ausstehend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 border border-gray-400 border-dashed rounded"></div>
          <span>Blockiert (andere Feldhälfte)</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔄</span>
          <span>Wiederkehrend</span>
        </div>
        {/* Buchungstypen */}
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        {BOOKING_TYPES.map(type => (
          <div key={type.id} className="flex items-center gap-2">
            <span>{type.icon}</span>
            <span>{type.label}</span>
          </div>
        ))}
        {isLimited && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
              <span>Verfügbarer Slot</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span>Nicht verfügbar</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Buchungsanfrage-Formular - NEU mit wöchentlicher Serie
const BookingRequest = ({ slots, onSubmit, users, bookings = [] }) => {
  const [formData, setFormData] = useState({
    resourceId: 'sportplatz-links',
    dayOfWeek: 1,
    startTime: '16:00',
    endTime: '18:00',
    startDate: '',
    endDate: '',
    title: '',
    description: '',
    userId: '',
    bookingType: 'training', // Neu: Standard ist Training
  });

  const resource = RESOURCES.find(r => r.id === formData.resourceId);
  const isLimited = resource?.type === 'limited';
  const isComposite = resource?.isComposite;
  const selectedBookingType = BOOKING_TYPES.find(t => t.id === formData.bookingType);

  // Verfügbare Slots für limitierte Ressourcen am gewählten Wochentag
  const availableSlots = useMemo(() => {
    if (!isLimited) return [];
    return slots.filter(s => s.resourceId === formData.resourceId && s.dayOfWeek === formData.dayOfWeek);
  }, [isLimited, formData.dayOfWeek, formData.resourceId, slots]);

  // Vorschau der Termine
  const previewDates = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return [];
    return generateSeriesDates(formData.dayOfWeek, formData.startDate, formData.endDate);
  }, [formData.dayOfWeek, formData.startDate, formData.endDate]);

  // Live-Konfliktprüfung mit Buchungstyp
  const conflictAnalysis = useMemo(() => {
    if (previewDates.length === 0 || !formData.startTime || !formData.endTime) {
      return { conflicts: [], hasErrors: false, hasWarnings: false };
    }

    const conflicts = checkBookingConflicts(
      formData.resourceId,
      previewDates,
      formData.startTime,
      formData.endTime,
      formData.bookingType, // Neu: Buchungstyp übergeben
      bookings,
      slots,
      RESOURCES
    );

    const hasErrors = conflicts.some(c => c.conflicts.some(cf => cf.severity === 'error'));
    const hasWarnings = conflicts.some(c => c.conflicts.some(cf => cf.severity === 'warning'));

    return { conflicts, hasErrors, hasWarnings };
  }, [formData, previewDates, bookings, slots]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prüfe ob es blockierende Konflikte gibt
    if (conflictAnalysis.hasErrors) {
      alert('Es gibt Konflikte, die eine Buchung unmöglich machen. Bitte passen Sie die Zeiten an oder wählen Sie andere Termine.');
      return;
    }

    // Validierung für limitierte Ressourcen
    if (isLimited && availableSlots.length === 0) {
      alert(`Am ${DAYS_FULL[formData.dayOfWeek]} ist kein Slot für diese Ressource verfügbar!`);
      return;
    }

    if (isLimited) {
      const slot = availableSlots[0];
      const reqStart = timeToMinutes(formData.startTime);
      const reqEnd = timeToMinutes(formData.endTime);
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);

      if (reqStart < slotStart || reqEnd > slotEnd) {
        alert(`Die gewählte Zeit liegt außerhalb des verfügbaren Slots (${slot.startTime} - ${slot.endTime})!`);
        return;
      }
    }

    onSubmit({
      ...formData,
      dates: previewDates,
      isComposite,
      includedResources: isComposite ? resource.includes : null,
    });

    const conflictCount = conflictAnalysis.conflicts.length;
    const successCount = previewDates.length - conflictCount;

    alert(`Buchungsanfrage für ${previewDates.length} Termine wurde eingereicht!${conflictCount > 0 ? `\n⚠️ ${conflictCount} Termine haben Konflikte.` : ''}`);
    setFormData({ ...formData, title: '', description: '', startDate: '', endDate: '', userId: '' });
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Neue Buchungsanfrage</h2>
      <p className="text-gray-500 mb-6">Wöchentlich wiederkehrende Buchung anlegen</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ressourcen-Auswahl */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ressource auswählen</label>
          <select
            value={formData.resourceId}
            onChange={(e) => setFormData({ ...formData, resourceId: e.target.value, startTime: '', endTime: '' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <optgroup label="Außenanlagen">
              {RESOURCES.filter(r => r.category === 'outdoor').map(r => (
                <option key={r.id} value={r.id}>
                  {r.isComposite ? '⭐ ' : ''}{r.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Innenräume">
              {RESOURCES.filter(r => r.category === 'indoor').map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </optgroup>
            <optgroup label="Geteilte Hallen (limitiert)">
              {RESOURCES.filter(r => r.category === 'shared').map(r => (
                <option key={r.id} value={r.id}>⚠️ {r.name}</option>
              ))}
            </optgroup>
          </select>

          {isComposite && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <Maximize className="w-4 h-4" />
                <strong>Ganzes Spielfeld:</strong> Diese Buchung reserviert automatisch beide Hälften (links + rechts).
              </p>
            </div>
          )}

          {isLimited && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <strong>Limitierte Ressource:</strong> Nur in zugewiesenen Zeitfenstern buchbar.
              </p>
            </div>
          )}
        </div>

        {/* Buchungstyp-Auswahl */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Art der Buchung</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {BOOKING_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData({ ...formData, bookingType: type.id })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.bookingType === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-1">{type.icon}</div>
                  <div className={`text-sm font-medium ${
                    formData.bookingType === type.id ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {type.label}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {selectedBookingType && (
            <div className="mt-3 p-3 rounded-lg" style={{ 
              backgroundColor: `${selectedBookingType.color}15`,
              borderLeft: `4px solid ${selectedBookingType.color}`
            }}>
              <p className="text-sm" style={{ color: selectedBookingType.color }}>
                <strong>{selectedBookingType.icon} {selectedBookingType.label}:</strong> {selectedBookingType.description}
                {!selectedBookingType.allowOverlap && (
                  <span className="block mt-1 text-xs">
                    ⚠️ Überschneidungen mit anderen Buchungen sind nicht erlaubt
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Wochentag & Uhrzeit */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-blue-600" />
            Wöchentlicher Termin
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Wochentag</label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {DAYS_FULL.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Startzeit</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Endzeit</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {isLimited && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Verfügbare Slots am {DAYS_FULL[formData.dayOfWeek]}:</h4>
              {availableSlots.length > 0 ? (
                <ul className="space-y-1">
                  {availableSlots.map(slot => (
                    <li key={slot.id} className="text-blue-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {slot.startTime} - {slot.endTime} Uhr
                      <span className="text-xs text-blue-500">(bis {slot.validUntil})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-600">⚠️ Kein Slot an diesem Tag verfügbar. Bitte anderen Wochentag wählen.</p>
              )}
            </div>
          )}
        </div>

        {/* Zeitraum */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Zeitraum der Serie
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Startdatum</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enddatum</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {previewDates.length > 0 && (
            <div className="mt-4">
              {/* Zusammenfassung */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">
                  Vorschau: {previewDates.length} Termine
                </h4>
                {conflictAnalysis.hasErrors && (
                  <Badge variant="danger">
                    {conflictAnalysis.conflicts.length} Konflikte
                  </Badge>
                )}
                {!conflictAnalysis.hasErrors && conflictAnalysis.conflicts.length === 0 && (
                  <Badge variant="success">
                    ✓ Alle Termine verfügbar
                  </Badge>
                )}
              </div>

              {/* Detaillierte Termin-Liste mit Konflikt-Status */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {previewDates.map((date, i) => {
                  const dateConflict = conflictAnalysis.conflicts.find(c => c.date === date);
                  const hasConflict = !!dateConflict;
                  const hasError = dateConflict?.conflicts.some(c => c.severity === 'error');

                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border-2 ${
                        hasError
                          ? 'bg-red-50 border-red-300'
                          : hasConflict
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-green-50 border-green-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`text-2xl ${
                            hasError ? '❌' : hasConflict ? '⚠️' : '✅'
                          }`}>
                            {hasError ? '❌' : hasConflict ? '⚠️' : '✅'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {new Date(date).toLocaleDateString('de-DE', { 
                                weekday: 'short', 
                                day: '2-digit', 
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formData.startTime} - {formData.endTime} Uhr
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {!hasConflict && (
                            <span className="text-sm text-green-700 font-medium">Verfügbar</span>
                          )}
                        </div>
                      </div>

                      {/* Konflikt-Details */}
                      {hasConflict && (
                        <div className="mt-2 ml-11 space-y-1">
                          {dateConflict.conflicts.map((conflict, ci) => (
                            <div
                              key={ci}
                              className={`text-sm p-2 rounded ${
                                conflict.severity === 'error'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              <div className="font-medium flex items-center gap-2">
                                {conflict.severity === 'error' ? '🚫' : '⚠️'}
                                {conflict.message}
                              </div>
                              {conflict.booking && (
                                <div className="text-xs mt-1 opacity-80">
                                  {conflict.booking.startTime} - {conflict.booking.endTime} Uhr
                                  {conflict.booking.userId && users && (
                                    <span className="ml-2">
                                      • {users.find(u => u.id === conflict.booking.userId)?.firstName || 'Unbekannt'} {users.find(u => u.id === conflict.booking.userId)?.lastName || ''}
                                    </span>
                                  )}
                                </div>
                              )}
                              {conflict.explanation && (
                                <div className="text-xs mt-1 italic opacity-70">
                                  {conflict.explanation}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Gesamtstatistik */}
              {conflictAnalysis.conflicts.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-700">
                    <strong>Zusammenfassung:</strong>
                    <div className="mt-1 flex gap-4">
                      <span className="text-green-700">
                        ✓ {previewDates.length - conflictAnalysis.conflicts.length} verfügbar
                      </span>
                      <span className="text-red-700">
                        ❌ {conflictAnalysis.conflicts.length} mit Konflikten
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Benutzerauswahl */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Buchender Benutzer
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Benutzer auswählen *</label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Bitte auswählen --</option>
              <optgroup label="Administratoren">
                {users.filter(u => u.role === 'admin').map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.team || u.club})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Trainer">
                {users.filter(u => u.role === 'trainer').map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.team || u.club})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Externe">
                {users.filter(u => u.role === 'extern').map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.club})
                  </option>
                ))}
              </optgroup>
            </select>
            {formData.userId && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                {(() => {
                  const selectedUser = users.find(u => u.id === formData.userId);
                  const role = ROLES.find(r => r.id === selectedUser?.role);
                  return selectedUser ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: role?.color }} />
                      <span>{selectedUser.firstName} {selectedUser.lastName}</span>
                      <span>•</span>
                      <span>{role?.label}</span>
                      {selectedUser.role === 'extern' && (
                        <Badge variant="warning">Erfordert Genehmigung</Badge>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-4">Buchungsdetails</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Veranstaltung / Training *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="z.B. A-Jugend Training, Yoga Kurs, Vorstandssitzung"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung (optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Zusätzliche Informationen, besondere Anforderungen..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Zusammenfassung & Submit */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Zusammenfassung</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>📍 <strong>Ressource:</strong> {resource?.name}</li>
            <li>📅 <strong>Wochentag:</strong> {DAYS_FULL[formData.dayOfWeek]}</li>
            <li>🕐 <strong>Uhrzeit:</strong> {formData.startTime || '--:--'} - {formData.endTime || '--:--'}</li>
            <li>📆 <strong>Termine:</strong> {previewDates.length} Wochen</li>
            <li>👤 <strong>Benutzer:</strong> {formData.userId ? (() => {
              const u = users.find(x => x.id === formData.userId);
              return u ? `${u.firstName} ${u.lastName}` : 'Nicht ausgewählt';
            })() : 'Nicht ausgewählt'}</li>
            {isComposite && <li>⭐ <strong>Hinweis:</strong> Beide Spielfeldhälften werden reserviert</li>}
          </ul>
        </div>

        {/* Konflikt-Warnung vor Submit */}
        {conflictAnalysis.hasErrors && previewDates.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⛔</div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 mb-1">
                  Buchung nicht möglich
                </h4>
                <p className="text-sm text-red-700">
                  Es gibt {conflictAnalysis.conflicts.length} Termine mit Konflikten, die eine Buchung unmöglich machen.
                  Bitte passen Sie die Zeiten an oder wählen Sie einen anderen Zeitraum.
                </p>
              </div>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={previewDates.length === 0 || !formData.userId || conflictAnalysis.hasErrors}
          variant={conflictAnalysis.hasErrors ? 'secondary' : 'primary'}
        >
          <Plus className="w-5 h-5 inline mr-2" />
          {conflictAnalysis.hasErrors 
            ? '❌ Buchung nicht möglich (Konflikte vorhanden)'
            : `Anfrage einreichen (${previewDates.length} Termine)`
          }
        </Button>
      </form>
    </div>
  );
};

// Meine Buchungen mit Tabs
const MyBookings = ({ bookings, isAdmin, onDelete, users }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedResource, setSelectedResource] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, type: 'single' | 'series' }

  const getUserInfo = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return { name: 'Unbekannt', role: null };
    const role = ROLES.find(r => r.id === user.role);
    return {
      name: `${user.firstName} ${user.lastName}`,
      team: user.team,
      club: user.club,
      role,
    };
  };

  const categories = [
    { id: 'all', label: 'Alle Buchungen', icon: '📋' },
    { id: 'outdoor', label: 'Außenanlagen', icon: '🏟️' },
    { id: 'indoor', label: 'Innenräume', icon: '🏠' },
    { id: 'shared', label: 'Geteilte Hallen', icon: '🤝' },
  ];

  // Zähle Buchungen pro Kategorie
  const getBookingCountForCategory = (catId) => {
    if (catId === 'all') return bookings.length;
    const categoryResources = RESOURCES.filter(r => r.category === catId).map(r => r.id);
    return bookings.filter(b => categoryResources.includes(b.resourceId)).length;
  };

  // Zähle Buchungen pro Ressource
  const getBookingCountForResource = (resId) => {
    return bookings.filter(b => b.resourceId === resId).length;
  };

  // Ressourcen der gewählten Kategorie
  const categoryResources = selectedCategory !== 'all'
    ? RESOURCES.filter(r => r.category === selectedCategory)
    : [];

  // Filtere Buchungen nach Kategorie und Ressource
  const filteredBookings = useMemo(() => {
    if (selectedCategory === 'all') return bookings;

    const categoryResourceIds = RESOURCES.filter(r => r.category === selectedCategory).map(r => r.id);
    let filtered = bookings.filter(b => categoryResourceIds.includes(b.resourceId));

    if (selectedResource !== 'all') {
      filtered = filtered.filter(b => b.resourceId === selectedResource);
    }

    return filtered;
  }, [bookings, selectedCategory, selectedResource]);

  // Gruppiere nach Serie
  const groupedBookings = useMemo(() => {
    const series = {};
    const single = [];

    filteredBookings.forEach(b => {
      if (b.seriesId) {
        if (!series[b.seriesId]) {
          series[b.seriesId] = { ...b, dates: [] };
        }
        series[b.seriesId].dates.push(b.date);
      } else {
        single.push(b);
      }
    });

    return [...Object.values(series), ...single];
  }, [filteredBookings]);

  // Bei Kategorie-Wechsel: Ressource zurücksetzen
  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setSelectedResource('all');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Meine Buchungen</h2>

      {/* Kategorie-Tabs (Hauptebene) */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-lg">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                selectedCategory === cat.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {getBookingCountForCategory(cat.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ressourcen-Tabs (nur wenn Kategorie gewählt) */}
      {selectedCategory !== 'all' && categoryResources.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setSelectedResource('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                selectedResource === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Alle {categories.find(c => c.id === selectedCategory)?.label}
            </button>
            {categoryResources.map(res => (
              <button
                key={res.id}
                onClick={() => setSelectedResource(res.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-all flex items-center gap-1.5 ${
                  selectedResource === res.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={selectedResource === res.id ? { borderLeft: `3px solid ${res.color}` } : {}}
              >
                {res.isComposite && <span>⭐</span>}
                {res.type === 'limited' && <span>⚠️</span>}
                {res.name.replace('Große ', '').replace('Kleine ', 'Kl. ')}
                {getBookingCountForResource(res.id) > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {getBookingCountForResource(res.id)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Buchungsliste */}
      {groupedBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <List className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Keine Buchungen für diese Ressource</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedBookings.map((booking, idx) => {
            const resource = RESOURCES.find(r => r.id === booking.resourceId);
            const isSeries = booking.dates && booking.dates.length > 1;
            const userInfo = getUserInfo(booking.userId);

            return (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-full min-h-16 rounded-full" style={{ backgroundColor: resource?.color }} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">{booking.title}</h3>
                        {booking.bookingType && (
                          <Badge variant="default" className="text-xs">
                            {BOOKING_TYPES.find(t => t.id === booking.bookingType)?.icon} {BOOKING_TYPES.find(t => t.id === booking.bookingType)?.label}
                          </Badge>
                        )}
                        {isSeries && (
                          <Badge variant="info">
                            <Repeat className="w-3 h-3 inline mr-1" />
                            Serie ({booking.dates.length}x)
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {resource?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {booking.startTime} - {booking.endTime}
                      </p>
                      {isSeries ? (
                        <p className="text-sm text-gray-500">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {booking.dates.length} Termine ({booking.dates[0]} bis {booking.dates[booking.dates.length - 1]})
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {booking.date}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {userInfo.name}
                        {userInfo.role && (
                          <>
                            <span className="w-2 h-2 rounded-full ml-1" style={{ backgroundColor: userInfo.role.color }} />
                            <span className="text-xs">({userInfo.role.label})</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={booking.status === 'approved' ? 'success' : booking.status === 'pending' ? 'warning' : 'danger'}>
                      {booking.status === 'approved' ? 'Genehmigt' : booking.status === 'pending' ? 'Ausstehend' : 'Abgelehnt'}
                    </Badge>

                    {/* Admin: Lösch-Buttons */}
                    {isAdmin && (
                      <div className="flex flex-col gap-1">
                        {deleteConfirm?.id === booking.id ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs">
                            <p className="text-red-700 font-medium mb-2">Wirklich löschen?</p>
                            <div className="flex gap-1">
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  onDelete(booking.id, deleteConfirm.type, booking.seriesId);
                                  setDeleteConfirm(null);
                                }}
                              >
                                Ja, löschen
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                Abbrechen
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {isSeries ? (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirm({ id: booking.id, type: 'single' })}
                                  className="text-red-600 hover:bg-red-50"
                                  title="Nur diesen Termin löschen"
                                >
                                  <X className="w-4 h-4" />
                                  <span className="text-xs ml-1">1 Termin</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirm({ id: booking.id, type: 'series' })}
                                  className="text-red-600 hover:bg-red-50"
                                  title="Ganze Serie löschen"
                                >
                                  <X className="w-4 h-4" />
                                  <span className="text-xs ml-1">Serie</span>
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm({ id: booking.id, type: 'single' })}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Löschen
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Admin: Genehmigungen
const Approvals = ({ bookings, onApprove, onReject, users }) => {
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const [rejectDialog, setRejectDialog] = useState(null); // { bookingId, reason }

  const getUserInfo = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return { name: 'Unbekannt', role: null };
    const role = ROLES.find(r => r.id === user.role);
    return {
      name: `${user.firstName} ${user.lastName}`,
      team: user.team,
      club: user.club,
      role,
    };
  };

  const handleReject = (bookingId) => {
    if (rejectDialog && rejectDialog.reason) {
      onReject(bookingId, rejectDialog.reason);
      setRejectDialog(null);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Offene Genehmigungen
        <Badge variant="warning" className="ml-3">{pendingBookings.length}</Badge>
      </h2>

      {pendingBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <p>Keine offenen Anfragen</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingBookings.map(booking => {
            const resource = RESOURCES.find(r => r.id === booking.resourceId);
            const userInfo = getUserInfo(booking.userId);
            const showingRejectDialog = rejectDialog?.bookingId === booking.id;
            
            return (
              <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800">{booking.title}</h3>
                      {booking.bookingType && (
                        <Badge variant="default">
                          {BOOKING_TYPES.find(t => t.id === booking.bookingType)?.icon} {BOOKING_TYPES.find(t => t.id === booking.bookingType)?.label}
                        </Badge>
                      )}
                      {resource?.type === 'limited' && <Badge variant="warning">Limitiert</Badge>}
                      {resource?.isComposite && <Badge variant="info">Ganzes Feld</Badge>}
                      {booking.seriesId && <Badge variant="default">Serie</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {resource?.name}
                    </p>
                    <p className="text-sm text-gray-500 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {booking.date} • {booking.startTime} - {booking.endTime}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Angefragt von:
                      <span className="font-medium text-gray-700">{userInfo.name}</span>
                      {userInfo.role && (
                        <>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: userInfo.role.color }} />
                          <span className="text-xs">({userInfo.role.label})</span>
                        </>
                      )}
                      {userInfo.team && <span className="text-xs">• {userInfo.team}</span>}
                    </p>
                    
                    {showingRejectDialog && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <label className="block text-sm font-medium text-red-800 mb-2">
                          Grund der Ablehnung (optional):
                        </label>
                        <textarea
                          value={rejectDialog.reason}
                          onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                          placeholder="z.B. Ressource bereits anderweitig vergeben, Konflikt mit Hauptveranstaltung..."
                          rows={3}
                          className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                        />
                        <div className="flex gap-2 mt-2">
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleReject(booking.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Ablehnen & E-Mail senden
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setRejectDialog(null)}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!showingRejectDialog && (
                    <div className="flex gap-2 ml-4">
                      <Button variant="success" size="sm" onClick={() => onApprove(booking.id)}>
                        <Check className="w-4 h-4 mr-1" />
                        Genehmigen
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => setRejectDialog({ bookingId: booking.id, reason: '' })}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Ablehnen
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Admin: Slot-Verwaltung
const SlotManagement = ({ slots, setSlots }) => {
  const [showForm, setShowForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    resourceId: 'halle-gross',
    dayOfWeek: 1,
    startTime: '17:00',
    endTime: '21:00',
    validFrom: '',
    validUntil: '',
  });

  const handleAddSlot = (e) => {
    e.preventDefault();
    setSlots([...slots, { ...newSlot, id: Date.now() }]);
    setShowForm(false);
  };

  const handleDeleteSlot = (id) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  const limitedResources = RESOURCES.filter(r => r.type === 'limited');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Slot-Verwaltung</h2>
          <p className="text-gray-500">Verwalte die zugewiesenen Zeitfenster für geteilte Hallen</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5 mr-2" />
          Neuer Slot
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAddSlot} className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-4">Neuen Slot anlegen</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ressource</label>
              <select
                value={newSlot.resourceId}
                onChange={(e) => setNewSlot({ ...newSlot, resourceId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {limitedResources.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wochentag</label>
              <select
                value={newSlot.dayOfWeek}
                onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {DAYS_FULL.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Startzeit</label>
              <input
                type="time"
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endzeit</label>
              <input
                type="time"
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gültig ab</label>
              <input
                type="date"
                value={newSlot.validFrom}
                onChange={(e) => setNewSlot({ ...newSlot, validFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gültig bis</label>
              <input
                type="date"
                value={newSlot.validUntil}
                onChange={(e) => setNewSlot({ ...newSlot, validUntil: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit">Slot anlegen</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Abbrechen</Button>
          </div>
        </form>
      )}

      {limitedResources.map(resource => {
        const resourceSlots = slots.filter(s => s.resourceId === resource.id);
        return (
          <div key={resource.id} className="mb-8">
            <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: resource.color }} />
              {resource.name}
            </h3>
            {resourceSlots.length === 0 ? (
              <p className="text-gray-500 text-sm">Keine Slots angelegt</p>
            ) : (
              <div className="grid gap-2">
                {resourceSlots.map(slot => (
                  <div key={slot.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="info">{DAYS_FULL[slot.dayOfWeek]}</Badge>
                      <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
                      <span className="text-sm text-gray-500">
                        Gültig: {slot.validFrom} bis {slot.validUntil}
                      </span>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteSlot(slot.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// PDF Export Dialog
const PDFExportDialog = ({ isOpen, onClose, bookings, users }) => {
  const [selectedCategory, setSelectedCategory] = useState('outdoor');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);

  const categories = [
    { id: 'outdoor', label: 'Außenanlagen', resources: RESOURCES.filter(r => r.category === 'outdoor' && !r.isComposite) },
    { id: 'indoor', label: 'Innenräume', resources: RESOURCES.filter(r => r.category === 'indoor') },
    { id: 'shared', label: 'Geteilte Hallen', resources: RESOURCES.filter(r => r.category === 'shared') },
  ];

  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const years = [2025, 2026, 2027];

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName.charAt(0)}.` : '';
  };

  // Hilfsfunktionen für Kalendergenerierung
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Montag = 0
  };

  const generatePDF = async () => {
    setIsGenerating(true);

    // jsPDF dynamisch laden
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.head.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }
    const { jsPDF } = window.jspdf;

    const category = categories.find(c => c.id === selectedCategory);
    const resources = category.resources;
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);

    // PDF erstellen (Querformat für mehr Platz)
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 10;

    // Titel
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`SG Hünstetten - ${category.label}`, margin, 15);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${months[selectedMonth]} ${selectedYear}`, margin, 22);

    // Kalender-Grid berechnen
    const gridTop = 30;
    const dayWidth = (pageWidth - 2 * margin) / 7;
    const numWeeks = Math.ceil((firstDay + daysInMonth) / 7);
    const weekHeight = (pageHeight - gridTop - margin) / numWeeks;
    const resourceColWidth = dayWidth / resources.length;

    // Wochentage Header
    const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    weekDays.forEach((day, i) => {
      const x = margin + i * dayWidth;
      doc.setFillColor(240, 240, 240);
      doc.rect(x, gridTop, dayWidth, 8, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(x, gridTop, dayWidth, 8, 'S');
      doc.text(day, x + dayWidth / 2, gridTop + 5.5, { align: 'center' });
    });

    // Ressourcen-Spaltenüberschriften (in jeder Zelle)
    doc.setFontSize(5);

    // Tage zeichnen
    let currentDay = 1;
    for (let week = 0; week < numWeeks; week++) {
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const cellX = margin + dayOfWeek * dayWidth;
        const cellY = gridTop + 8 + week * weekHeight;

        // Zellenindex (0 = erster Montag)
        const cellIndex = week * 7 + dayOfWeek;

        if (cellIndex >= firstDay && currentDay <= daysInMonth) {
          // Gültiger Tag
          doc.setFillColor(255, 255, 255);
          doc.rect(cellX, cellY, dayWidth, weekHeight, 'F');
          doc.setDrawColor(200, 200, 200);
          doc.rect(cellX, cellY, dayWidth, weekHeight, 'S');

          // Tagesnummer
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(String(currentDay), cellX + 2, cellY + 4);

          // Ressourcen-Spalten-Linien
          resources.forEach((res, i) => {
            if (i > 0) {
              doc.setDrawColor(230, 230, 230);
              doc.line(cellX + i * resourceColWidth, cellY + 5, cellX + i * resourceColWidth, cellY + weekHeight);
            }

            // Ressourcen-Kürzel oben
            doc.setFontSize(4);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(128, 128, 128);
            const shortName = res.name.replace('Sportplatz - ', '').replace('Fußball-', '').substring(0, 6);
            doc.text(shortName, cellX + i * resourceColWidth + 1, cellY + 8);
          });

          // Buchungen für diesen Tag
          const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

          resources.forEach((res, resIndex) => {
            const dayBookings = bookings.filter(b =>
              b.date === dateStr &&
              b.resourceId === res.id &&
              b.status === 'approved'
            ).sort((a, b) => a.startTime.localeCompare(b.startTime));

            let yOffset = 10;
            dayBookings.forEach(booking => {
              if (yOffset < weekHeight - 3) {
                doc.setFontSize(4);
                doc.setFont('helvetica', 'normal');

                // Farbiger Hintergrund
                const rgb = hexToRgb(res.color);
                doc.setFillColor(rgb.r, rgb.g, rgb.b);
                doc.roundedRect(cellX + resIndex * resourceColWidth + 0.5, cellY + yOffset, resourceColWidth - 1, 6, 0.5, 0.5, 'F');

                // Text
                doc.setTextColor(255, 255, 255);
                const timeText = booking.startTime.substring(0, 5);
                doc.text(timeText, cellX + resIndex * resourceColWidth + 1, cellY + yOffset + 2.5);

                doc.setFontSize(3.5);
                const titleText = booking.title.substring(0, 10);
                doc.text(titleText, cellX + resIndex * resourceColWidth + 1, cellY + yOffset + 5);

                yOffset += 7;
              }
            });
          });

          currentDay++;
        } else {
          // Leere Zelle (anderer Monat)
          doc.setFillColor(245, 245, 245);
          doc.rect(cellX, cellY, dayWidth, weekHeight, 'F');
          doc.setDrawColor(200, 200, 200);
          doc.rect(cellX, cellY, dayWidth, weekHeight, 'S');
        }
      }
    }

    // Legende
    const legendY = pageHeight - 8;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Legende:', margin, legendY);

    let legendX = margin + 15;
    resources.forEach(res => {
      const rgb = hexToRgb(res.color);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(legendX, legendY - 3, 4, 4, 'F');
      doc.setFont('helvetica', 'normal');
      doc.text(res.name, legendX + 6, legendY);
      legendX += doc.getTextWidth(res.name) + 12;
    });

    // PDF speichern
    doc.save(`SG-Huenstetten-${category.label}-${months[selectedMonth]}-${selectedYear}.pdf`);

    setIsGenerating(false);
    onClose();
  };

  // Hex zu RGB Konverter
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileDown className="w-6 h-6 text-blue-600" />
          Monatsplan als PDF exportieren
        </h2>

        <div className="space-y-4">
          {/* Kategorie-Auswahl */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} ({cat.resources.length} Anlagen)
                </option>
              ))}
            </select>
          </div>

          {/* Ressourcen-Vorschau */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Enthaltene Anlagen:</p>
            <div className="flex flex-wrap gap-2">
              {categories.find(c => c.id === selectedCategory)?.resources.map(res => (
                <span
                  key={res.id}
                  className="px-2 py-1 text-xs text-white rounded"
                  style={{ backgroundColor: res.color }}
                >
                  {res.name}
                </span>
              ))}
            </div>
          </div>

          {/* Monat/Jahr Auswahl */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monat</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month, i) => (
                  <option key={i} value={i}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jahr</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="primary"
            className="flex-1"
            onClick={generatePDF}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>Generiere PDF...</>
            ) : (
              <>
                <FileDown className="w-5 h-5 mr-2" />
                PDF erstellen
              </>
            )}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
        </div>
      </div>
    </div>
  );
};

// Admin: E-Mail-Log
const EmailLog = ({ emailService }) => {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const emails = emailService.getSentEmails().sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">E-Mail-Log</h2>
          <p className="text-gray-500 mt-1">
            {emails.length} {emails.length === 1 ? 'E-Mail' : 'E-Mails'} versendet
          </p>
        </div>
        {emails.length > 0 && (
          <Button 
            variant="secondary" 
            onClick={() => {
              if (confirm('Möchten Sie wirklich alle E-Mails aus dem Log löschen?')) {
                emailService.clearEmails();
                setSelectedEmail(null);
              }
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Log leeren
          </Button>
        )}
      </div>

      {emails.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Noch keine E-Mails versendet</p>
          <p className="text-sm text-gray-400 mt-2">
            E-Mails werden hier zur Vorschau angezeigt (Prototyp-Modus)
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* E-Mail-Liste */}
          <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto">
            {emails.map(email => (
              <button
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedEmail?.id === email.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Mail className={`w-5 h-5 ${
                    selectedEmail?.id === email.id ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <Badge variant={email.status === 'sent' ? 'success' : 'default'}>
                    {email.status === 'sent' ? '✓ Versendet' : 'Ausstehend'}
                  </Badge>
                </div>
                <div className="font-medium text-gray-800 text-sm mb-1 truncate">
                  {email.subject}
                </div>
                <div className="text-xs text-gray-500 truncate mb-1">
                  An: {email.to}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(email.sentAt).toLocaleString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </button>
            ))}
          </div>

          {/* E-Mail-Vorschau */}
          <div className="lg:col-span-2">
            {selectedEmail ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3">{selectedEmail.subject}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium min-w-16">Von:</span>
                      <span className="text-gray-700">noreply@sg-huenstetten.de</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium min-w-16">An:</span>
                      <span className="text-gray-700">{selectedEmail.to}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium min-w-16">Datum:</span>
                      <span className="text-gray-700">
                        {new Date(selectedEmail.sentAt).toLocaleString('de-DE', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6 overflow-auto" style={{ maxHeight: '600px' }}>
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Wählen Sie eine E-Mail aus der Liste</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info-Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 text-2xl">ℹ️</div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-800 mb-1">Prototyp-Modus</h4>
            <p className="text-sm text-blue-700">
              Dies ist eine Vorschau der E-Mails, die im echten System versendet würden. 
              In der Produktivversion werden diese E-Mails tatsächlich an die Empfänger gesendet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin: Benutzerverwaltung
const UserManagement = ({ users, setUsers }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    club: 'SG Hünstetten',
    team: '',
    email: '',
    phone: '',
    role: 'trainer',
  });

  const filteredUsers = filterRole === 'all'
    ? users
    : users.filter(u => u.role === filterRole);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...newUser, id: editingUser.id } : u));
      setEditingUser(null);
    } else {
      setUsers([...users, { ...newUser, id: Date.now() }]);
    }
    setNewUser({ firstName: '', lastName: '', club: 'SG Hünstetten', team: '', email: '', phone: '', role: 'trainer' });
    setShowForm(false);
  };

  const handleEdit = (user) => {
    setNewUser(user);
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Benutzer wirklich löschen?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Benutzerverwaltung</h2>
          <p className="text-gray-500">{users.length} Benutzer registriert</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditingUser(null); setNewUser({ firstName: '', lastName: '', club: 'SG Hünstetten', team: '', email: '', phone: '', role: 'trainer' }); }}>
          <UserPlus className="w-5 h-5 mr-2" />
          Neuer Benutzer
        </Button>
      </div>

      {/* Filter nach Rolle */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-lg">
          <button
            onClick={() => setFilterRole('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              filterRole === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Alle ({users.length})
          </button>
          {ROLES.map(role => (
            <button
              key={role.id}
              onClick={() => setFilterRole(role.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                filterRole === role.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
              {role.label} ({users.filter(u => u.role === role.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Formular */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-4">{editingUser ? 'Benutzer bearbeiten' : 'Neuen Benutzer anlegen'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vorname *</label>
              <input
                type="text"
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nachname *</label>
              <input
                type="text"
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verein *</label>
              <input
                type="text"
                value={newUser.club}
                onChange={(e) => setNewUser({ ...newUser, club: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mannschaft / Kurs</label>
              <input
                type="text"
                value={newUser.team}
                onChange={(e) => setNewUser({ ...newUser, team: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input
                type="tel"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rolle *</label>
              <div className="flex gap-4">
                {ROLES.map(role => (
                  <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={role.id}
                      checked={newUser.role === role.id}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                    <span className="text-sm">{role.label}</span>
                    <span className="text-xs text-gray-500">- {role.description}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit">{editingUser ? 'Speichern' : 'Anlegen'}</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingUser(null); }}>Abbrechen</Button>
          </div>
        </form>
      )}

      {/* Benutzerliste */}
      <div className="space-y-3">
        {filteredUsers.map(user => {
          const role = ROLES.find(r => r.id === user.role);
          return (
            <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: role?.color }}
                  >
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{user.firstName} {user.lastName}</h3>
                      <Badge
                        variant={user.role === 'admin' ? 'danger' : user.role === 'trainer' ? 'info' : 'default'}
                      >
                        {role?.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      <Building className="w-4 h-4 inline mr-1" />
                      {user.club} {user.team && `• ${user.team}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      <Mail className="w-4 h-4 inline mr-1" />
                      {user.email}
                    </p>
                    {user.phone && (
                      <p className="text-sm text-gray-500">
                        <Phone className="w-4 h-4 inline mr-1" />
                        {user.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(user)}>
                    Bearbeiten
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Hauptkomponente
export default function SportvereinBuchung() {
  const [currentView, setCurrentView] = useState('calendar');
  const [isAdmin, setIsAdmin] = useState(true);
  const [selectedResource, setSelectedResource] = useState('sportplatz-links');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState(DEMO_BOOKINGS);
  const [slots, setSlots] = useState(DEMO_SLOTS);
  const [users, setUsers] = useState(DEMO_USERS);
  const [showPDFExport, setShowPDFExport] = useState(false);
  
  // E-Mail-Service initialisieren
  const [emailService] = useState(() => new EmailService());

  const handleApprove = async (id) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    // Buchung genehmigen
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'approved' } : b));

    // E-Mail an Benutzer senden
    const user = users.find(u => u.id === booking.userId);
    const resource = RESOURCES.find(r => r.id === booking.resourceId);
    const approver = users.find(u => u.role === 'admin'); // Demo: Erster Admin

    if (user && resource && approver) {
      await emailService.send(EMAIL_TEMPLATES.bookingApproved(booking, user, resource, approver));
    }
  };

  const handleReject = async (id, reason = '') => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    // Buchung ablehnen
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'rejected' } : b));

    // E-Mail an Benutzer senden
    const user = users.find(u => u.id === booking.userId);
    const resource = RESOURCES.find(r => r.id === booking.resourceId);
    const approver = users.find(u => u.role === 'admin'); // Demo: Erster Admin

    if (user && resource && approver) {
      await emailService.send(EMAIL_TEMPLATES.bookingRejected(booking, user, resource, approver, reason));
    }
  };

  const handleNewBooking = async (data) => {
    const seriesId = `series-${Date.now()}`;
    // Bestimme den Status basierend auf Benutzerrolle
    const user = users.find(u => u.id === data.userId);
    // Admin und Trainer: automatisch genehmigt, Externe: ausstehend
    const bookingStatus = user?.role === 'extern' ? 'pending' : 'approved';

    const newBookings = data.dates.map((date, i) => ({
      id: Date.now() + i,
      resourceId: data.resourceId,
      date,
      startTime: data.startTime,
      endTime: data.endTime,
      title: data.title,
      description: data.description,
      bookingType: data.bookingType,
      userId: data.userId,
      status: bookingStatus,
      seriesId: data.dates.length > 1 ? seriesId : null,
    }));

    // Bei "Ganzes Spielfeld" auch beide Hälften blocken
    if (data.isComposite && data.includedResources) {
      data.includedResources.forEach(resId => {
        data.dates.forEach((date, i) => {
          newBookings.push({
            id: Date.now() + 1000 + i,
            resourceId: resId,
            date,
            startTime: data.startTime,
            endTime: data.endTime,
            title: `${data.title} (Ganzes Feld)`,
            bookingType: data.bookingType,
            userId: data.userId,
            status: bookingStatus,
            seriesId,
            parentBooking: true,
          });
        });
      });
    }

    setBookings([...bookings, ...newBookings]);

    // E-Mails versenden
    const resource = RESOURCES.find(r => r.id === data.resourceId);
    
    if (user && resource) {
      // E-Mail an Benutzer: Buchung erstellt
      await emailService.send(EMAIL_TEMPLATES.bookingCreated(newBookings[0], user, resource));

      // Bei Externen: E-Mail an Admin
      if (user.role === 'extern') {
        const admins = users.filter(u => u.role === 'admin');
        for (const admin of admins) {
          await emailService.send(EMAIL_TEMPLATES.adminNewBooking(newBookings[0], user, resource, admin.email));
        }
      }
    }
  };

  const handleDeleteBooking = (bookingId, deleteType, seriesId) => {
    if (deleteType === 'series' && seriesId) {
      // Ganze Serie löschen
      setBookings(bookings.filter(b => b.seriesId !== seriesId));
    } else {
      // Einzelnen Termin löschen
      setBookings(bookings.filter(b => b.id !== bookingId));
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isAdmin={isAdmin}
        onExportPDF={() => setShowPDFExport(true)}
        emailService={emailService}
      />

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex justify-end mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              Admin-Modus (Demo)
            </label>
          </div>

          {currentView === 'calendar' && (
            <CalendarView
              bookings={bookings}
              slots={slots}
              selectedResource={selectedResource}
              setSelectedResource={setSelectedResource}
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              users={users}
            />
          )}
          {currentView === 'bookings' && <MyBookings bookings={bookings} isAdmin={isAdmin} onDelete={handleDeleteBooking} users={users} />}
          {currentView === 'request' && <BookingRequest slots={slots} bookings={bookings} onSubmit={handleNewBooking} users={users} />}
          {currentView === 'approvals' && <Approvals bookings={bookings} onApprove={handleApprove} onReject={handleReject} users={users} />}
          {currentView === 'slots' && <SlotManagement slots={slots} setSlots={setSlots} />}
          {currentView === 'users' && <UserManagement users={users} setUsers={setUsers} />}
          {currentView === 'emails' && <EmailLog emailService={emailService} />}
        </div>
      </main>

      {/* PDF Export Dialog */}
      <PDFExportDialog
        isOpen={showPDFExport}
        onClose={() => setShowPDFExport(false)}
        bookings={bookings}
        users={users}
      />
    </div>
  );
}
