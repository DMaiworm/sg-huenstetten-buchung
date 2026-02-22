/**
 * CalendarView – Weekly calendar grid with resource & facility selection.
 *
 * Layout (top → bottom):
 *   1. Facility dropdown
 *   2. Resource group tabs  (filtered by selected facility)
 *   3. Resource tabs        (filtered by selected group via groupId)
 *   4. Resource info bar  +  Week navigation (prev / datepicker / next / today)
 *   5. 7-day hour grid      (07:00 – 22:00, slot shading for limited resources)
 *   6. Legend
 */

import React, { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ChevronLeft, ChevronRight, Shield, Maximize, Building2 } from 'lucide-react';
import { DAYS } from '../config/constants';
import { EVENT_TYPES } from '../config/organizationConfig';
import { formatDate, formatDateISO, getWeekDates, getWeekStart, timeToMinutes } from '../utils/helpers';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

// ──────────────────────────────────────────────
//  Grid layout constants
// ──────────────────────────────────────────────
const FIRST_HOUR  = 7;
const LAST_HOUR   = 22;
const HOURS       = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => i + FIRST_HOUR);
const HOUR_HEIGHT = 48;
const TOTAL_HEIGHT = HOURS.length * HOUR_HEIGHT;

// ──────────────────────────────────────────────
//  Component
// ──────────────────────────────────────────────

