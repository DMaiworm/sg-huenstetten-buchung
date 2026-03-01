import React, { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ChevronLeft, ChevronRight, Shield, Maximize, Building2, CalendarDays, Calendar } from 'lucide-react';
import { DAYS, DAYS_FULL } from '../config/constants';
import { EVENT_TYPES } from '../config/organizationConfig';
import { formatDate, formatDateISO, getWeekDates, getWeekStart, timeToMinutes } from '../utils/helpers';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useFacility } from '../contexts/FacilityContext';
import { useBookingContext } from '../contexts/BookingContext';
import { useUserContext } from '../contexts/UserContext';
import { useOrg } from '../contexts/OrganizationContext';
import type { Booking, BookableResource } from '../types';

const FIRST_HOUR   = 7;
const LAST_HOUR    = 22;
const HOURS        = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => i + FIRST_HOUR);
const HOUR_HEIGHT  = 48;
const TOTAL_HEIGHT = HOURS.length * HOUR_HEIGHT;

interface CalendarViewProps {
  onBookingClick?: (booking: Booking) => void;
}

type ViewMode = 'week' | 'day';

const CalendarView: React.FC<CalendarViewProps> = ({ onBookingClick }) => {
  const { RESOURCES: resources, slots, facilities, resourceGroups } = useFacility();
  const { bookings } = useBookingContext();
  const { users } = useUserContext();
  const { teams, departments, clubs } = useOrg();

  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFacilityId, setSelectedFacilityId] = useState(facilities?.[0]?.id || '');
  const [selectedGroupId, setSelectedGroupId]       = useState('');
  const [pickerOpen, setPickerOpen]                 = useState(false);
  const [pickerDate, setPickerDate]                 = useState(new Date(currentDate));
  const [viewMode, setViewMode]                     = useState<ViewMode>('week');

  const weekDates    = getWeekDates(currentDate);
  const displayDates = viewMode === 'week' ? weekDates : [currentDate];

  const facilityGroups = useMemo(() => {
    if (!resourceGroups) return [];
    return resourceGroups
      .filter(g => g.facilityId === selectedFacilityId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [resourceGroups, selectedFacilityId]);

  const groupResources = useMemo(() => {
    const group = facilityGroups.find(g => g.id === selectedGroupId);
    if (!group) return [];
    return resources.filter(r => r.groupId === group.id);
  }, [facilityGroups, selectedGroupId, resources]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    if (facilityGroups.length === 0) return;
    const firstGroup = facilityGroups[0];
    setSelectedGroupId(firstGroup.id);
    const firstRes = resources.filter(r => r.groupId === firstGroup.id);
    if (firstRes.length > 0) setSelectedResource(firstRes[0].id);
  }, [facilityGroups]);

  const resource    = resources.find(r => r.id === selectedResource);
  const isLimited   = resource?.type === 'limited';
  const isComposite = resource?.isComposite;

  const handleFacilityChange = (facId: string) => setSelectedFacilityId(facId);

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    const firstRes = resources.filter(r => r.groupId === groupId);
    if (firstRes.length > 0) setSelectedResource(firstRes[0].id);
  };

  const navigatePeriod = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
      const monday = getWeekStart(newDate);
      setCurrentDate(monday);
      setPickerDate(monday);
    } else {
      newDate.setDate(newDate.getDate() + direction);
      setCurrentDate(newDate);
      setPickerDate(newDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    if (viewMode === 'week') {
      const monday = getWeekStart(today);
      setCurrentDate(monday);
      setPickerDate(monday);
    } else {
      setCurrentDate(today);
      setPickerDate(today);
    }
  };

  const handleDayHeaderClick = (date: Date) => {
    if (viewMode === 'week') {
      setCurrentDate(date);
      setPickerDate(date);
      setViewMode('day');
    }
  };

  const toggleViewMode = () => {
    if (viewMode === 'week') {
      const today = new Date();
      const todayInWeek = weekDates.find(d => d.toDateString() === today.toDateString());
      const targetDate = todayInWeek || weekDates[0];
      setCurrentDate(targetDate);
      setPickerDate(targetDate);
      setViewMode('day');
    } else {
      const monday = getWeekStart(currentDate);
      setCurrentDate(monday);
      setPickerDate(monday);
      setViewMode('week');
    }
  };

  const PickerButton = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: (e: React.MouseEvent) => void }>(
    ({ value, onClick }, ref) => (
      <button
        ref={ref}
        type="button"
        onClick={(e) => { if (onClick) onClick(e); setPickerOpen(prev => !prev); }}
        className="select-none cursor-pointer bg-transparent p-0 min-w-[90px]"
      >
        {value || formatDate(displayDates[0])}
      </button>
    )
  );
  PickerButton.displayName = 'PickerButton';

  const handleDatePickerSelect = (date: Date | null) => {
    if (!date) return;
    if (viewMode === 'week') {
      const monday = getWeekStart(date);
      setPickerDate(monday);
      setCurrentDate(monday);
    } else {
      setPickerDate(date);
      setCurrentDate(date);
    }
    setPickerOpen(false);
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unbekannt';
  };

  const getBookingCountForResource = (resId: string) => {
    const from = formatDateISO(displayDates[0]);
    const to   = formatDateISO(displayDates[displayDates.length - 1]);
    return bookings.filter(b =>
      b.resourceId === resId && b.date >= from && b.date <= to
    ).length;
  };

  const getSlotForDay = (dayOfWeek: number) => {
    if (!isLimited) return null;
    return slots.find(s => s.resourceId === selectedResource && s.dayOfWeek === dayOfWeek);
  };

  const getSlotForResource = (resourceId: string, dayOfWeek: number) => {
    const res = resources.find(r => r.id === resourceId);
    if (res?.type !== 'limited') return null;
    return slots.find(s => s.resourceId === resourceId && s.dayOfWeek === dayOfWeek);
  };

  const getBookingsForDay = (date: Date) => {
    const dateStr = formatDateISO(date);
    const result: (Booking & { isBlocking: boolean; blockingReason?: string })[] = [];
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
      if (isComposite && resource?.includes?.includes(b.resourceId)) {
        result.push({
          ...b, isBlocking: true,
          blockingReason: resources.find(r => r.id === b.resourceId)?.name,
        });
      }
    });
    return result;
  };

  const getBookingsForResourceAndDay = (resourceId: string, date: Date) => {
    const res = resources.find(r => r.id === resourceId);
    const dateStr = formatDateISO(date);
    const result: (Booking & { isBlocking: boolean; blockingReason?: string })[] = [];
    bookings.forEach(b => {
      if (b.date !== dateStr) return;
      if (b.resourceId === resourceId) {
        result.push({ ...b, isBlocking: false });
        return;
      }
      if (res?.partOf && b.resourceId === res.partOf) {
        result.push({ ...b, isBlocking: true, blockingReason: 'Ganzes Feld gebucht' });
        return;
      }
      if (res?.isComposite && res.includes?.includes(b.resourceId)) {
        result.push({
          ...b, isBlocking: true,
          blockingReason: resources.find(r => r.id === b.resourceId)?.name,
        });
      }
    });
    return result;
  };

  const weekGridCols = `60px repeat(7, 1fr)`;
  const dayGridCols  = `60px repeat(${groupResources.length}, 1fr)`;
  const dayMinWidth  = `${Math.max(400, 60 + groupResources.length * 160)}px`;

  const showSlotLegend = viewMode === 'week'
    ? isLimited
    : groupResources.some(r => r.type === 'limited');

  const renderBookingBlock = (booking: Booking & { isBlocking: boolean; blockingReason?: string }, key: string) => {
    const bookingResource = resources.find(r => r.id === booking.resourceId);
    const bookingType     = EVENT_TYPES.find(t => t.id === booking.bookingType);
    const isBlockingBooking = booking.isBlocking;

    const startMinutes = timeToMinutes(booking.startTime);
    const endMinutes   = timeToMinutes(booking.endTime);
    const topPx    = ((startMinutes - FIRST_HOUR * 60) / 60) * HOUR_HEIGHT;
    const heightPx = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 20);
    const userName = getUserName(booking.userId);

    const bookingTeam       = teams?.find(t => t.id === booking.teamId);
    const bookingDepartment = departments?.find(d => d.id === bookingTeam?.departmentId);
    const bookingClub       = clubs?.find(c => c.id === bookingDepartment?.clubId);
    const clubShortName     = bookingClub?.shortName;

    let bgColor: string | undefined, textColor: string, borderStyle: string | undefined;
    if (isBlockingBooking) {
      bgColor = '#d1d5db'; textColor = '#4b5563'; borderStyle = '1px dashed #9ca3af';
    } else if (booking.status === 'approved') {
      bgColor = bookingTeam?.color || bookingResource?.color; textColor = '#ffffff';
    } else {
      bgColor = '#fef08a'; textColor = '#854d0e'; borderStyle = '1px solid #facc15';
    }

    return (
      <div
        key={key}
        className={`absolute left-1 right-1 rounded overflow-hidden text-[11px] leading-tight px-1.5 py-0.5${!isBlockingBooking && onBookingClick ? ' cursor-pointer hover:brightness-95 transition-all' : ''}`}
        style={{
          top: `${topPx}px`,
          height: `${heightPx - 2}px`,
          backgroundColor: bgColor, color: textColor, border: borderStyle,
          zIndex: isBlockingBooking ? 5 : 10,
        }}
        onClick={!isBlockingBooking && onBookingClick ? () => onBookingClick(booking) : undefined}
        title={[
          bookingType ? `${bookingType.icon} ${bookingType.label}` : '',
          booking.title, userName,
          `${booking.startTime}-${booking.endTime}`,
        ].filter(Boolean).join(' | ')}
      >
        {isBlockingBooking ? (
          <>
            <div className="truncate opacity-80">🚫 Blockiert</div>
            {heightPx > 25 && <div className="truncate opacity-70">{booking.title}</div>}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold opacity-90 flex-shrink-0">
                {clubShortName || (bookingType ? bookingType.icon : '📋')}
              </span>
              <span className="truncate opacity-90 font-medium">
                {bookingType ? bookingType.label : ''}
              </span>
            </div>
            {heightPx > 28 && <div className="font-bold truncate">{booking.title}</div>}
            {heightPx > 42 && <div className="truncate opacity-80">{userName}</div>}
            {heightPx > 56 && (
              <div className="font-bold truncate">{booking.startTime} – {booking.endTime}</div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">

      <div className="mb-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-shrink-0">
          <CalendarDays className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Kalender</h2>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={selectedFacilityId}
            onChange={e => handleFacilityChange(e.target.value)}
            className="px-3 py-1.5 text-sm font-semibold bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            {(facilities || []).map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={selectedGroupId}
            onChange={e => handleGroupChange(e.target.value)}
            className="px-3 py-1.5 text-sm font-semibold bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            {facilityGroups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm ml-auto">
          <button
            onClick={() => { if (viewMode !== 'week') toggleViewMode(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
              viewMode === 'week' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">Woche</span>
          </button>
          <button
            onClick={() => { if (viewMode !== 'day') toggleViewMode(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-l border-gray-200 transition-colors ${
              viewMode === 'day' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Tag</span>
          </button>
        </div>
      </div>

      {viewMode === 'week' && (
        <div className="mb-3 h-[42px]">
          <div className="flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 overflow-x-auto h-[40px] whitespace-nowrap" style={{ scrollbarWidth: 'thin' }}>
            {groupResources.map(res => (
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
                {res.name}
                {getBookingCountForResource(res.id) > 0 && (
                  <span className="ml-1 min-w-6 h-6 px-1.5 flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded-full">
                    {getBookingCountForResource(res.id)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
        <div className="flex items-center gap-2 flex-wrap min-h-[32px]">
          {viewMode === 'week' && resource && (
            <>
              <div className="w-3 h-6 rounded flex-shrink-0" style={{ backgroundColor: resource?.color }} />
              <h3 className="font-semibold text-gray-800">{resource?.name}</h3>
              {isLimited && (
                <Badge variant="warning" className="inline-flex items-center whitespace-nowrap">
                  <Shield className="w-3 h-3 inline mr-1" />Nur in zugewiesenen Slots
                </Badge>
              )}
              {isComposite && (
                <Badge variant="info" className="inline-flex items-center whitespace-nowrap">
                  <Maximize className="w-3 h-3 inline mr-1" />Beide Hälften
                </Badge>
              )}
            </>
          )}
          {viewMode === 'day' && (
            <>
              <div className="w-3 h-6 rounded flex-shrink-0" style={{ backgroundColor: groupResources[0]?.color }} />
              <h3 className="font-semibold text-gray-800">
                {facilityGroups.find(g => g.id === selectedGroupId)?.name}
              </h3>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button variant="ghost" onClick={() => navigatePeriod(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="font-medium text-center px-3 py-1.5 min-w-[140px]">
            <div className="flex items-center justify-center">
              <div className="relative">
                <DatePicker
                  selected={pickerDate}
                  onChange={handleDatePickerSelect}
                  onClickOutside={() => setPickerOpen(false)}
                  open={pickerOpen}
                  onSelect={handleDatePickerSelect}
                  shouldCloseOnSelect={true}
                  popperPlacement="bottom"
                  dateFormat="dd.MM.yyyy"
                  locale="de"
                  customInput={<PickerButton />}
                />
              </div>
              {viewMode === 'week' && (
                <>
                  <span className="mx-2">–</span>
                  <span className="select-none">{formatDate(weekDates[6])}</span>
                </>
              )}
              {viewMode === 'day' && (
                <span className="ml-2 text-gray-500 text-sm hidden sm:inline">
                  {DAYS_FULL ? DAYS_FULL[currentDate.getDay()] : DAYS[currentDate.getDay()]}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigatePeriod(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button variant="secondary" onClick={goToToday}>Heute</Button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col flex-1 min-h-[400px]">
        {viewMode === 'week' ? (
          <>
            <div className="grid flex-shrink-0" style={{ gridTemplateColumns: weekGridCols, minWidth: '800px' }}>
              <div className="bg-gray-50 border-b border-r border-gray-200 p-2" />
              {weekDates.map((date, i) => {
                const isTodayCol = date.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className="bg-gray-50 border-b border-gray-200 p-2 text-center cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleDayHeaderClick(date)} title="Tagesansicht öffnen">
                    <div className="text-xs text-gray-500">{DAYS[date.getDay()]}</div>
                    <div className={`text-lg font-semibold ${isTodayCol ? 'text-blue-600' : 'text-gray-800'}`}>{date.getDate()}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex-1 overflow-auto">
              <div className="grid" style={{ gridTemplateColumns: weekGridCols, minWidth: '800px' }}>
                <div className="border-r border-gray-200">
                  {HOURS.map(hour => (
                    <div key={hour} className="border-b border-gray-200 p-2 text-xs text-gray-500 text-right" style={{ height: `${HOUR_HEIGHT}px` }}>
                      {hour}:00
                    </div>
                  ))}
                </div>
                {weekDates.map((date, dayIndex) => {
                  const slot        = getSlotForDay(date.getDay());
                  const dayBookings = getBookingsForDay(date);
                  return (
                    <div key={dayIndex} className="relative" style={{ height: `${TOTAL_HEIGHT}px`, borderRight: dayIndex < 6 ? '1px solid #e5e7eb' : 'none' }}>
                      {HOURS.map((hour, hourIdx) => {
                        const hourStart = hour * 60;
                        const hourEnd   = (hour + 1) * 60;
                        let isInSlot = !isLimited;
                        if (isLimited && slot) {
                          const ss = timeToMinutes(slot.startTime);
                          const se = timeToMinutes(slot.endTime);
                          isInSlot = hourStart >= ss && hourEnd <= se;
                        }
                        const bgCls = isLimited ? (isInSlot ? 'bg-green-50' : 'bg-gray-100') : 'bg-white';
                        return (
                          <div key={hour} className={`absolute left-0 right-0 border-b border-gray-200 ${bgCls}`}
                            style={{ top: `${hourIdx * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }} />
                        );
                      })}
                      {dayBookings.map(booking =>
                        renderBookingBlock(booking, `${booking.id}-${booking.isBlocking ? 'block' : 'own'}`)
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex-shrink-0" style={{ minWidth: dayMinWidth }}>
              <div className="grid" style={{ gridTemplateColumns: dayGridCols }}>
                <div className="bg-gray-50 border-b border-r border-gray-200 p-2" />
                {groupResources.map((res, i) => (
                  <div key={res.id} className="bg-gray-50 border-b border-gray-200 p-2 text-center"
                    style={{ borderLeft: i > 0 ? '1px solid #e5e7eb' : undefined }}>
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-2.5 h-4 rounded flex-shrink-0" style={{ backgroundColor: res.color }} />
                      <span className="text-sm font-semibold text-gray-800">{res.name}</span>
                      {res.isComposite && <span className="text-xs">⭐</span>}
                      {res.type === 'limited' && <span className="text-xs">⚠️</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="grid" style={{ gridTemplateColumns: dayGridCols, minWidth: dayMinWidth }}>
                <div className="border-r border-gray-200">
                  {HOURS.map(hour => (
                    <div key={hour} className="border-b border-gray-200 p-2 text-xs text-gray-500 text-right" style={{ height: `${HOUR_HEIGHT}px` }}>
                      {hour}:00
                    </div>
                  ))}
                </div>
                {groupResources.map((res, colIndex) => {
                  const resIsLimited = res.type === 'limited';
                  const slot         = getSlotForResource(res.id, currentDate.getDay());
                  const colBookings  = getBookingsForResourceAndDay(res.id, currentDate);
                  return (
                    <div key={res.id} className="relative"
                      style={{ height: `${TOTAL_HEIGHT}px`, borderRight: colIndex < groupResources.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      {HOURS.map((hour, hourIdx) => {
                        const hourStart = hour * 60;
                        const hourEnd   = (hour + 1) * 60;
                        let isInSlot = !resIsLimited;
                        if (resIsLimited && slot) {
                          const ss = timeToMinutes(slot.startTime);
                          const se = timeToMinutes(slot.endTime);
                          isInSlot = hourStart >= ss && hourEnd <= se;
                        }
                        const bgCls = resIsLimited ? (isInSlot ? 'bg-green-50' : 'bg-gray-100') : 'bg-white';
                        return (
                          <div key={hour} className={`absolute left-0 right-0 border-b border-gray-200 ${bgCls}`}
                            style={{ top: `${hourIdx * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }} />
                        );
                      })}
                      {colBookings.map(booking =>
                        renderBookingBlock(booking, `${booking.id}-${res.id}-${booking.isBlocking ? 'block' : 'own'}`)
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-2 py-2 flex gap-6 text-sm flex-wrap items-center border-t border-gray-200">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded" /><span>Genehmigt</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded" /><span>Ausstehend</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-300 border border-gray-400 border-dashed rounded" /><span>Blockiert</span></div>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        {EVENT_TYPES.map(type => (
          <div key={type.id} className="flex items-center gap-2"><span>{type.icon}</span><span>{type.label}</span></div>
        ))}
        {showSlotLegend && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-50 border border-green-200 rounded" /><span>Verfügbarer Slot</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-100 rounded" /><span>Nicht verfügbar</span></div>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
