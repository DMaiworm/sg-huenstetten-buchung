import React, { useState, useMemo } from 'react';
import { DEFAULT_CLUB, DEFAULT_FACILITIES, DEFAULT_RESOURCE_GROUPS, DEFAULT_RESOURCES, buildLegacyResources } from './config/facilityConfig';
import { DEFAULT_CLUBS, DEFAULT_DEPARTMENTS, DEFAULT_TEAMS, DEFAULT_TRAINER_ASSIGNMENTS } from './config/organizationConfig';
import { EmailService } from './services/emailService';
import { useUsers, useOperators, useFacilities, useOrganization, useBookings, useGenehmigerResources } from './hooks/useSupabase';
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

const DEMO_SLOTS = [
  { id: 1, resourceId: 'halle-gross', dayOfWeek: 1, startTime: '17:00', endTime: '21:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 2, resourceId: 'halle-gross', dayOfWeek: 3, startTime: '18:00', endTime: '22:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 3, resourceId: 'halle-gross', dayOfWeek: 6, startTime: '09:00', endTime: '14:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 4, resourceId: 'halle-klein', dayOfWeek: 2, startTime: '16:00', endTime: '20:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 5, resourceId: 'halle-klein', dayOfWeek: 4, startTime: '17:00', endTime: '21:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
];

export default function SportvereinBuchung() {
  const { user, profile, kannBuchen, kannGenehmigen, kannAdministrieren, isAdmin, loading: authLoading } = useAuth();
  const [currentView, setCurrentView]           = useState('calendar');
  const [selectedResource, setSelectedResource] = useState(null);
  const [currentDate, setCurrentDate]           = useState(new Date());
  const [emailService]                          = useState(() => new EmailService());

  const { users, setUsers, createUser, updateUser, deleteUser, inviteUser, loading: usersLoading } = useUsers();
  const { operators } = useOperators();
  const {
    facilities: dbFacilities, setFacilities: setDbFacilities,
    resourceGroups: dbResourceGroups, setResourceGroups: setDbResourceGroups,
    resources: dbResources, setResources: setDbResources,
    slots: dbSlots, setSlots: setDbSlots,
    loading: facilitiesLoading, isDemo: isFacilityDemo,
  } = useFacilities();
  const {
    clubs: dbClubs, departments: dbDepartments, teams: dbTeams, trainerAssignments: dbTrainerAssignments,
    setClubs: setDbClubs, setDepartments: setDbDepartments, setTeams: setDbTeams, setTrainerAssignments: setDbTrainerAssignments,
    createClub, updateClub, deleteClub,
    createDepartment, updateDepartment, deleteDepartment,
    createTeam, updateTeam, deleteTeam,
    createTrainerAssignment, updateTrainerAssignment, deleteTrainerAssignment,
    loading: orgLoading, isDemo: isOrgDemo,
  } = useOrganization();
  const {
    bookings, createBookings, updateBookingStatus, updateSeriesStatus,
    deleteBooking, deleteBookingSeries, loading: bookingsLoading,
  } = useBookings();
  const {
    assignments: genehmigerAssignments,
    getResourcesForUser,
    addAssignment: addGenehmigerResource,
    removeAssignment: removeGenehmigerResource,
  } = useGenehmigerResources();

  const facilities      = isFacilityDemo ? DEFAULT_FACILITIES      : dbFacilities;
  const resourceGroups  = isFacilityDemo ? DEFAULT_RESOURCE_GROUPS  : dbResourceGroups;
  const configResources = isFacilityDemo ? DEFAULT_RESOURCES        : dbResources;
  const slots           = isFacilityDemo ? DEMO_SLOTS               : dbSlots;
  const setFacilities      = isFacilityDemo ? () => {} : setDbFacilities;
  const setResourceGroups  = isFacilityDemo ? () => {} : setDbResourceGroups;
  const setConfigResources = isFacilityDemo ? () => {} : setDbResources;
  const setSlots           = isFacilityDemo ? () => {} : setDbSlots;

  const orgClubs           = isOrgDemo ? DEFAULT_CLUBS               : dbClubs;
  const departments        = isOrgDemo ? DEFAULT_DEPARTMENTS         : dbDepartments;
  const teams              = isOrgDemo ? DEFAULT_TEAMS               : dbTeams;
  const trainerAssignments = isOrgDemo ? DEFAULT_TRAINER_ASSIGNMENTS  : dbTrainerAssignments;

  const RESOURCES = useMemo(() => buildLegacyResources(resourceGroups, configResources), [resourceGroups, configResources]);
  const effectiveSelectedResource = selectedResource || (RESOURCES.find(r => !r.isComposite)?.id || RESOURCES[0]?.id || null);

  const myGenehmigerResources = kannAdministrieren ? null : (kannGenehmigen ? getResourcesForUser(profile?.id) : null);
  const pendingCount = bookings.filter(b => {
    if (b.status !== 'pending' || b.parentBooking) return false;
    if (kannAdministrieren) return true;
    if (kannGenehmigen) return myGenehmigerResources?.includes(b.resourceId);
    return false;
  }).length;

  if (authLoading) return (
    <div className="flex h-screen bg-gray-50 items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-gray-500">Wird geladen...</p>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  if (usersLoading || facilitiesLoading || orgLoading || bookingsLoading) return (
    <div className="flex h-screen bg-gray-50 items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-gray-500">Daten werden geladen...</p>
      </div>
    </div>
  );

  const resolveBookingStatus = (userId) => {
    const u = users.find(x => x.id === userId);
    return (u?.kannGenehmigen || u?.kannAdministrieren) ? 'approved' : 'pending';
  };

  const handleApprove = async (id) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    const result = booking.seriesId ? await updateSeriesStatus(booking.seriesId, 'approved') : await updateBookingStatus(id, 'approved');
    if (result.error) window.alert('Fehler: ' + result.error);
  };

  const handleReject = async (id) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    const result = booking.seriesId ? await updateSeriesStatus(booking.seriesId, 'rejected') : await updateBookingStatus(id, 'rejected');
    if (result.error) window.alert('Fehler: ' + result.error);
  };

  const handleNewBooking = async (data) => {
    if (!data.userId) { window.alert('Kein Trainer für die ausgewählte Mannschaft gefunden.'); return; }
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
            resourceId: resId, date, startTime: data.startTime, endTime: data.endTime,
            title: data.title + ' (Ganzes Feld)', bookingType: data.bookingType,
            userId: data.userId, status: bookingStatus, seriesId, parentBooking: true,
          });
        });
      });
    }
    const result = await createBookings(newBookings);
    if (result.error) { window.alert('Fehler: ' + result.error); return; }
    window.alert('Buchungsanfrage für ' + data.dates.length + ' Termin(e) eingereicht!');
  };

  const handleDeleteBooking = async (bookingId, deleteType, seriesId) => {
    const result = deleteType === 'series' && seriesId ? await deleteBookingSeries(seriesId) : await deleteBooking(bookingId);
    if (result.error) window.alert('Fehler: ' + result.error);
  };

  const orgProps      = { clubs: orgClubs, departments, teams, trainerAssignments };
  const facilityProps = { facilities, resourceGroups };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView}
        isAdmin={isAdmin} kannBuchen={kannBuchen} kannGenehmigen={kannGenehmigen}
        kannAdministrieren={kannAdministrieren} pendingCount={pendingCount} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {currentView === 'calendar' && (
            <CalendarView bookings={bookings} slots={slots}
              selectedResource={effectiveSelectedResource} setSelectedResource={setSelectedResource}
              currentDate={currentDate} setCurrentDate={setCurrentDate}
              users={users} resources={RESOURCES} {...facilityProps} />
          )}
          {currentView === 'my-bookings' && (
            <MyBookings bookings={bookings} isAdmin={isAdmin} onDelete={handleDeleteBooking}
              users={users} resources={RESOURCES} resourceGroups={resourceGroups} {...orgProps} />
          )}
          {currentView === 'booking-request' && kannBuchen && (
            <BookingRequest slots={slots} bookings={bookings} onSubmit={handleNewBooking}
              users={users} resources={RESOURCES} {...facilityProps} {...orgProps} />
          )}
          {currentView === 'approvals' && kannGenehmigen && (
            <Approvals bookings={bookings} onApprove={handleApprove} onReject={handleReject}
              users={users} resources={RESOURCES}
              genehmigerResources={myGenehmigerResources} isAdmin={kannAdministrieren} />
          )}
          {currentView === 'users' && kannAdministrieren && (
            <UserManagement
              users={users} setUsers={setUsers}
              createUser={createUser} updateUser={updateUser} deleteUser={deleteUser} inviteUser={inviteUser}
              operators={operators}
              resources={RESOURCES} resourceGroups={resourceGroups} facilities={facilities}
              genehmigerAssignments={genehmigerAssignments}
              addGenehmigerResource={addGenehmigerResource}
              removeGenehmigerResource={removeGenehmigerResource}
            />
          )}
          {currentView === 'emails' && kannAdministrieren && <EmailLog emailService={emailService} />}
          {currentView === 'export' && (
            <PDFExportPage bookings={bookings} users={users} onBack={() => setCurrentView('calendar')} resources={RESOURCES} />
          )}
          {currentView === 'facilities' && kannAdministrieren && (
            <FacilityManagement facilities={facilities} setFacilities={setFacilities}
              resourceGroups={resourceGroups} setResourceGroups={setResourceGroups}
              resources={configResources} setResources={setConfigResources}
              slots={slots} setSlots={setSlots} />
          )}
          {currentView === 'organization' && kannAdministrieren && (
            <OrganizationManagement
              clubs={orgClubs} departments={departments} teams={teams} trainerAssignments={trainerAssignments}
              users={users}
              createClub={isOrgDemo ? undefined : createClub} updateClub={isOrgDemo ? undefined : updateClub} deleteClub={isOrgDemo ? undefined : deleteClub}
              createDepartment={isOrgDemo ? undefined : createDepartment} updateDepartment={isOrgDemo ? undefined : updateDepartment} deleteDepartment={isOrgDemo ? undefined : deleteDepartment}
              createTeam={isOrgDemo ? undefined : createTeam} updateTeam={isOrgDemo ? undefined : updateTeam} deleteTeam={isOrgDemo ? undefined : deleteTeam}
              createTrainerAssignment={isOrgDemo ? undefined : createTrainerAssignment}
              updateTrainerAssignment={isOrgDemo ? undefined : updateTrainerAssignment}
              deleteTrainerAssignment={isOrgDemo ? undefined : deleteTrainerAssignment}
              setClubs={setDbClubs} setDepartments={setDbDepartments} setTeams={setDbTeams} setTrainerAssignments={setDbTrainerAssignments}
            />
          )}
        </div>
      </main>
    </div>
  );
}