const CalendarView = ({
  bookings, slots, selectedResource, setSelectedResource,
  currentDate, setCurrentDate, users, adminCheckbox,
  resources, facilities, resourceGroups,
}) => {
  // ── Local state ────────────────────────────
  const [selectedFacilityId, setSelectedFacilityId] = useState(facilities?.[0]?.id || '');
  const [selectedGroupId, setSelectedGroupId]       = useState('');
  const [pickerOpen, setPickerOpen]                 = useState(false);
  const [pickerDate, setPickerDate]                 = useState(new Date(currentDate));

  const weekDates = getWeekDates(currentDate);

  // ── Derived: groups for selected facility ──
  const facilityGroups = useMemo(() => {
    if (!resourceGroups) return [];
    return resourceGroups
      .filter(g => g.facilityId === selectedFacilityId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [resourceGroups, selectedFacilityId]);

  // ── Derived: resources for selected group ──
  const groupResources = useMemo(() => {
    const group = facilityGroups.find(g => g.id === selectedGroupId);
    if (!group) return [];
    return resources.filter(r => r.groupId === group.id);
  }, [facilityGroups, selectedGroupId, resources]);

  // ── Auto-sync: when facilityGroups change, pick first group + resource ──
  useMemo(() => {
    if (facilityGroups.length === 0) return;
    const firstGroup = facilityGroups[0];
    setSelectedGroupId(firstGroup.id);
    const firstRes = resources.filter(r => r.groupId === firstGroup.id);
    if (firstRes.length > 0) setSelectedResource(firstRes[0].id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityGroups]);

  // ── Current resource object ────────────────
  const resource   = resources.find(r => r.id === selectedResource);
  const isLimited  = resource?.type === 'limited';
  const isComposite = resource?.isComposite;

  // ── Facility change handler ────────────────
  const handleFacilityChange = (facId) => {
    setSelectedFacilityId(facId);
  };

  // ── Group tab change handler ───────────────
  const handleGroupChange = (groupId) => {
    setSelectedGroupId(groupId);
    const firstRes = resources.filter(r => r.groupId === groupId);
    if (firstRes.length > 0) setSelectedResource(firstRes[0].id);
  };

  // ── Week navigation ────────────────────────
  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    const monday = getWeekStart(newDate);
    setCurrentDate(monday);
    setPickerDate(monday);
  };

  // ── DatePicker custom trigger button ───────
  const PickerButton = React.forwardRef(({ value, onClick }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={(e) => { if (onClick) onClick(e); setPickerOpen(prev => !prev); }}
      className="select-none cursor-pointer bg-transparent p-0 min-w-[90px]"
    >
      {value || formatDate(weekDates[0])}
    </button>
  ));
  PickerButton.displayName = 'PickerButton';

  const handleDatePickerSelect = (date) => {
    if (!date) return;
    const monday = getWeekStart(date);
    setPickerDate(monday);
    setCurrentDate(monday);
    setPickerOpen(false);
  };

  // ── Lookup helpers ─────────────────────────

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unbekannt';
  };

  const getBookingCountForGroup = (group) => {
    const weekStart = formatDateISO(weekDates[0]);
    const weekEnd   = formatDateISO(weekDates[6]);
    const resIds    = resources.filter(r => r.groupId === group.id).map(r => r.id);
    return bookings.filter(b =>
      resIds.includes(b.resourceId) && b.date >= weekStart && b.date <= weekEnd
    ).length;
  };

  const getBookingCountForResource = (resId) => {
    const weekStart = formatDateISO(weekDates[0]);
    const weekEnd   = formatDateISO(weekDates[6]);
    return bookings.filter(b =>
      b.resourceId === resId && b.date >= weekStart && b.date <= weekEnd
    ).length;
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
        result.push({
          ...b, isBlocking: true,
          blockingReason: resources.find(r => r.id === b.resourceId)?.name,
        });
      }
    });
    return result;
  };

  const selectedFacility = (facilities || []).find(f => f.id === selectedFacilityId);

  // ══════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════

  return (
    <div className="h-full flex flex-col">

      {/* ── 1. Facility dropdown ── */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <select
            value={selectedFacilityId}
            onChange={e => handleFacilityChange(e.target.value)}
            className="px-4 py-2 text-sm font-semibold bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            {(facilities || []).map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          {selectedFacility && (
            <span className="text-xs text-gray-400 hidden md:inline">
              {selectedFacility.street} {selectedFacility.houseNumber}, {selectedFacility.city}
            </span>
          )}
        </div>
        {adminCheckbox && <div className="flex-shrink-0">{adminCheckbox}</div>}
      </div>

      {/* ── 2. Resource group tabs ── */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-lg">
          {facilityGroups.map(group => {
            const count = getBookingCountForGroup(group);
            return (
              <button
                key={group.id}
                onClick={() => handleGroupChange(group.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
                  selectedGroupId === group.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                {group.name}
                {count > 0 && (
                  <span className={`ml-1 min-w-6 h-6 px-1.5 flex items-center justify-center text-xs font-bold rounded-full ${
                    selectedGroupId === group.id ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Resource tabs ── */}
      <div className="mb-3 h-[42px]">
        <div className="flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 overflow-x-auto h-[40px] whitespace-nowrap" style={{ scrollbarWidth: 'thin' }}>
          {groupResources.map(res => (
            <button
              key={res.id}
              onClick={() => setSelectedResource(res.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all flex items-center gap-1.5 flex-shrink-0 ${
                selectedResource === res.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
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

      {/* ── 4. Resource info + week navigation ── */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
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
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigateWeek(-1)}><ChevronLeft className="w-5 h-5" /></Button>
          <div className="font-medium text-center px-3 py-1.5 min-w-[220px]">
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
              <span className="mx-2">–</span>
              <span className="select-none">{formatDate(weekDates[6])}</span>
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigateWeek(1)}><ChevronRight className="w-5 h-5" /></Button>
          <Button variant="secondary" onClick={() => setCurrentDate(getWeekStart(new Date()))}>Heute</Button>
        </div>
      </div>

      {/* ── 5. Calendar grid ── */}
      <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col flex-1 min-h-[400px]">
        {/* Day header row */}
        <div className="grid min-w-[800px] flex-shrink-0" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div className="bg-gray-50 border-b border-r border-gray-200 p-2" />
          {weekDates.map((date, i) => (
            <div key={i} className="bg-gray-50 border-b border-gray-200 p-2 text-center">
              <div className="text-xs text-gray-500">{DAYS[date.getDay()]}</div>
              <div className={`text-lg font-semibold ${
                date.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-800'
              }`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable hour grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid min-w-[800px]" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
            {/* Hour labels (left column) */}
            <div className="border-r border-gray-200">
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="border-b border-gray-200 p-2 text-xs text-gray-500 text-right"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDates.map((date, dayIndex) => {
              const slot = getSlotForDay(date.getDay());
              const dayBookings = getBookingsForDay(date);

              return (
                <div
                  key={dayIndex}
                  className="relative"
                  style={{
                    height: `${TOTAL_HEIGHT}px`,
                    borderRight: dayIndex < 6 ? '1px solid #e5e7eb' : 'none',
                  }}
                >
                  {/* Hour cells with slot shading */}
                  {HOURS.map((hour, hourIdx) => {
                    const hourStart = hour * 60;
                    const hourEnd   = (hour + 1) * 60;
                    let isInSlot = !isLimited;
                    if (isLimited && slot) {
                      const ss = timeToMinutes(slot.startTime);
                      const se = timeToMinutes(slot.endTime);
                      isInSlot = hourStart >= ss && hourEnd <= se;
                    }
                    const bgCls = isLimited
                      ? (isInSlot ? 'bg-green-50' : 'bg-gray-100')
                      : 'bg-white';

                    return (
                      <div
                        key={hour}
                        className={`absolute left-0 right-0 border-b border-gray-200 ${bgCls}`}
                        style={{
                          top: `${hourIdx * HOUR_HEIGHT}px`,
                          height: `${HOUR_HEIGHT}px`,
                        }}
                      />
                    );
                  })}

                  {/* Booking blocks */}
                  {dayBookings.map(booking => {
                    const bookingResource = resources.find(r => r.id === booking.resourceId);
                    const bookingType     = EVENT_TYPES.find(t => t.id === booking.bookingType);
                    const isBlocking      = booking.isBlocking;

                    const startMinutes = timeToMinutes(booking.startTime);
                    const endMinutes   = timeToMinutes(booking.endTime);
                    const topPx    = ((startMinutes - FIRST_HOUR * 60) / 60) * HOUR_HEIGHT;
                    const heightPx = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 20);
                    const userName = getUserName(booking.userId);

                    // Dynamic colors must stay inline
                    let bgColor, textColor, borderStyle;
                    if (isBlocking) {
                      bgColor = '#d1d5db'; textColor = '#4b5563'; borderStyle = '1px dashed #9ca3af';
                    } else if (booking.status === 'approved') {
                      bgColor = bookingResource?.color; textColor = '#ffffff';
                    } else {
                      bgColor = '#fef08a'; textColor = '#854d0e'; borderStyle = '1px solid #facc15';
                    }

                    return (
                      <div
                        key={`${booking.id}-${isBlocking ? 'block' : 'own'}`}
                        className="absolute left-1 right-1 rounded overflow-hidden text-[11px] leading-tight px-1.5 py-0.5"
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx - 2}px`,
                          backgroundColor: bgColor, color: textColor, border: borderStyle,
                          zIndex: isBlocking ? 5 : 10,
                        }}
                        title={[
                          bookingType ? `${bookingType.icon} ${bookingType.label}` : '',
                          booking.title, userName,
                          `${booking.startTime}-${booking.endTime}`,
                        ].filter(Boolean).join(' | ')}
                      >
                        {isBlocking ? (
                          <>
                            <div className="truncate opacity-80">🚫 Blockiert</div>
                            {heightPx > 25 && (
                              <div className="truncate opacity-70">{booking.title}</div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-[13px]">{bookingType ? bookingType.icon : '📋'}</span>
                              <span className="truncate opacity-90 font-medium">
                                {bookingType ? bookingType.label : ''}
                              </span>
                            </div>
                            {heightPx > 28 && (
                              <div className="font-bold truncate">{booking.title}</div>
                            )}
                            {heightPx > 42 && (
                              <div className="truncate opacity-80">{userName}</div>
                            )}
                            {heightPx > 56 && (
                              <div className="font-bold truncate">
                                {booking.startTime} – {booking.endTime}
                              </div>
                            )}
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

      {/* ── 6. Legend ── */}
      <div className="mt-2 py-2 flex gap-6 text-sm flex-wrap items-center border-t border-gray-200">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded" /><span>Genehmigt</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded" /><span>Ausstehend</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-300 border border-gray-400 border-dashed rounded" /><span>Blockiert</span></div>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        {EVENT_TYPES.map(type => (
          <div key={type.id} className="flex items-center gap-2"><span>{type.icon}</span><span>{type.label}</span></div>
        ))}
        {isLimited && (
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
