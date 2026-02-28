import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useBookingActions } from './useBookingActions';

// ── Mocks für Contexts ───────────────────────────────────────

const mockUpdateBookingStatus = jest.fn();
const mockUpdateSeriesStatus  = jest.fn();
const mockUpdateBooking       = jest.fn();
const mockCreateBookings      = jest.fn();
const mockDeleteBooking       = jest.fn();
const mockDeleteBookingSeries = jest.fn();
const mockAddToast            = jest.fn();

// Standardmäßig geben alle Mutations kein Fehler zurück
beforeEach(() => {
  jest.clearAllMocks();
  mockUpdateBookingStatus.mockResolvedValue({ error: null });
  mockUpdateSeriesStatus.mockResolvedValue({ error: null });
  mockUpdateBooking.mockResolvedValue({ error: null });
  mockCreateBookings.mockResolvedValue({ error: null });
  mockDeleteBooking.mockResolvedValue({ error: null });
  mockDeleteBookingSeries.mockResolvedValue({ error: null });
});

const bookings = [
  { id: 'b1', seriesId: null,  status: 'pending', userId: 'u1' },
  { id: 'b2', seriesId: 's1',  status: 'pending', userId: 'u1' },
  { id: 'b3', seriesId: 's1',  status: 'pending', userId: 'u1' },
];
const users = [
  { id: 'u1', kannGenehmigen: false, kannAdministrieren: false },
  { id: 'u2', kannGenehmigen: true,  kannAdministrieren: false },
  { id: 'u3', kannGenehmigen: false, kannAdministrieren: true  },
];

jest.mock('../contexts/BookingContext', () => ({
  useBookingContext: () => ({
    bookings,
    updateBookingStatus:  mockUpdateBookingStatus,
    updateSeriesStatus:   mockUpdateSeriesStatus,
    updateBooking:        mockUpdateBooking,
    createBookings:       mockCreateBookings,
    deleteBooking:        mockDeleteBooking,
    deleteBookingSeries:  mockDeleteBookingSeries,
  }),
}));

jest.mock('../contexts/UserContext', () => ({
  useUserContext: () => ({ users }),
}));

jest.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'admin1', first_name: 'Test', last_name: 'Admin' } }),
}));

const mockResources = [
  { id: 'r1', name: 'Platz 1' },
];

jest.mock('../contexts/FacilityContext', () => ({
  useFacility: () => ({ RESOURCES: mockResources }),
}));

// ── resolveBookingStatus ─────────────────────────────────────
describe('resolveBookingStatus', () => {
  it('gibt pending zurück für Trainer ohne Genehmigungs-Berechtigung', () => {
    const { result } = renderHook(() => useBookingActions());
    expect(result.current.resolveBookingStatus('u1')).toBe('pending');
  });

  it('gibt approved zurück für Nutzer mit kannGenehmigen=true', () => {
    const { result } = renderHook(() => useBookingActions());
    expect(result.current.resolveBookingStatus('u2')).toBe('approved');
  });

  it('gibt approved zurück für Nutzer mit kannAdministrieren=true', () => {
    const { result } = renderHook(() => useBookingActions());
    expect(result.current.resolveBookingStatus('u3')).toBe('approved');
  });
});

// ── handleApprove ────────────────────────────────────────────
describe('handleApprove', () => {
  it('genehmigt Einzelbuchung über updateBookingStatus', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleApprove('b1'); });
    expect(mockUpdateBookingStatus).toHaveBeenCalledWith('b1', 'approved');
    expect(mockUpdateSeriesStatus).not.toHaveBeenCalled();
  });

  it('genehmigt komplette Serie über updateSeriesStatus', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleApprove('b2'); });
    expect(mockUpdateSeriesStatus).toHaveBeenCalledWith('s1', 'approved');
    expect(mockUpdateBookingStatus).not.toHaveBeenCalled();
  });

  it('genehmigt nur Einzeltermin wenn singleOnly=true', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleApprove('b2', { singleOnly: true }); });
    expect(mockUpdateBookingStatus).toHaveBeenCalledWith('b2', 'approved');
    expect(mockUpdateSeriesStatus).not.toHaveBeenCalled();
  });

  it('zeigt success-Toast bei Erfolg', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleApprove('b1'); });
    expect(mockAddToast).toHaveBeenCalledWith('Buchung genehmigt.', 'success');
  });

  it('zeigt error-Toast bei Fehler', async () => {
    mockUpdateBookingStatus.mockResolvedValue({ error: 'DB-Fehler' });
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleApprove('b1'); });
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('DB-Fehler'), 'error');
  });

  it('tut nichts wenn Buchung nicht gefunden', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleApprove('nicht-vorhanden'); });
    expect(mockUpdateBookingStatus).not.toHaveBeenCalled();
    expect(mockAddToast).not.toHaveBeenCalled();
  });
});

