import React, { useState } from 'react';
import { RESOURCES, DEMO_BOOKINGS, DEMO_SLOTS, DEMO_USERS } from './config/constants';
import { EmailService, EMAIL_TEMPLATES } from './services/emailService';
import Sidebar from './components/Sidebar';
import CalendarView from './components/CalendarView';
import BookingRequest from './components/BookingRequest';
import MyBookings from './components/MyBookings';
import Approvals from './components/admin/Approvals';
import SlotManagement from './components/admin/SlotManagement';
import UserManagement from './components/admin/UserManagement';
import EmailLog from './components/admin/EmailLog';
import PDFExportDialog from './components/PDFExportDialog';

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
  const [users, setUsers] = useState(DEMO_USERS);
  const [showPDFExport, setShowPDFExport] = useState(false);
  const [emailService] = useState(() => new EmailService());

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
      id: Date.now() + i,
      resourceId: data.resourceId, date,
      startTime: data.startTime, endTime: data.endTime,
      title: data.title, description: data.description,
      bookingType: data.bookingType, userId: data.userId,
      status: bookingStatus,
      seriesId: data.dates.length > 1 ? seriesId : null,
    }));

    if (data.isComposite && data.includedResources) {
      data.includedResources.forEach(resId => {
        data.dates.forEach((date, i) => {
          newBookings.push({
            id: Date.now() + 1000 + i,
            resourceId: resId, date,
            startTime: data.startTime, endTime: data.endTime,
            title: data.title + ' (Ganzes Feld)',
            bookingType: data.bookingType, userId: data.userId,
            status: bookingStatus, seriesId, parentBooking: true,
          });
        });
      });
    }

    setBookings([...bookings, ...newBookings]);

    const resource = RESOURCES.find(r => r.id === data.resourceId);
    if (user && resource) {
      await emailService.send(EMAIL_TEMPLATES.bookingCreated(newBookings[0], user, resource));
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
      setBookings(bookings.filter(b => b.seriesId !== seriesId));
    } else {
      setBookings(bookings.filter(b => b.id !== bookingId));
    }
  };

  const adminCheckbox = (
    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
      <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
      Admin-Modus (Demo)
    </label>
  );

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          currentView={currentView} setCurrentView={setCurrentView}
          isAdmin={isAdmin} onExportPDF={() => setShowPDFExport(true)}
          emailService={emailService}
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {currentView === 'calendar' && (
              <CalendarView bookings={bookings} slots={slots} selectedResource={selectedResource} setSelectedResource={setSelectedResource} currentDate={currentDate} setCurrentDate={setCurrentDate} users={users} adminCheckbox={adminCheckbox} />
            )}
            {currentView === 'bookings' && <><div className="flex justify-end mb-4">{adminCheckbox}</div><MyBookings bookings={bookings} isAdmin={isAdmin} onDelete={handleDeleteBooking} users={users} /></>}
            {currentView === 'request' && <><div className="flex justify-end mb-4">{adminCheckbox}</div><BookingRequest slots={slots} bookings={bookings} onSubmit={handleNewBooking} users={users} /></>}
            {currentView === 'approvals' && <><div className="flex justify-end mb-4">{adminCheckbox}</div><Approvals bookings={bookings} onApprove={handleApprove} onReject={handleReject} users={users} /></>}
            {currentView === 'slots' && <><div className="flex justify-end mb-4">{adminCheckbox}</div><SlotManagement slots={slots} setSlots={setSlots} /></>}
            {currentView === 'users' && <><div className="flex justify-end mb-4">{adminCheckbox}</div><UserManagement users={users} setUsers={setUsers} /></>}
            {currentView === 'emails' && <><div className="flex justify-end mb-4">{adminCheckbox}</div><EmailLog emailService={emailService} /></>}
          </div>
        </main>
      </div>
      {/* PDF-Dialog ausserhalb des Flex-Layouts, damit fixed korrekt funktioniert */}
      <PDFExportDialog isOpen={showPDFExport} onClose={() => setShowPDFExport(false)} bookings={bookings} users={users} />
    </>
  );
}
