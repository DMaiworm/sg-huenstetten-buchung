import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EmailService } from './services/emailService';
import { useAuth } from './contexts/AuthContext';
import { FacilityProvider, useFacility } from './contexts/FacilityContext';
import { OrganizationProvider, useOrg } from './contexts/OrganizationContext';
import { BookingProvider, useBookingContext } from './contexts/BookingContext';
import { UserProvider, useUserContext } from './contexts/UserContext';
import { HolidayProvider, useHolidayContext } from './contexts/HolidayContext';
import { useBookingActions } from './hooks/useBookingActions';

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
import HolidayManagement from './components/admin/HolidayManagement';
import BookingEditModal from './components/BookingEditModal';
import TeamOverview from './components/TeamOverview';
import LoginPage from './components/LoginPage';

import { registerLocale } from 'react-datepicker';
import de from 'date-fns/locale/de';
registerLocale('de', de);

/**
 * AppLayout – Hauptlayout mit Sidebar + Routing.
 * Bezieht Daten aus Contexts, Handler aus Custom Hooks.
 */
function AppLayout() {
  const { profile, kannBuchen, kannGenehmigen, kannAdministrieren, isAdmin } = useAuth();
  const facility = useFacility();
  const { facilities, resourceGroups, configResources, slots, RESOURCES, loading: facilitiesLoading } = facility;
  const org = useOrg();
  const { bookings, loading: bookingsLoading } = useBookingContext();
  const { users, setUsers, createUser, updateUser, deleteUser, inviteUser, operators, genehmigerAssignments, getResourcesForUser, addGenehmigerResource, removeGenehmigerResource, loading: usersLoading } = useUserContext();
  const { handleNewBooking, handleEditBooking, handleApprove, handleReject, handleDeleteBooking } = useBookingActions();
  const holiday = useHolidayContext();

  const [selectedResource, setSelectedResource] = useState(null);
  const [currentDate, setCurrentDate]           = useState(new Date());
  const [emailService]                          = useState(() => new EmailService());
  const [editingBooking, setEditingBooking]     = useState(null);

  const effectiveSelectedResource = selectedResource || (RESOURCES.find(r => !r.isComposite)?.id || RESOURCES[0]?.id || null);

  const myGenehmigerResources = kannAdministrieren ? null : (kannGenehmigen ? getResourcesForUser(profile?.id) : null);
  const pendingCount = bookings.filter(b => {
    if (b.status !== 'pending' || b.parentBooking) return false;
    if (kannAdministrieren) return true;
    if (kannGenehmigen) return myGenehmigerResources?.includes(b.resourceId);
    return false;
  }).length;

  // Daten-Ladebildschirm
  if (usersLoading || facilitiesLoading || bookingsLoading || org.loading || holiday.loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  // Shorthand-Props für Komponenten die noch nicht auf Contexts umgestellt sind
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
                users={users} resources={RESOURCES} {...facilityProps}
                onBookingClick={setEditingBooking} />
            } />
            <Route path="/meine-buchungen" element={
              <MyBookings bookings={bookings} isAdmin={isAdmin} onDelete={handleDeleteBooking}
                onEdit={setEditingBooking}
                users={users} resources={RESOURCES} resourceGroups={resourceGroups} {...orgProps} />
            } />
            <Route path="/export" element={
              <PDFExportPage bookings={bookings} users={users} resources={RESOURCES} resourceGroups={resourceGroups} {...orgProps} />
            } />
            <Route path="/teams" element={
              <TeamOverview {...orgProps} bookings={bookings} users={users} resources={RESOURCES} />
            } />

            {/* Buchen */}
            <Route path="/buchen" element={
              <PermissionRoute permission="kannBuchen">
                <BookingRequest slots={slots} bookings={bookings} onSubmit={handleNewBooking}
                  users={users} resources={RESOURCES} holidays={holiday.holidays} {...facilityProps} {...orgProps} />
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
                  trainerAssignments={org.trainerAssignments}
                  teams={org.teams} departments={org.departments} clubs={org.clubs}
                />
              </PermissionRoute>
            } />
            <Route path="/admin/anlagen" element={
              <PermissionRoute permission="kannAdministrieren">
                <FacilityManagement facilities={facilities} resourceGroups={resourceGroups}
                  resources={configResources} slots={slots}
                  createFacility={facility.createFacility} updateFacility={facility.updateFacility} deleteFacility={facility.deleteFacility}
                  createResourceGroup={facility.createResourceGroup} updateResourceGroup={facility.updateResourceGroup} deleteResourceGroup={facility.deleteResourceGroup}
                  createResource={facility.createResource} updateResource={facility.updateResource} deleteResource={facility.deleteResource}
                  createSlot={facility.createSlot} updateSlot={facility.updateSlot} deleteSlot={facility.deleteSlot} />
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
            <Route path="/admin/ferien-feiertage" element={
              <PermissionRoute permission="kannAdministrieren">
                <HolidayManagement
                  holidays={holiday.holidays}
                  createHoliday={holiday.createHoliday}
                  createHolidaysBulk={holiday.createHolidaysBulk}
                  updateHoliday={holiday.updateHoliday}
                  deleteHoliday={holiday.deleteHoliday}
                  deleteHolidaysByYear={holiday.deleteHolidaysByYear}
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

      {/* Booking Edit Modal (global, accessible from Calendar + MyBookings) */}
      <BookingEditModal
        booking={editingBooking}
        open={!!editingBooking}
        onClose={() => setEditingBooking(null)}
        onSave={handleEditBooking}
        resources={RESOURCES}
        users={users}
      />
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
 *               → HolidayProvider
 *                 → Routes
 */
export default function App() {
  return (
    <FacilityProvider>
      <OrganizationProvider>
        <BookingProvider>
          <UserProvider>
            <HolidayProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                } />
              </Routes>
            </HolidayProvider>
          </UserProvider>
        </BookingProvider>
      </OrganizationProvider>
    </FacilityProvider>
  );
}
