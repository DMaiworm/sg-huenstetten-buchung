import React, { useState, useMemo } from 'react';
import { DEFAULT_CLUB, DEFAULT_FACILITIES, DEFAULT_RESOURCE_GROUPS, DEFAULT_RESOURCES, buildLegacyResources } from './config/facilityConfig';
import { DEFAULT_CLUBS, DEFAULT_DEPARTMENTS, DEFAULT_TEAMS, DEFAULT_TRAINER_ASSIGNMENTS } from './config/organizationConfig';
import { EmailService, EMAIL_TEMPLATES } from './services/emailService';
import { useUsers, useOperators, useFacilities, useOrganization, useBookings } from './hooks/useSupabase';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import CalendarView from './components/CalendarView';
import BookingRequest from './components/BookingRequest';
import MyBookings from './components/MyBookings';
import Approvals from './components/admin/Approvals';
import UserManagement from './components/admin/UserManagement';
import EmailLog from './components/admin/EmailLog';
import PDFExportPage from './components/PDFExportPage';
import FacilityManagement from './components/admin/FacilityManagement';
import OrganizationManagement from './components/admin/OrganizationManagement';
import LoginPage from './components/LoginPage';

import { registerLocale } from 'react-datepicker';
import de from 'date-fns/locale/de';
registerLocale('de', de);