// ── handleReject ─────────────────────────────────────────────
describe('handleReject', () => {
  it('lehnt Einzelbuchung ab über updateBookingStatus', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleReject('b1'); });
    expect(mockUpdateBookingStatus).toHaveBeenCalledWith('b1', 'rejected');
  });

  it('lehnt komplette Serie ab über updateSeriesStatus', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleReject('b2'); });
    expect(mockUpdateSeriesStatus).toHaveBeenCalledWith('s1', 'rejected');
  });

  it('zeigt warning-Toast bei Erfolg', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleReject('b1'); });
    expect(mockAddToast).toHaveBeenCalledWith('Buchung abgelehnt.', 'warning');
  });
});

// ── handleNewBooking ─────────────────────────────────────────
describe('handleNewBooking', () => {
  const baseData = {
    userId: 'u1', resourceId: 'r1', dates: ['2025-03-05'],
    startTime: '10:00', endTime: '12:00', title: 'Test',
    description: '', bookingType: 'training', teamId: 'team1',
    isComposite: false,
  };

  it('zeigt error-Toast wenn keine userId', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleNewBooking({ ...baseData, userId: null }); });
    expect(mockAddToast).toHaveBeenCalledWith(expect.any(String), 'error');
    expect(mockCreateBookings).not.toHaveBeenCalled();
  });

  it('erstellt Einzelbuchung für ein Datum', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleNewBooking(baseData); });
    expect(mockCreateBookings).toHaveBeenCalledTimes(1);
    const [bookingsArg] = mockCreateBookings.mock.calls[0];
    expect(bookingsArg).toHaveLength(1);
    expect(bookingsArg[0].date).toBe('2025-03-05');
  });

  it('erstellt Buchungen für mehrere Daten (Serienlogik)', async () => {
    const { result } = renderHook(() => useBookingActions());
    const data = { ...baseData, dates: ['2025-03-05', '2025-03-12', '2025-03-19'] };
    await act(async () => { await result.current.handleNewBooking(data); });
    const [bookingsArg] = mockCreateBookings.mock.calls[0];
    expect(bookingsArg).toHaveLength(3);
    // Alle Buchungen sollen dieselbe seriesId haben
    const seriesIds = [...new Set(bookingsArg.map(b => b.seriesId))];
    expect(seriesIds).toHaveLength(1);
    expect(seriesIds[0]).not.toBeNull();
  });

  it('setzt Status auf pending für Trainer ohne Genehmigung', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleNewBooking(baseData); });
    const [bookingsArg] = mockCreateBookings.mock.calls[0];
    expect(bookingsArg[0].status).toBe('pending');
  });

  it('setzt Status auf approved für Genehmiger', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleNewBooking({ ...baseData, userId: 'u2' }); });
    const [bookingsArg] = mockCreateBookings.mock.calls[0];
    expect(bookingsArg[0].status).toBe('approved');
  });

  it('zeigt error-Toast bei DB-Fehler', async () => {
    mockCreateBookings.mockResolvedValue({ error: 'Constraint verletzt' });
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleNewBooking(baseData); });
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('Constraint verletzt'), 'error');
  });
});

// ── handleDeleteBooking ──────────────────────────────────────
describe('handleDeleteBooking', () => {
  it('löscht einzelne Buchung', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleDeleteBooking('b1', 'single', null); });
    expect(mockDeleteBooking).toHaveBeenCalledWith('b1');
    expect(mockDeleteBookingSeries).not.toHaveBeenCalled();
  });

  it('löscht komplette Serie', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleDeleteBooking('b2', 'series', 's1'); });
    expect(mockDeleteBookingSeries).toHaveBeenCalledWith('s1');
    expect(mockDeleteBooking).not.toHaveBeenCalled();
  });

  it('zeigt success-Toast nach Löschen', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleDeleteBooking('b1', 'single', null); });
    expect(mockAddToast).toHaveBeenCalledWith('Termin gelöscht.', 'success');
  });

  it('zeigt korrekten Text beim Löschen einer Serie', async () => {
    const { result } = renderHook(() => useBookingActions());
    await act(async () => { await result.current.handleDeleteBooking('b2', 'series', 's1'); });
    expect(mockAddToast).toHaveBeenCalledWith('Terminserie gelöscht.', 'success');
  });
});
