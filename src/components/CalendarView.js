import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Shield, Maximize } from 'lucide-react';
import { RESOURCES, BOOKING_TYPES, DAYS } from '../config/constants';
import { formatDate, formatDateISO, getWeekDates, timeToMinutes } from '../utils/helpers';
import { Badge } from './ui/Badge';
import { Button } from './ui/Badge';

const CalendarView = ({ bookings, slots, selectedResource, setSelectedResource, currentDate, setCurrentDate, users }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unbekannt';
  };

  const weekDates = getWeekDates(currentDate);
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

  const resource = RESOURCES.find(r => r.id === selectedResource);
  const isLimited = resource?.type === 'limited';
  const isComposite = resource?.isComposite;

  const categories = [
    { id: 'all', label: 'Alle Anlagen', icon: 'ALL' },
    { id: 'outdoor', label: 'Aussenanlagen', icon: 'OUT' },
    { id: 'indoor', label: 'Innenraeume', icon: 'IN' },
    { id: 'shared', label: 'Geteilte Hallen', icon: 'SHARED' },
  ];

  const categoryResources = selectedCategory === 'all'
    ? RESOURCES
    : RESOURCES.filter(r => r.category === selectedCategory);

  const getBookingCountForCategory = (catId) => {
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    if (catId === 'all') {
      return bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= weekStart && bookingDate <= weekEnd;
      }).length;
    }
    const categoryResourceIds = RESOURCES.filter(r => r.category === catId).map(r => r.id);
    return bookings.filter(b => {
      if (!categoryResourceIds.includes(b.resourceId)) return false;
      const bookingDate = new Date(b.date);
      return bookingDate >= weekStart && bookingDate <= weekEnd;
    }).length;
  };

  const getBookingCountForResource = (resId) => {
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    return bookings.filter(b => {
      if (b.resourceId !== resId) return false;
      const bookingDate = new Date(b.date);
      return bookingDate >= weekStart && bookingDate <= weekEnd;
    }).length;
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      setSelectedResource(RESOURCES[0].id);
    } else {
      const firstResource = RESOURCES.find(r => r.category === catId);
      if (firstResource) setSelectedResource(firstResource.id);
    }
  };

  const getSlotForDay = (dayOfWeek) => {
    if (!isLimited) return null;
    return slots.find(s => s.resourceId === selectedResource && s.dayOfWeek === dayOfWeek);
  };

  const getBookingsForDay = (date) => {
    const dateStr = formatDateISO(date);
    const result = [];
    bookings.forEach(b => {
      if (b.date !== dateStr) return;
      if (b.resourceId === selectedResource) {
        result.push({ ...b, isBlocking: false });
        return;
      }
      if (resource?.partOf && b.resourceId === resource.partOf) {
        result.push({ ...b, isBlocking: true, blockingReason: 'Ganzes Feld gebucht' });
        return;
      }
      if (isComposite && resource.includes?.includes(b.resourceId)) {
        result.push({ ...b, isBlocking: true, blockingReason: RESOURCES.find(r => r.id === b.resourceId)?.name });
      }
    });
    return result;
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Kategorie-Tabs */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-lg">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === cat.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                selectedCategory === cat.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {getBookingCountForCategory(cat.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ressourcen-Tabs */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
          {categoryResources.map(res => (
            <button
              key={res.id}
              onClick={() => setSelectedResource(res.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all flex items-center gap-1.5 ${
                selectedResource === res.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={selectedResource === res.id ? { borderLeft: `3px solid ${res.color}` } : {}}
            >
              {res.name.replace('Grosse ', '').replace('Kleine ', 'Kl. ')}
              {getBookingCountForResource(res.id) > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {getBookingCountForResource(res.id)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Ressource Info + Navigation */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-8 rounded" style={{ backgroundColor: resource?.color }} />
          <div>
            <h3 className="font-semibold text-gray-800">{resource?.name}</h3>
            <div className="flex items-center gap-2">
              {isLimited && (
                <Badge variant="warning"><Shield className="w-3 h-3 inline mr-1" />Nur in zugewiesenen Slots</Badge>
              )}
              {isComposite && (
                <Badge variant="info"><Maximize className="w-3 h-3 inline mr-1" />Beide Haelften</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigateWeek(-1)}><ChevronLeft className="w-5 h-5" /></Button>
          <span className="font-medium min-w-48 text-center">{formatDate(weekDates[0])} - {formatDate(weekDates[6])}</span>
          <Button variant="ghost" onClick={() => navigateWeek(1)}><ChevronRight className="w-5 h-5" /></Button>
          <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>Heute</Button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 380px)', minHeight: '400px' }}>
        {/* Wochen-Header */}
        <div className="grid grid-cols-8 min-w-[800px] flex-shrink-0">
          <div className="bg-gray-50 border-b border-r border-gray-200 p-2"></div>
          {weekDates.map((date, i) => (
            <div key={i} className="bg-gray-50 border-b border-gray-200 p-2 text-center">
              <div className="text-xs text-gray-500">{DAYS[date.getDay()]}</div>
              <div className={`text-lg font-semibold ${date.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-800'}`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollbarer Bereich */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8 min-w-[800px]">
            <div className="border-r border-gray-200">
              {hours.map(hour => (
                <div key={hour} className="h-12 border-b border-gray-200 p-2 text-xs text-gray-500 text-right">{hour}:00</div>
              ))}
            </div>
            {weekDates.map((date, dayIndex) => {
              const slot = getSlotForDay(date.getDay());
              const dayBookings = getBookingsForDay(date);
              const firstHour = hours[0];
              return (
                <div key={dayIndex} className="relative border-r border-gray-200 last:border-r-0">
                  {hours.map(hour => {
                    const hourStart = hour * 60;
                    const hourEnd = (hour + 1) * 60;
                    let isInSlot = !isLimited;
                    if (isLimited && slot) {
                      const slotStart = timeToMinutes(slot.startTime);
                      const slotEnd = timeToMinutes(slot.endTime);
                      isInSlot = hourStart >= slotStart && hourEnd <= slotEnd;
                    }
                    return (
                      <div key={hour} className={`h-12 border-b border-gray-200 ${isLimited && !isInSlot ? 'bg-gray-100' : 'bg-white'} ${isLimited && isInSlot ? 'bg-green-50' : ''}`} />
                    );
                  })}
                  {dayBookings.map(booking => {
                    const bookingResource = RESOURCES.find(r => r.id === booking.resourceId);
                    const isBlocking = booking.isBlocking;
                    const startMinutes = timeToMinutes(booking.startTime);
                    const endMinutes = timeToMinutes(booking.endTime);
                    const durationMinutes = endMinutes - startMinutes;
                    const topPx = ((startMinutes - firstHour * 60) / 60) * 48;
                    const heightPx = (durationMinutes / 60) * 48;
                    return (
                      <div
                        key={`${booking.id}-${isBlocking ? 'block' : 'own'}`}
                        className={`absolute left-1 right-1 rounded px-1 py-0.5 text-xs overflow-hidden ${
                          isBlocking ? 'bg-gray-300 text-gray-600 border border-gray-400 border-dashed'
                            : booking.status === 'approved' ? 'text-white' : 'bg-yellow-200 text-yellow-800 border border-yellow-400'
                        }`}
                        style={{
                          top: `${topPx}px`, height: `${heightPx - 2}px`,
                          backgroundColor: !isBlocking && booking.status === 'approved' ? bookingResource?.color : undefined,
                          zIndex: isBlocking ? 5 : 10,
                        }}
                        title={isBlocking
                          ? `Blockiert: ${booking.title} (${booking.blockingReason}) ${booking.startTime}-${booking.endTime}`
                          : `${booking.bookingType ? BOOKING_TYPES.find(t => t.id === booking.bookingType)?.icon + ' ' : ''}${booking.title} (${booking.startTime}-${booking.endTime}) - ${getUserName(booking.userId)}`
                        }
                      >
                        <div className="font-medium truncate">
                          {isBlocking && 'X '}
                          {!isBlocking && booking.bookingType && BOOKING_TYPES.find(t => t.id === booking.bookingType)?.icon && `${BOOKING_TYPES.find(t => t.id === booking.bookingType)?.icon} `}
                          {booking.title}
                        </div>
                        {heightPx > 30 && (
                          <div className="text-xs opacity-80 truncate">{booking.startTime} - {booking.endTime}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legende */}
      <div className="mt-4 flex gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded"></div><span>Genehmigt</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div><span>Ausstehend</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-300 border border-gray-400 border-dashed rounded"></div><span>Blockiert</span></div>
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        {BOOKING_TYPES.map(type => (
          <div key={type.id} className="flex items-center gap-2"><span>{type.icon}</span><span>{type.label}</span></div>
        ))}
        {isLimited && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div><span>Verfuegbarer Slot</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-100 rounded"></div><span>Nicht verfuegbar</span></div>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
