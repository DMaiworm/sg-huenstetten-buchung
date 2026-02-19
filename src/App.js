import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EmailService } from './services/emailService';
import { useAuth } from './contexts/AuthContext';
import { FacilityProvider, useFacility } from './contexts/FacilityContext';
import { OrganizationProvider, useOrg } from './contexts/OrganizationContext';
import { BookingProvider, useBookingContext } from './contexts/BookingContext';
import { UserProvider, useUserContext } from './contexts/UserContext';

import ProtectedRoute from './routes/ProtectedRoute';
import PermissionRoute from './routes/PermissionRoute';
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

/**
 * AppLayout – Hauptlayout mit Sidebar + Routing.
 * Bezieht Daten aus Contexts statt Props.
 */
function AppLayout() {
  const { profile, kannBuchen, kannGenehmigen, kannAdministrieren, isAdmin } = useAuth();
  const { facilities, resourceGroups, configResources, slots, setFacilities, setResourceGroups, setConfigResources, setSlots, RESOURCES, loading: facilitiesLoading } = useFacility();
  const org = useOrg();
  const { bookings, createBookings, updateBookingStatus, updateSeriesStatus, deleteBooking, deleteBookingSeries, loading: bookingsLoading } = useBookingContext();
  const { users, setUsers, createUser, updateUser, deleteUser, inviteUser, operators, genehmigerAssignments, getResourcesForUser, addGenehmigerResource, removeGenehmigerResource, loading: usersLoading } = useUserContext();

  const [selectedResource, setSelectedResource] = useState(null);
  const [currentDate, setCurrentDate]           = useState(new Date());
  const [emailService]                          = useState(() => new EmailService());

  const effectiveSelectedResource = selectedResource || (RESOURCES.find(r => !r.isComposite)?.id || RESOURCES[0]?.id || null);

  const myGenehmigerResources = kannAdministrieren ? null : (kannGenehmigen ? getResourcesForUser(profile?.id) : null);
  const pendingCount = bookings.filter(b => {
    if (b.status !== 'pending' || b.parentBooking) return false;
    if (kannAdministrieren) return true;
    if (kannGenehmigen) return myGenehmigerResources?.includes(b.resourceId);
    return false;
  }).length;

  // Daten-Ladebildschirm
  if (usersLoading || facilitiesLoading || bookingsLoading || org.loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  // --- Handler (Phase 4 extrahiert diese in Custom Hooks) ---

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
    if (!data.userId) { window.alert('Kein Trainer f\u00fcr die ausgew\u00e4hlte Mannschaft gefunden.'); return; }
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
    window.alert('Buchungsanfrage f\u00fcr ' + data.dates.length + ' Termin(e) eingereicht!');
  };

  const handleDeleteBooking = async (bookingId, deleteType, seriesId) => {
    const result = deleteType === 'series' && seriesId ? await deleteBookingSeries(seriesId) : await deleteBooking(bookingId);
    if (result.error) window.alert('Fehler: ' + result.error);
  };

  // Shorthand-Props f\u00fcr Komponenten die noch nicht auf Contexts umgestellt sind
  const orgProps      = { clubs: org.clubs, departments: org.departments, teams: org.teams, trainerAssignments: org.trainerAssignments };
  const facilityProps = { facilities, resourceGroups };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        kannBuchen={kannBuchen} kannGenehmigen={kannGenehmigen}
        kannAdministrieren={kannAdministrieren} pendingCount={pendingCount}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Routes>
            {/* Allgemein */}
            <Route path="/" element={
              <CalendarView bookings={bookings} slots={slots}
                selectedResource={effectiveSelectedResource} setSelectedResource={setSelectedResource}
                currentDate={currentDate} setCurrentDate={setCurrentDate}
                users={users} resources={RESOURCES} {...facilityProps} />
            } />
            <Route path="/meine-buchungen" element={
              <MyBookings bookings={bookings} isAdmin={isAdmin} onDelete={handleDeleteBooking}
                users={users} resources={RESOURCES} resourceGroups={resourceGroups} {...orgProps} />
            } />
            <Route path="/export" element={
              <PDFExportPage bookings={bookings} users={users} onBack={() => {}} resources={RESOURCES} />
            } />

            {/* Buchen */}
            <Route path="/buchen" element={
              <PermissionRoute permission="kannBuchen">
                <BookingRequest slots={slots} bookings={bookings} onSubmit={handleNewBooking}
                  users={users} resources={RESOURCES} {...facilityProps} {...orgProps} />
              </PermissionRoute>
            } />

            {/* Genehmigungen */}
            <Route path="/genehmigungen" element={
              <PermissionRoute permission="kannGenehmigen">
                <Approvals bookings={bookings} onApprove={handleApprove} onReject={handleReject}
                  users={users} resources={RESOURCES}
                  genehmigerResources={myGenehmigerResources} isAdmin={kannAdministrieren} />
              </PermissionRoute>
            } />

            {/* Admin */}
            <Route path="/admin/benutzer" element={
              <PermissionRoute permission="kannAdministrieren">
                <UserManagement
                  users={users} setUsers={setUsers}
                  createUser={createUser} updateUser={updateUser} deleteUser={deleteUser} inviteUser={inviteUser}
                  operators={operators}
                  resources={RESOURCES} resourceGroups={resourceGroups} facilities={facilities}
                  genehmigerAssignments={genehmigerAssignments}
                  addGenehmigerResource={addGenehmigerResource}
                  removeGenehmigerResource={removeGenehmigerResource}
                />
              </PermissionRoute>
            } />
            <Route path="/admin/anlagen" element={
              <PermissionRoute permission="kannAdministrieren">
                <FacilityManagement facilities={facilities} setFacilities={setFacilities}
                  resourceGroups={resourceGroups} setResourceGroups={setResourceGroups}
                  resources={configResources} setResources={setConfigResources}
                  slots={slots} setSlots={setSlots} />
              </PermissionRoute>
            } />
            <Route path="/admin/organisation" element={
              <PermissionRoute permission="kannAdministrieren">
                <OrganizationManagement
                  clubs={org.clubs} departments={org.departments} teams={org.teams}
                  trainerAssignments={org.trainerAssignments} users={users}
                  createClub={org.createClub} updateClub={org.updateClub} deleteClub={org.deleteClub}
                  createDepartment={org.createDepartment} updateDepartment={org.updateDepartment} deleteDepartment={org.deleteDepartment}
                  createTeam={org.createTeam} updateTeam={org.updateTeam} deleteTeam={org.deleteTeam}
                  createTrainerAssignment={org.createTrainerAssignment}
                  updateTrainerAssignment={org.updateTrainerAssignment}
                  deleteTrainerAssignment={org.deleteTrainerAssignment}
                  setClubs={org.setClubs} setDepartments={org.setDepartments}
                  setTeams={org.setTeams} setTrainerAssignments={org.setTrainerAssignments}
                />
              </PermissionRoute>
            } />
            <Route path="/admin/emails" element={
              <PermissionRoute permission="kannAdministrieren">
                <EmailLog emailService={emailService} />
              </PermissionRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

/**
 * App – Wurzelkomponente.
 *
 * Provider-Hierarchie:
 *   BrowserRouter (in index.js)
 *     → AuthProvider (in index.js)
 *       → FacilityProvider
 *         → OrganizationProvider
 *           → BookingProvider
 *             → UserProvider
 *               → Routes
 */
export default function App() {
  return (
    <FacilityProvider>
      <OrganizationProvider>
        <BookingProvider>
          <UserProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              } />
            </Routes>
          </UserProvider>
        </BookingProvider>
      </OrganizationProvider>
    </FacilityProvider>
  );
}
