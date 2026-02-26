import { EVENT_TYPES } from '../config/organizationConfig';
import { supabase } from '../lib/supabase';

// E-Mail-Template-System
export const EMAIL_TEMPLATES = {
  bookingCreated: (booking, user, resource) => ({
    to: user.email,
    subject: `Buchung bestaetigt: ${booking.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0 0 10px 0;">Buchung bestaetigt</h1>
            <p style="color: #6b7280; margin: 0;">Ihre Buchungsanfrage wurde erfolgreich erstellt</p>
          </div>
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">${booking.title}</h2>
            <div style="color: #374151; line-height: 1.8;">
              <p style="margin: 5px 0;"><strong>Ressource:</strong> ${resource.name}</p>
              <p style="margin: 5px 0;"><strong>Datum:</strong> ${new Date(booking.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p style="margin: 5px 0;"><strong>Uhrzeit:</strong> ${booking.startTime} - ${booking.endTime} Uhr</p>
              ${booking.bookingType ? `<p style="margin: 5px 0;"><strong>Art:</strong> ${EVENT_TYPES.find(t => t.id === booking.bookingType)?.icon} ${EVENT_TYPES.find(t => t.id === booking.bookingType)?.label}</p>` : ''}
              ${booking.seriesId ? `<p style="margin: 5px 0;"><strong>Serie:</strong> Wiederkehrende Buchung</p>` : ''}
            </div>
          </div>
          ${booking.status === 'pending' ? `
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Wartet auf Genehmigung</strong><br>
                Ihre Anfrage wird von einem Administrator geprueft. Sie erhalten eine weitere E-Mail, sobald eine Entscheidung getroffen wurde.
              </p>
            </div>
          ` : `
            <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                <strong>Automatisch genehmigt</strong><br>
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
              SG Huenstetten - Ressourcen-Buchungssystem<br>
              Bei Fragen wenden Sie sich bitte an den Vorstand.
            </p>
          </div>
        </div>
      </div>
    `
  }),

  bookingApproved: (booking, user, resource, approver) => ({
    to: user.email,
    subject: `Buchung genehmigt: ${booking.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin: 0 0 10px 0;">Buchung genehmigt</h1>
            <p style="color: #6b7280; margin: 0;">Ihre Buchungsanfrage wurde genehmigt</p>
          </div>
          <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">${booking.title}</h2>
            <div style="color: #374151; line-height: 1.8;">
              <p style="margin: 5px 0;"><strong>Ressource:</strong> ${resource.name}</p>
              <p style="margin: 5px 0;"><strong>Datum:</strong> ${new Date(booking.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p style="margin: 5px 0;"><strong>Uhrzeit:</strong> ${booking.startTime} - ${booking.endTime} Uhr</p>
              ${booking.bookingType ? `<p style="margin: 5px 0;"><strong>Art:</strong> ${EVENT_TYPES.find(t => t.id === booking.bookingType)?.icon} ${EVENT_TYPES.find(t => t.id === booking.bookingType)?.label}</p>` : ''}
            </div>
          </div>
          <div style="background-color: #f0f9ff; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;"><strong>Genehmigt von:</strong> ${approver.firstName} ${approver.lastName}</p>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">SG Huenstetten - Ressourcen-Buchungssystem<br>Bei Fragen wenden Sie sich bitte an den Vorstand.</p>
          </div>
        </div>
      </div>
    `
  }),

  bookingRejected: (booking, user, resource, approver, reason) => ({
    to: user.email,
    subject: `Buchung abgelehnt: ${booking.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0 0 10px 0;">Buchung abgelehnt</h1>
            <p style="color: #6b7280; margin: 0;">Ihre Buchungsanfrage wurde leider abgelehnt</p>
          </div>
          <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="color: #991b1b; margin: 0 0 15px 0; font-size: 18px;">${booking.title}</h2>
            <div style="color: #374151; line-height: 1.8;">
              <p style="margin: 5px 0;"><strong>Ressource:</strong> ${resource.name}</p>
              <p style="margin: 5px 0;"><strong>Datum:</strong> ${new Date(booking.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p style="margin: 5px 0;"><strong>Uhrzeit:</strong> ${booking.startTime} - ${booking.endTime} Uhr</p>
            </div>
          </div>
          ${reason ? `
            <div style="background-color: #fef3c7; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
              <p style="color: #92400e; margin: 0 0 5px 0; font-size: 14px;"><strong>Grund:</strong></p>
              <p style="color: #78350f; margin: 0; font-size: 14px;">${reason}</p>
            </div>
          ` : ''}
          <div style="background-color: #f0f9ff; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;"><strong>Abgelehnt von:</strong> ${approver.firstName} ${approver.lastName}</p>
          </div>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px;">
            <p style="color: #374151; margin: 0; font-size: 14px;"><strong>Tipp:</strong> Versuchen Sie eine andere Zeit oder kontaktieren Sie den Vorstand.</p>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">SG Huenstetten - Ressourcen-Buchungssystem<br>Bei Fragen wenden Sie sich bitte an den Vorstand.</p>
          </div>
        </div>
      </div>
    `
  }),

  adminNewBooking: (booking, user, resource, adminEmail) => ({
    to: adminEmail,
    subject: `Neue Buchungsanfrage von ${user.firstName} ${user.lastName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0 0 10px 0;">Neue Buchungsanfrage</h1>
            <p style="color: #6b7280; margin: 0;">Wartet auf Ihre Genehmigung</p>
          </div>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="color: #78350f; margin: 0 0 15px 0; font-size: 18px;">${booking.title}</h2>
            <div style="color: #374151; line-height: 1.8;">
              <p style="margin: 5px 0;"><strong>Ressource:</strong> ${resource.name}</p>
              <p style="margin: 5px 0;"><strong>Datum:</strong> ${new Date(booking.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p style="margin: 5px 0;"><strong>Uhrzeit:</strong> ${booking.startTime} - ${booking.endTime} Uhr</p>
              ${booking.bookingType ? `<p style="margin: 5px 0;"><strong>Art:</strong> ${EVENT_TYPES.find(t => t.id === booking.bookingType)?.icon} ${EVENT_TYPES.find(t => t.id === booking.bookingType)?.label}</p>` : ''}
              ${booking.seriesId ? `<p style="margin: 5px 0;"><strong>Serie:</strong> Wiederkehrende Buchung</p>` : ''}
            </div>
          </div>
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">Anfrager</h3>
            <div style="color: #374151; line-height: 1.8; font-size: 14px;">
              <p style="margin: 5px 0;"><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
              ${user.club ? `<p style="margin: 5px 0;"><strong>Verein:</strong> ${user.club}</p>` : ''}
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
            <p style="color: #1f2937; margin: 0 0 15px 0; font-size: 14px;"><strong>Bitte bearbeiten Sie diese Anfrage im Buchungssystem.</strong></p>
            <p style="color: #6b7280; font-size: 12px; margin: 0;">SG Huenstetten - Ressourcen-Buchungssystem</p>
          </div>
        </div>
      </div>
    `
  })
};

// E-Mail-Service (Resend via Supabase Edge Function)
export class EmailService {
  constructor() {
    this._cache = null;
  }

  async send(emailData) {
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('send-email', {
        body: { to: emailData.to, subject: emailData.subject, html: emailData.html },
      });
      this._cache = null;
      if (fnError) {
        console.error('E-Mail-Versand fehlgeschlagen:', fnError);
        return { ...emailData, status: 'failed', sentAt: new Date().toISOString() };
      }
      return { ...emailData, status: result?.status || 'sent', sentAt: new Date().toISOString() };
    } catch (err) {
      console.error('E-Mail-Versand Fehler:', err);
      return { ...emailData, status: 'failed', sentAt: new Date().toISOString() };
    }
  }

  async getSentEmails() {
    try {
      const { data, error } = await supabase
        .from('sent_emails')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []).map(e => ({
        id: e.id,
        to: e.recipient,
        subject: e.subject,
        html: e.html_body,
        status: e.status,
        sentAt: e.created_at,
        errorMessage: e.error_message,
      }));
    } catch (err) {
      console.warn('E-Mail-Log nicht geladen:', err.message);
      return [];
    }
  }

  async clearEmails() {
    try {
      await supabase.from('sent_emails').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.warn('E-Mail-Log leeren fehlgeschlagen:', err.message);
    }
  }
}
