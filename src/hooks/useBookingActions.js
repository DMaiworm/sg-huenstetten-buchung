import { useCallback, useMemo } from 'react';
import { useBookingContext } from '../contexts/BookingContext';
import { useUserContext } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useFacility } from '../contexts/FacilityContext';
import { EmailService, EMAIL_TEMPLATES } from '../services/emailService';

/**
 * useBookingActions – kapselt alle Buchungs-Handler.
 *
 * Ersetzt die Handler die vorher direkt in AppLayout definiert waren:
 *   handleNewBooking, handleApprove, handleReject, handleDeleteBooking
 */
export function useBookingActions() {
  const {
    bookings, createBookings,
    updateBooking, updateBookingStatus, updateSeriesStatus,
    deleteBooking, deleteBookingSeries,
  } = useBookingContext();

  const { users } = useUserContext();
  const { addToast } = useToast();
  const { profile } = useAuth();
  const { RESOURCES } = useFacility();
  const emailService = useMemo(() => new EmailService(), []);

  /** Bestimmt ob eine Buchung auto-approved wird. */
  const resolveBookingStatus = useCallback((userId) => {
    const u = users.find(x => x.id === userId);
    return (u?.kannGenehmigen || u?.kannAdministrieren) ? 'approved' : 'pending';
  }, [users]);

  /** Buchung oder Serie genehmigen. singleOnly=true → nur diesen Einzeltermin. */
  const handleApprove = useCallback(async (id, { singleOnly = false } = {}) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    const result = (booking.seriesId && !singleOnly)
      ? await updateSeriesStatus(booking.seriesId, 'approved')
      : await updateBookingStatus(id, 'approved');
    if (result.error) {
      addToast('Fehler beim Genehmigen: ' + result.error, 'error');
    } else {
      addToast('Buchung genehmigt.', 'success');
      const bookingUser = users.find(u => u.id === booking.userId);
      const resource    = RESOURCES.find(r => r.id === booking.resourceId);
      if (bookingUser?.email && resource) {
        const approver = { firstName: profile?.first_name || '', lastName: profile?.last_name || '' };
        emailService.send(EMAIL_TEMPLATES.bookingApproved(booking, bookingUser, resource, approver)).catch(() => {});
      }
    }
  }, [bookings, updateBookingStatus, updateSeriesStatus, addToast, users, RESOURCES, profile, emailService]);

  /** Buchung oder Serie ablehnen. singleOnly=true → nur diesen Einzeltermin. */
  const handleReject = useCallback(async (id, { singleOnly = false } = {}) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    const result = (booking.seriesId && !singleOnly)
      ? await updateSeriesStatus(booking.seriesId, 'rejected')
      : await updateBookingStatus(id, 'rejected');
    if (result.error) {
      addToast('Fehler beim Ablehnen: ' + result.error, 'error');
    } else {
      addToast('Buchung abgelehnt.', 'warning');
      const bookingUser = users.find(u => u.id === booking.userId);
      const resource    = RESOURCES.find(r => r.id === booking.resourceId);
      if (bookingUser?.email && resource) {
        const approver = { firstName: profile?.first_name || '', lastName: profile?.last_name || '' };
        emailService.send(EMAIL_TEMPLATES.bookingRejected(booking, bookingUser, resource, approver, null)).catch(() => {});
      }
    }
  }, [bookings, updateBookingStatus, updateSeriesStatus, addToast, users, RESOURCES, profile, emailService]);

  /** Neue Buchung(en) erstellen inkl. Composite-Logik. */
  const handleNewBooking = useCallback(async (data) => {
    if (!data.userId) {
      addToast('Kein Trainer für die ausgewählte Mannschaft gefunden.', 'error');
      return;
    }
    const needsSeriesId = data.dates.length > 1 || (data.isComposite && data.includedResources);
    const seriesId      = needsSeriesId ? `series-${Date.now()}` : null;
    const bookingStatus = resolveBookingStatus(data.userId);

    const newBookings = data.dates.map(date => ({
      resourceId: data.resourceId, date,
      startTime: data.startTime, endTime: data.endTime,
      title: data.title, description: data.description,
      bookingType: data.bookingType, userId: data.userId,
      teamId: data.teamId || null,
      status: bookingStatus, seriesId,
    }));

    if (data.isComposite && data.includedResources) {
      data.includedResources.forEach(resId => {
        data.dates.forEach(date => {
          newBookings.push({
            resourceId: resId, date,
            startTime: data.startTime, endTime: data.endTime,
            title: data.title + ' (Ganzes Feld)',
            bookingType: data.bookingType,
            userId: data.userId, teamId: data.teamId || null,
            status: bookingStatus,
            seriesId, parentBooking: true,
          });
        });
      });
    }

    const result = await createBookings(newBookings);
    if (result.error) {
      addToast('Fehler beim Erstellen der Buchung: ' + result.error, 'error');
      return;
    }
    const anzahl = data.dates.length;
    addToast(
      `Buchungsanfrage für ${anzahl} Termin${anzahl !== 1 ? 'e' : ''} eingereicht!`,
      bookingStatus === 'approved' ? 'success' : 'info'
    );

    // E-Mail-Benachrichtigungen
    const firstBooking = result.data?.[0];
    const bookingUser  = users.find(u => u.id === data.userId);
    const resource     = RESOURCES.find(r => r.id === data.resourceId);
    if (firstBooking && bookingUser?.email && resource) {
      emailService.send(EMAIL_TEMPLATES.bookingCreated(firstBooking, bookingUser, resource)).catch(() => {});
      if (bookingStatus === 'pending') {
        users
          .filter(u => u.kannAdministrieren && u.email)
          .forEach(admin => {
            emailService.send(EMAIL_TEMPLATES.adminNewBooking(firstBooking, bookingUser, resource, admin.email)).catch(() => {});
          });
      }
    }
  }, [createBookings, resolveBookingStatus, addToast, users, RESOURCES, emailService]);

  /** Buchung bearbeiten. Bei Terminänderung → neuer Genehmigungsprozess. */
  const handleEditBooking = useCallback(async (bookingId, updates) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { error: 'Buchung nicht gefunden' };

    const scheduleChanged =
      (updates.date !== undefined && updates.date !== booking.date) ||
      (updates.startTime !== undefined && updates.startTime !== booking.startTime) ||
      (updates.endTime !== undefined && updates.endTime !== booking.endTime) ||
      (updates.resourceId !== undefined && updates.resourceId !== booking.resourceId);

    if (scheduleChanged) {
      updates.status = resolveBookingStatus(booking.userId);
    }

    const result = await updateBooking(bookingId, updates);
    if (result.error) {
      addToast('Fehler beim Speichern: ' + result.error, 'error');
    } else {
      addToast('Buchung gespeichert.', 'success');
    }
    return result;
  }, [bookings, updateBooking, resolveBookingStatus, addToast]);

  /** Einzelne Buchung oder Serie löschen. */
  const handleDeleteBooking = useCallback(async (bookingId, deleteType, seriesId) => {
    const result = (deleteType === 'series' && seriesId)
      ? await deleteBookingSeries(seriesId)
      : await deleteBooking(bookingId);
    if (result.error) {
      addToast('Fehler beim Löschen: ' + result.error, 'error');
    } else {
      addToast(
        deleteType === 'series' ? 'Terminserie gelöscht.' : 'Termin gelöscht.',
        'success'
      );
    }
  }, [deleteBooking, deleteBookingSeries, addToast]);

  return {
    handleNewBooking,
    handleEditBooking,
    handleApprove,
    handleReject,
    handleDeleteBooking,
    resolveBookingStatus,
  };
}
