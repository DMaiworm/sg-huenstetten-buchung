import React, { useState, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ChevronLeft, ChevronRight, Shield, Maximize, Calendar } from 'lucide-react';
import { RESOURCES, BOOKING_TYPES, DAYS } from '../config/constants';
import { formatDate, formatDateISO, getWeekDates, timeToMinutes } from '../utils/helpers';
import { Badge } from './ui/Badge';
import { Button } from './ui/Badge';


const CalendarView = ({ bookings, slots, selectedResource, setSelectedResource, currentDate, setCurrentDate, users, adminCheckbox }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date(currentDate));
  const datePickerRef = useRef(null);

  const handleDatePickerSelect = (date) => {
    if (!date) return;
    setPickerDate(date);
    setCurrentDate(getWeekStart(date));
    setPickerOpen(false);
  };

  const handleOpenPicker = () => {
    setPickerDate(new Date(currentDate));
    setPickerOpen(true);
  };
  
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unbekannt';
  };

  const weekDates = getWeekDates(currentDate);
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);

  const resource = RESOURCES.find(r => r.id === selectedResource);
  const isLimited = resource?.type === 'limited';
  const isComposite = resource?.isComposite;

  const categories = [
    { id: 'all', label: 'Alle Anlagen', icon: '📋' },
    { id: 'outdoor', label: 'Außenanlagen', icon: '🏟️' },
    { id: 'indoor', label: 'Innenräume', icon: '🏠' },
    { id: 'shared', label: 'Geteilte Hallen', icon: '🤝' },
  ];

  const categoryResources = selectedCategory === 'all'
    ? RESOURCES
    : RESOURCES.filter(r => r.category === selectedCategory);

  const getBookingCountForCategory = (catId) => {
    const weekStart = formatDateISO(weekDates[0]);
    const weekEnd = formatDateISO(weekDates[6]);
    if (catId === 'all') {
      return bookings.filter(b => b.date >= weekStart && b.date <= weekEnd).length;
    }
    const categoryResourceIds = RESOURCES.filter(r => r.category === catId).map(r => r.id);
    return bookings.filter(b => categoryResourceIds.includes(b.resourceId) && b.date >= weekStart && b.date <= weekEnd).length;
  };

  const getBookingCountForResource = (resId) => {
    const weekStart = formatDateISO(weekDates[0]);
    const weekEnd = formatDateISO(weekDates[6]);
    return bookings.filter(b => b.resourceId === resId && b.date >= weekStart && b.date <= weekEnd).length;
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

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay() || 7; // Sonntag = 7
    d.setDate(d.getDate() - day + 1); // Montag
    d.setHours(0, 0, 0, 0);
    return d;
  };
  
  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const handleDatePickerChange = (e) => {
    const picked = new Date(e.target.value + 'T12:00:00');
    if (!isNaN(picked.getTime())) {
      setCurrentDate(getWeekStart(picked));
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Kategorie-Tabs + Admin-Checkbox */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-lg flex-1">
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

              {getBookingCountForCategory(cat.id) > 0 && (
                <span
                  className={`ml-2 min-w-10 h-10 px-2 flex items-center justify-center text-sm font-bold rounded-full ${
                   selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
              }`}
              >
              {getBookingCountForCategory(cat.id)}
           </span>
            )}
          </button>
          ))}
        </div>
        {adminCheckbox && <div className="flex-shrink-0">{adminCheckbox}</div>}
      </div>

      {/* Ressourcen-Tabs - horizontal scrollbar, feste Höhe */}
      <div className="mb-3" style={{ height: '42px' }}>
        <div className="flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 overflow-x-auto" style={{ height: '40px', whiteSpace: 'nowrap', scrollbarWidth: 'thin' }}>
          {categoryResources.map(res => (
            <button
              key={res.id}
              onClick={() => setSelectedResource(res.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all flex items-center gap-1.5 flex-shrink-0 ${
                selectedResource === res.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={selectedResource === res.id ? { borderLeft: `3px solid ${res.color}` } : {}}
            >
              {res.isComposite && <span>⭐</span>}
              {res.type === 'limited' && <span>⚠️</span>}
              {res.name.replace('Große ', '').replace('Kleine ', 'Kl. ')}
              {getBookingCountForResource(res.id) > 0 && (
                <span className="ml-2 min-w-10 h-10 px-2 flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded-full">
                  {getBookingCountForResource(res.id)}
                </span>               
              )}
            </button>
          ))}
        </div>
      </div>
        
      {/* Ressource Info + Navigation */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="w-3 h-6 rounded flex-shrink-0"
            style={{ backgroundColor: resource?.color }}
          />
          <h3 className="font-semibold text-gray-800">{resource?.name}</h3>

          {isLimited && (
            <Badge variant="warning">
              <Shield className="w-3 h-3 inline mr-1" />
              Nur in zugewiesenen Slots
            </Badge>
          )}

          {isComposite && (
            <Badge variant="info">
              <Maximize className="w-3 h-3 inline mr-1" />
              Beide Hälften
            </Badge>
          )}
        </div>

       <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="font-medium text-center px-3 py-1.5" style={{ minWidth: '220px' }}>
            <div className="flex items-center justify-center">
              <div className="relative">
                {/* sichtbar: Startdatum (Montag) - klick öffnet Picker */}
                <button
                  type="button"
                  onClick={handleOpenPicker}
                  className="select-none cursor-pointer bg-transparent p-0"
                >
                  {formatDate(weekDates[0])}
                </button>

                {/* Controlled react-datepicker */}
                <div className="absolute left-0 top-full z-50">
                  <DatePicker
                    ref={datePickerRef}
                    selected={pickerDate}
                    onChange={(date) => handleDatePickerSelect(date)}
                    onClickOutside={() => setPickerOpen(false)}
                    open={pickerOpen}
                    onSelect={(date) => handleDatePickerSelect(date)}
                    inline={false}
                    withPortal={false}
                    // optional: showMonthDropdown, showYearDropdown, etc.
                    // prevent keyboard from closing unexpectedly
                    shouldCloseOnSelect={true}
                    // position the popper right under the trigger
                    popperPlacement="bottom"
                    // don't render unless open (keeps DOM small)
                    portalId="react-datepicker-portal"
                    // keep it controlled
                    dateFormat="dd.MM.yyyy"
                  />
                </div>
              </div>

              <span className="mx-2">–</span>

              <span className="select-none">{formatDate(weekDates[6])}</span>
            </div>
          </div>

          <Button variant="ghost" onClick={() => navigateWeek(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>

          <Button
            variant="secondary"
            onClick={() => setCurrentDate(getWeekStart(new Date()))}
          >
            Heute
          </Button>
        </div>

      {/* Kalender-Grid - flexibel bis zum unteren Rand */}
      <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col flex-1" style={{ minHeight: '400px' }}>
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
              const totalHeight = hours.length * 48;
              return (
                <div key={dayIndex} className="relative border-r border-gray-200 last:border-r-0" style={{ height: `${totalHeight}px` }}>
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
                    const bookingType = BOOKING_TYPES.find(t => t.id === booking.bookingType);
                    const isBlocking = booking.isBlocking;
                    const startMinutes = timeToMinutes(booking.startTime);
                    const endMinutes = timeToMinutes(booking.endTime);
                    const durationMinutes = endMinutes - startMinutes;
                    const topPx = ((startMinutes - firstHour * 60) / 60) * 48;
                    const heightPx = Math.max((durationMinutes / 60) * 48, 20);
                    const clampedTop = Math.max(0, Math.min(topPx, totalHeight - heightPx));
                    const userName = getUserName(booking.userId);
                    return (
                      <div
                        key={`${booking.id}-${isBlocking ? 'block' : 'own'}`}
                        className={`absolute left-1 right-1 rounded overflow-hidden ${
                          isBlocking ? 'bg-gray-300 text-gray-600 border border-gray-400 border-dashed'
                            : booking.status === 'approved' ? 'text-white' : 'bg-yellow-200 text-yellow-800 border border-yellow-400'
                        }`}
                        style={{
                          top: `${clampedTop}px`, height: `${heightPx - 2}px`,
                          backgroundColor: !isBlocking && booking.status === 'approved' ? bookingResource?.color : undefined,
                          zIndex: isBlocking ? 5 : 10,
                          fontSize: '11px', lineHeight: '1.35',
                          padding: '3px 6px',
                        }}
                        title={`${bookingType ? bookingType.icon + ' ' + bookingType.label : ''} | ${booking.title} | ${userName} | ${booking.startTime}-${booking.endTime}`}
                      >
                        {isBlocking ? (
                          <>
                            <div className="truncate opacity-80">🚫 Blockiert</div>
                            {heightPx > 25 && <div className="truncate opacity-70">{booking.title}</div>}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span style={{ fontSize: '13px' }}>{bookingType ? bookingType.icon : '📋'}</span>
                              <span className="truncate opacity-90 font-medium">{bookingType ? bookingType.label : ''}</span>
                            </div>
                            {heightPx > 28 && <div className="font-bold truncate">{booking.title}</div>}
                            {heightPx > 42 && <div className="truncate opacity-80">{userName}</div>}
                            {heightPx > 56 && <div className="font-bold truncate">{booking.startTime} – {booking.endTime}</div>}
                          </>
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
      <div className="mt-2 py-2 flex gap-6 text-sm flex-wrap items-center border-t border-gray-200">
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
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div><span>Verfügbarer Slot</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-100 rounded"></div><span>Nicht verfügbar</span></div>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
