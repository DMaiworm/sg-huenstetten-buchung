import { useCallback } from 'react';
import { useBookingContext } from '../contexts/BookingContext';
import { useUserContext } from '../contexts/UserContext';

/**
 * useBookingActions – kapselt alle Buchungs-Handler.
 *
 * Ersetzt die Handler die vorher direkt in AppLayout definiert waren:
 *   handleNewBooking, handleApprove, handleReject, handleDeleteBooking
 */
export function useBookingActions() {
  const {
    bookings, createBookings,
    updateBookingStatus, updateSeriesStatus,
    deleteBooking, deleteBookingSeries,
  } = useBookingContext();

  const { users } = useUserContext();

  /** Bestimmt ob eine Buchung auto-approved wird. */
  const resolveBookingStatus = useCallback((userId) => {
    const u = users.find(x => x.id === userId);
    return (u?.kannGenehmigen || u?.kannAdministrieren) ? 'approved' : 'pending';
  }, [users]);

  /** Buchung oder Serie genehmigen. */
  const handleApprove = useCallback(async (id) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    const result = booking.seriesId
      ? await updateSeriesStatus(booking.seriesId, 'approved')
      : await updateBookingStatus(id, 'approved');
    if (result.error) window.alert('Fehler: ' + result.error);
  }, [bookings, updateBookingStatus, updateSeriesStatus]);

  /** Buchung oder Serie ablehnen. */
  const handleReject = useCallback(async (id) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    const result = booking.seriesId
      ? await updateSeriesStatus(booking.seriesId, 'rejected')
      : await updateBookingStatus(id, 'rejected');
    if (result.error) window.alert('Fehler: ' + result.error);
  }, [bookings, updateBookingStatus, updateSeriesStatus]);

  /** Neue Buchung(en) erstellen inkl. Composite-Logik. */
  const handleNewBooking = useCallback(async (data) => {
    if (!data.userId) {
      window.alert('Kein Trainer f\u00fcr die ausgew\u00e4hlte Mannschaft gefunden.');
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
            userId: data.userId, status: bookingStatus,
            seriesId, parentBooking: true,
          });
        });
      });
    }

    const result = await createBookings(newBookings);
    if (result.error) {
      window.alert('Fehler: ' + result.error);
      return;
    }
    window.alert('Buchungsanfrage f\u00fcr ' + data.dates.length + ' Termin(e) eingereicht!');
  }, [createBookings, resolveBookingStatus]);

  /** Einzelne Buchung oder Serie l\u00f6schen. */
  const handleDeleteBooking = useCallback(async (bookingId, deleteType, seriesId) => {
    const result = (deleteType === 'series' && seriesId)
      ? await deleteBookingSeries(seriesId)
      : await deleteBooking(bookingId);
    if (result.error) window.alert('Fehler: ' + result.error);
  }, [deleteBooking, deleteBookingSeries]);

  return {
    handleNewBooking,
    handleApprove,
    handleReject,
    handleDeleteBooking,
    resolveBookingStatus,
  };
}
