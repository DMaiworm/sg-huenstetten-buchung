import React, { useState, useMemo } from 'react';
import { DEMO_BOOKINGS, DEMO_SLOTS } from './config/constants';
import { DEFAULT_CLUB, DEFAULT_FACILITIES, DEFAULT_RESOURCE_GROUPS, DEFAULT_RESOURCES, buildLegacyResources } from './config/facilityConfig';
import { DEFAULT_CLUBS, DEFAULT_DEPARTMENTS, DEFAULT_TEAMS, DEFAULT_TRAINER_ASSIGNMENTS } from './config/organizationConfig';
import { EmailService, EMAIL_TEMPLATES } from './services/emailService';
import { useUsers, useOperators } from './hooks/useSupabase';
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

import { registerLocale } from 'react-datepicker';
import de from 'date-fns/locale/de';
registerLocale('de', de);

export default function SportvereinBuchung() {
  const [currentView, setCurrentView] = useState('calendar');
  const [isAdmin, setIsAdmin] = useState(true);
  const [selectedResource, setSelectedResource] = useState('sportplatz-links');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState(DEMO_BOOKINGS);
  const [slots, setSlots] = useState(DEMO_SLOTS);
  const [emailService] = useState(() => new EmailService());

  // Supabase: Users & Operators aus DB laden (mit Fallback auf Demo-Daten)
  const { users, setUsers, createUser, updateUser, deleteUser, isDemo: isUserDemo, loading: usersLoading } = useUsers();
  const { operators } = useOperators();

  // Facility config state
  const [club] = useState(DEFAULT_CLUB);
  const [facilities, setFacilities] = useState(DEFAULT_FACILITIES);
  const [resourceGroups, setResourceGroups] = useState(DEFAULT_RESOURCE_GROUPS);
  const [configResources, setConfigResources] = useState(DEFAULT_RESOURCES);

  // Organization config state
  const [orgClubs, setOrgClubs] = useState(DEFAULT_CLUBS);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [teams, setTeams] = useState(DEFAULT_TEAMS);
  const [trainerAssignments, setTrainerAssignments] = useState(DEFAULT_TRAINER_ASSIGNMENTS);

  // Build legacy RESOURCES from config
  const RESOURCES = useMemo(() => buildLegacyResources(resourceGroups, configResources), [resourceGroups, configResources]);

  const handleApprove = async (id) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'approved' } : b));
    const user = users.find(u => u.id === booking.userId);
    const resource = RESOURCES.find(r => r.id === booking.resourceId);
    const approver = users.find(u => u.role === 'admin');
    if (user && resource && approver) {
      await emailService.send(EMAIL_TEMPLATES.bookingApproved(booking, user, resource, approver));
    }
  };

  const handleReject = async (id, reason = '') => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'rejected' } : b));
    const user = users.find(u => u.id === booking.userId);
    const resource = RESOURCES.find(r => r.id === booking.resourceId);
    const approver = users.find(u => u.role === 'admin');
    if (user && resource && approver) {
      await emailService.send(EMAIL_TEMPLATES.bookingRejected(booking, user, resource, approver, reason));
    }
  };

  const handleNewBooking = async (data) => {
    const seriesId = `series-${Date.now()}`;
    const user = users.find(u => u.id === data.userId);
    const bookingStatus = user?.role === 'extern' ? 'pending' : 'approved';
    const newBookings = data.dates.map((date, i) => ({
      id: Date.now() + i, resourceId: data.resourceId, date,
      startTime: data.startTime, endTime: data.endTime,
      title: data.title, description: data.description,
      bookingType: data.bookingType, userId: data.userId,
      status: bookingStatus, seriesId: data.dates.length > 1 ? seriesId : null,
    }));
    if (data.isComposite && data.includedResources) {
      data.includedResources.forEach(resId => {
        data.dates.forEach((date, i) => {
          newBookings.push({ id: Date.now() + 1000 + i, resourceId: resId, date,
            startTime: data.startTime, endTime: data.endTime,
            title: data.title + ' (Ganzes Feld)', bookingType: data.bookingType,
            userId: data.userId, status: bookingStatus, seriesId, parentBooking: true });
        });
      });
    }
    setBookings([...bookings, ...newBookings]);
    const resource = RESOURCES.find(r => r.id === data.resourceId);
    if (user && resource) {
      await emailService.send(EMAIL_TEMPLATES.bookingCreated(newBookings[0], user, resource));
      if (user.role === 'extern') {
        const admins = users.filter(u => u.role === 'admin');
        for (const admin of admins) { await emailService.send(EMAIL_TEMPLATES.adminNewBooking(newBookings[0], user, resource, admin.email)); }
      }
    }
  };

  const handleDeleteBooking = (bookingId, deleteType, seriesId) => {
    if (deleteType === 'series' && seriesId) { setBookings(bookings.filter(b => b.seriesId !== seriesId)); }
    else { setBookings(bookings.filter(b => b.id !== bookingId)); }
  };

  const adminCheckbox = (
    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
      <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
      Admin-Modus (Demo)
    </label>
  );

  const orgProps = { clubs: orgClubs, departments, teams, trainerAssignments };
  const facilityProps = { facilities, resourceGroups };

  if (usersLoading) {
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
            <CalendarView bookings={bookings} slots={slots} selectedResource={selectedResource}
              setSelectedResource={setSelectedResource} currentDate={currentDate} setCurrentDate={setCurrentDate}
              users={users} adminCheckbox={adminCheckbox} resources={RESOURCES} {...facilityProps} />
          )}
          {currentView === 'bookings' && <><div className="flex justify-end mb-4">{adminCheckbox}</div>
            <MyBookings bookings={bookings} isAdmin={isAdmin} onDelete={handleDeleteBooking} users={users} resources={RESOURCES} {...orgProps} /></>}
          {currentView === 'request' && <><div className="flex justify-end mb-4">{adminCheckbox}</div>
            <BookingRequest slots={slots} bookings={bookings} onSubmit={handleNewBooking} users={users} resources={RESOURCES} {...facilityProps} {...orgProps} /></>}
          {currentView === 'approvals' && <><div className="flex justify-end mb-4">{adminCheckbox}</div>
            <Approvals bookings={bookings} onApprove={handleApprove} onReject={handleReject} users={users} resources={RESOURCES} /></>}
          {currentView === 'users' && <><div className="flex justify-end mb-4">{adminCheckbox}</div>
            <UserManagement users={users} setUsers={setUsers} createUser={createUser} updateUser={updateUser} deleteUser={deleteUser} isDemo={isUserDemo} operators={operators} /></>}
          {currentView === 'emails' && <><div className="flex justify-end mb-4">{adminCheckbox}</div><EmailLog emailService={emailService} /></>}
          {currentView === 'export' && <PDFExportPage bookings={bookings} users={users} onBack={() => setCurrentView('calendar')} resources={RESOURCES} />}
          {currentView === 'facility' && <><div className="flex justify-end mb-4">{adminCheckbox}</div>
            <FacilityManagement facilities={facilities} setFacilities={setFacilities} resourceGroups={resourceGroups} setResourceGroups={setResourceGroups} resources={configResources} setResources={setConfigResources} slots={slots} setSlots={setSlots} /></>}
          {currentView === 'organization' && <><div className="flex justify-end mb-4">{adminCheckbox}</div>
            <OrganizationManagement clubs={orgClubs} setClubs={setOrgClubs} departments={departments} setDepartments={setDepartments} teams={teams} setTeams={setTeams} trainerAssignments={trainerAssignments} setTrainerAssignments={setTrainerAssignments} users={users} /></>}
        </div>
      </main>
    </div>
  );
}