/** Demo slot data – used as fallback when Supabase is unavailable. */
const DEMO_SLOTS = [
  { id: 1, resourceId: 'halle-gross', dayOfWeek: 1, startTime: '17:00', endTime: '21:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 2, resourceId: 'halle-gross', dayOfWeek: 3, startTime: '18:00', endTime: '22:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 3, resourceId: 'halle-gross', dayOfWeek: 6, startTime: '09:00', endTime: '14:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 4, resourceId: 'halle-klein', dayOfWeek: 2, startTime: '16:00', endTime: '20:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 5, resourceId: 'halle-klein', dayOfWeek: 4, startTime: '17:00', endTime: '21:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
];

export default function SportvereinBuchung() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState('calendar');
  const [selectedResource, setSelectedResource] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [emailService] = useState(() => new EmailService());

  // Supabase: Users & Operators
  const { users, setUsers, createUser, updateUser, deleteUser, isDemo: isUserDemo, loading: usersLoading } = useUsers();
  const { operators } = useOperators();

  // Supabase: Facilities, ResourceGroups, Resources, Slots
  const {
    facilities: dbFacilities, setFacilities: setDbFacilities,
    resourceGroups: dbResourceGroups, setResourceGroups: setDbResourceGroups,
    resources: dbResources, setResources: setDbResources,
    slots: dbSlots, setSlots: setDbSlots,
    loading: facilitiesLoading, isDemo: isFacilityDemo,
  } = useFacilities();

  // Supabase: Organization
  const {
    clubs: dbClubs, setClubs: setDbClubs,
    departments: dbDepartments, setDepartments: setDbDepartments,
    teams: dbTeams, setTeams: setDbTeams,
    trainerAssignments: dbTrainerAssignments, setTrainerAssignments: setDbTrainerAssignments,
    loading: orgLoading, isDemo: isOrgDemo,
  } = useOrganization();

  // Supabase: Bookings
  const {
    bookings, setBookings, createBookings, updateBookingStatus, updateSeriesStatus,
    deleteBooking, deleteBookingSeries,
    loading: bookingsLoading,
  } = useBookings();

  // Facility Fallbacks
  const facilities = isFacilityDemo ? DEFAULT_FACILITIES : dbFacilities;
  const resourceGroups = isFacilityDemo ? DEFAULT_RESOURCE_GROUPS : dbResourceGroups;
  const configResources = isFacilityDemo ? DEFAULT_RESOURCES : dbResources;
  const slots = isFacilityDemo ? DEMO_SLOTS : dbSlots;
  const setFacilities = isFacilityDemo ? () => {} : setDbFacilities;
  const setResourceGroups = isFacilityDemo ? () => {} : setDbResourceGroups;
  const setConfigResources = isFacilityDemo ? () => {} : setDbResources;
  const setSlots = isFacilityDemo ? () => {} : setDbSlots;

  // Organization Fallbacks
  const orgClubs = isOrgDemo ? DEFAULT_CLUBS : dbClubs;
  const departments = isOrgDemo ? DEFAULT_DEPARTMENTS : dbDepartments;
  const teams = isOrgDemo ? DEFAULT_TEAMS : dbTeams;
  const trainerAssignments = isOrgDemo ? DEFAULT_TRAINER_ASSIGNMENTS : dbTrainerAssignments;
  const setOrgClubs = isOrgDemo ? () => {} : setDbClubs;
  const setDepartments = isOrgDemo ? () => {} : setDbDepartments;
  const setTeams = isOrgDemo ? () => {} : setDbTeams;
  const setTrainerAssignments = isOrgDemo ? () => {} : setDbTrainerAssignments;

  const [club] = useState(DEFAULT_CLUB);

  const RESOURCES = useMemo(() => buildLegacyResources(resourceGroups, configResources), [resourceGroups, configResources]);
  const effectiveSelectedResource = selectedResource || (RESOURCES.length > 0 ? RESOURCES.find(r => !r.isComposite)?.id || RESOURCES[0]?.id : null);

  // Auth-Check: Login anzeigen wenn nicht eingeloggt
  if (authLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  /**
   * Approve a booking and all related bookings (same seriesId).
   * For composite bookings (ganzes Feld), this cascades to the
   * auto-generated parentBooking entries for sub-resources.
   */
  const handleApprove = async (id) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    let result;
    if (booking.seriesId) {
      result = await updateSeriesStatus(booking.seriesId, 'approved');
    } else {
      result = await updateBookingStatus(id, 'approved');
    }

    if (result.error) {
      window.alert('Fehler beim Genehmigen: ' + result.error);
      return;
    }

    const user = users.find(u => u.id === booking.userId);
    const resource = RESOURCES.find(r => r.id === booking.resourceId);
    const approver = users.find(u => u.role === 'admin');
    if (user && resource && approver) {
      await emailService.send(EMAIL_TEMPLATES.bookingApproved(booking, user, resource, approver));
    }
  };

  /**
   * Reject a booking and all related bookings (same seriesId).
   */
  const handleReject = async (id, reason = '') => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    let result;
    if (booking.seriesId) {
      result = await updateSeriesStatus(booking.seriesId, 'rejected');
    } else {
      result = await updateBookingStatus(id, 'rejected');
    }

    if (result.error) {
      window.alert('Fehler beim Ablehnen: ' + result.error);
      return;
    }

    const user = users.find(u => u.id === booking.userId);
    const resource = RESOURCES.find(r => r.id === booking.resourceId);
    const approver = users.find(u => u.role === 'admin');
    if (user && resource && approver) {
      await emailService.send(EMAIL_TEMPLATES.bookingRejected(booking, user, resource, approver, reason));
    }
  };

  const handleNewBooking = async (data) => {
    if (!data.userId) {
      window.alert('Fehler: Kein Benutzer/Trainer zugeordnet. Bitte Mannschaft mit Trainer auswählen.');
      return;
    }

    const needsSeriesId = data.dates.length > 1 || (data.isComposite && data.includedResources);
    const seriesId = needsSeriesId ? `series-${Date.now()}` : null;
    const bookingUser = users.find(u => u.id === data.userId);
    const bookingStatus = bookingUser?.role === 'extern' ? 'pending' : 'approved';

    const newBookings = data.dates.map((date) => ({
      resourceId: data.resourceId, date,
      startTime: data.startTime, endTime: data.endTime,
      title: data.title, description: data.description,
      bookingType: data.bookingType, userId: data.userId,
      status: bookingStatus, seriesId,
    }));

    if (data.isComposite && data.includedResources) {
      data.includedResources.forEach(resId => {
        data.dates.forEach((date) => {
          newBookings.push({
            resourceId: resId, date,
            startTime: data.startTime, endTime: data.endTime,
            title: data.title + ' (Ganzes Feld)', bookingType: data.bookingType,
            userId: data.userId, status: bookingStatus, seriesId,
            parentBooking: true,
          });
        });
      });
    }

    console.log('handleNewBooking: Sende', newBookings.length, 'Buchungen an DB', JSON.stringify(newBookings[0]));
    const result = await createBookings(newBookings);

    if (result.error) {
      window.alert('Fehler beim Speichern der Buchung: ' + result.error);
      console.error('createBookings error:', result.error);
      return;
    }

    console.log('handleNewBooking: Erfolgreich,', result.data?.length, 'Buchungen erstellt');

    const resource = RESOURCES.find(r => r.id === data.resourceId);
    if (bookingUser && resource && result.data && result.data.length > 0) {
      await emailService.send(EMAIL_TEMPLATES.bookingCreated(result.data[0], bookingUser, resource));
      if (bookingUser.role === 'extern') {
        const admins = users.filter(u => u.role === 'admin');
        for (const admin of admins) {
          await emailService.send(EMAIL_TEMPLATES.adminNewBooking(result.data[0], bookingUser, resource, admin.email));
        }
      }
    }
  };

  const handleDeleteBooking = async (bookingId, deleteType, seriesId) => {
    if (deleteType === 'series' && seriesId) {
      const result = await deleteBookingSeries(seriesId);
      if (result.error) window.alert('Fehler beim Löschen der Serie: ' + result.error);
    } else {
      const result = await deleteBooking(bookingId);
      if (result.error) window.alert('Fehler beim Löschen: ' + result.error);
    }
  };

  const orgProps = { clubs: orgClubs, departments, teams, trainerAssignments };
  const facilityProps = { facilities, resourceGroups };

  if (usersLoading || facilitiesLoading || orgLoading || bookingsLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView}
        isAdmin={isAdmin} onExportPDF={() => setCurrentView('export')}
        emailService={emailService} facilityName={club.name} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {currentView === 'calendar' && (
            <CalendarView bookings={bookings} slots={slots} selectedResource={effectiveSelectedResource}
              setSelectedResource={setSelectedResource} currentDate={currentDate} setCurrentDate={setCurrentDate}
              users={users} resources={RESOURCES} {...facilityProps} />
          )}
          {currentView === 'bookings' && <MyBookings bookings={bookings} isAdmin={isAdmin} onDelete={handleDeleteBooking} users={users} resources={RESOURCES} resourceGroups={resourceGroups} {...orgProps} />}
          {currentView === 'request' && <BookingRequest slots={slots} bookings={bookings} onSubmit={handleNewBooking} users={users} resources={RESOURCES} {...facilityProps} {...orgProps} />}
          {currentView === 'approvals' && <Approvals bookings={bookings} onApprove={handleApprove} onReject={handleReject} users={users} resources={RESOURCES} />}
          {currentView === 'users' && <UserManagement users={users} setUsers={setUsers} createUser={createUser} updateUser={updateUser} deleteUser={deleteUser} isDemo={isUserDemo} operators={operators} />}
          {currentView === 'emails' && <EmailLog emailService={emailService} />}
          {currentView === 'export' && <PDFExportPage bookings={bookings} users={users} onBack={() => setCurrentView('calendar')} resources={RESOURCES} />}
          {currentView === 'facility' && <FacilityManagement facilities={facilities} setFacilities={setFacilities} resourceGroups={resourceGroups} setResourceGroups={setResourceGroups} resources={configResources} setResources={setConfigResources} slots={slots} setSlots={setSlots} />}
          {currentView === 'organization' && <OrganizationManagement clubs={orgClubs} setClubs={setOrgClubs} departments={departments} setDepartments={setDbDepartments} teams={teams} setTeams={setTeams} trainerAssignments={trainerAssignments} setTrainerAssignments={setTrainerAssignments} users={users} />}
        </div>
      </main>
    </div>
  );
}
