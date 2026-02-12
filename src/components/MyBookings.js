import React, { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, Users, X, List, Repeat, Building, UserCheck, Star } from 'lucide-react';
import { BOOKING_TYPES, ROLES, DAYS_FULL } from '../config/constants';
import { Badge } from './ui/Badge';
import { Button } from './ui/Badge';

const UMLAUT_U = String.fromCharCode(252);
const ENDASH = String.fromCharCode(8211);

const MyBookings = ({ bookings, isAdmin, onDelete, users, resources, clubs, departments, teams, trainerAssignments }) => {
  const RESOURCES = resources;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedResource, setSelectedResource] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Resolve organization info for a booking's user via trainer assignments
  const getOrgInfo = (userId) => {
    if (!trainerAssignments || !teams || !departments || !clubs) return null;
    const assignments = trainerAssignments.filter(ta => ta.userId === userId);
    if (assignments.length === 0) return null;
    return assignments.map(ta => {
      const team = teams.find(t => t.id === ta.teamId);
      if (!team) return null;
      const dept = departments.find(d => d.id === team.departmentId);
      const club = dept ? clubs.find(c => c.id === dept.clubId) : null;
      return { team, dept, club, isPrimary: ta.isPrimary };
    }).filter(Boolean);
  };

  // Get all trainers for a team
  const getTeamTrainers = (teamId) => {
    if (!trainerAssignments || !users) return [];
    return trainerAssignments
      .filter(ta => ta.teamId === teamId)
      .map(ta => {
        const user = users.find(u => u.id === ta.userId);
        return user ? { ...user, isPrimary: ta.isPrimary } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  };

  const getUserInfo = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return { name: 'Unbekannt' };
    return { name: `${user.firstName} ${user.lastName}` };
  };

  const categories = [
    { id: 'all', label: 'Alle Buchungen' },
    { id: 'outdoor', label: 'Aussenanlagen' },
    { id: 'indoor', label: 'Innenraeume' },
    { id: 'shared', label: 'Geteilte Hallen' },
  ];

  const getBookingCountForCategory = (catId) => {
    if (catId === 'all') return bookings.length;
    const categoryResources = RESOURCES.filter(r => r.category === catId).map(r => r.id);
    return bookings.filter(b => categoryResources.includes(b.resourceId)).length;
  };

  const getBookingCountForResource = (resId) => bookings.filter(b => b.resourceId === resId).length;

  const categoryResources = selectedCategory !== 'all' ? RESOURCES.filter(r => r.category === selectedCategory) : [];

  const filteredBookings = useMemo(() => {
    if (selectedCategory === 'all') return bookings;
    const categoryResourceIds = RESOURCES.filter(r => r.category === selectedCategory).map(r => r.id);
    let filtered = bookings.filter(b => categoryResourceIds.includes(b.resourceId));
    if (selectedResource !== 'all') filtered = filtered.filter(b => b.resourceId === selectedResource);
    return filtered;
  }, [bookings, selectedCategory, selectedResource, RESOURCES]);

  const groupedBookings = useMemo(() => {
    const series = {};
    const single = [];
    filteredBookings.forEach(b => {
      if (b.seriesId) { if (!series[b.seriesId]) series[b.seriesId] = { ...b, dates: [] }; series[b.seriesId].dates.push(b.date); }
      else single.push(b);
    });
    return [...Object.values(series), ...single];
  }, [filteredBookings]);

  const handleCategoryChange = (catId) => { setSelectedCategory(catId); setSelectedResource('all'); };

  // Get weekday name from a booking
  const getWeekdayFromBooking = (booking) => {
    if (booking.dates && booking.dates.length > 0) {
      const d = new Date(booking.dates[0]);
      return 'Jeden ' + DAYS_FULL[d.getDay()];
    }
    if (booking.date) {
      const d = new Date(booking.date);
      return DAYS_FULL[d.getDay()];
    }
    return '';
  };

  const getDateRange = (booking) => {
    const isSeries = booking.dates && booking.dates.length > 1;
    if (isSeries) {
      const first = new Date(booking.dates[0]).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const last = new Date(booking.dates[booking.dates.length - 1]).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return first + ' ' + ENDASH + ' ' + last;
    }
    if (booking.date) {
      return new Date(booking.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return '';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Meine Buchungen</h2>
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-lg">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => handleCategoryChange(cat.id)}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${selectedCategory === cat.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}>
              {cat.label}
              <span className={`px-2 py-0.5 text-xs rounded-full ${selectedCategory === cat.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>{getBookingCountForCategory(cat.id)}</span>
            </button>
          ))}
        </div>
      </div>
      {selectedCategory !== 'all' && categoryResources.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
            <button onClick={() => setSelectedResource('all')} className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${selectedResource === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>Alle</button>
            {categoryResources.map(res => (
              <button key={res.id} onClick={() => setSelectedResource(res.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-all flex items-center gap-1.5 ${selectedResource === res.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                style={selectedResource === res.id ? { borderLeft: '3px solid ' + res.color } : {}}>
                {res.name}
                {getBookingCountForResource(res.id) > 0 && (<span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{getBookingCountForResource(res.id)}</span>)}
              </button>
            ))}
          </div>
        </div>
      )}
      {groupedBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><List className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>Keine Buchungen</p></div>
      ) : (
        <div className="space-y-3">
          {groupedBookings.map((booking, idx) => {
            const resource = RESOURCES.find(r => r.id === booking.resourceId);
            const isSeries = booking.dates && booking.dates.length > 1;
            const bookingType = BOOKING_TYPES.find(t => t.id === booking.bookingType);
            const orgInfos = getOrgInfo(booking.userId);
            const primaryOrg = orgInfos && orgInfos.length > 0 ? orgInfos[0] : null;
            const teamTrainers = primaryOrg ? getTeamTrainers(primaryOrg.team.id) : [];
            const userInfo = getUserInfo(booking.userId);

            return (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex">
                  {/* Color bar */}
                  <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: resource?.color }} />

                  {/* Content Grid: 3 columns + action column */}
                  <div className="flex-1 grid grid-cols-[1fr_auto_auto] md:grid-cols-[2fr_1.2fr_1.2fr] gap-x-4 gap-y-0 p-3 items-start">

                    {/* Column 1: Title, Resource, Schedule */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 truncate">"{booking.title}"</h3>
                        {isSeries && (
                          <span className="text-xs text-blue-600 font-medium flex items-center gap-0.5 flex-shrink-0">
                            <Repeat className="w-3 h-3" />{booking.dates.length}x
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5 text-sm text-gray-600">
                        <div>{resource?.name}</div>
                        <div>{getWeekdayFromBooking(booking)}</div>
                        <div className="font-semibold text-gray-800">{booking.startTime} - {booking.endTime}</div>
                        <div className="text-xs text-gray-400">{getDateRange(booking)}</div>
                      </div>
                    </div>

                    {/* Column 2: Trainers */}
                    <div className="min-w-0 border-l border-gray-100 pl-4 hidden md:block">
                      {teamTrainers.length > 0 ? (
                        <div className="space-y-1">
                          {teamTrainers.map(t => (
                            <div key={t.id} className="text-sm text-gray-700 flex items-center gap-1.5">
                              <span>{t.firstName} {t.lastName}</span>
                              {!t.isPrimary && <span className="text-xs text-gray-400">(Co)</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">{userInfo.name}</div>
                      )}
                    </div>

                    {/* Column 3: Organization + Booking Type */}
                    <div className="min-w-0 border-l border-gray-100 pl-4 hidden md:block">
                      {/* Booking type badge */}
                      <div className="flex items-center gap-1.5 mb-2">
                        {bookingType && (
                          <span className="text-sm font-medium text-gray-700">
                            {bookingType.icon} <strong>{bookingType.label}</strong>
                          </span>
                        )}
                      </div>
                      {/* Org hierarchy */}
                      {primaryOrg ? (
                        <div className="space-y-0.5 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: primaryOrg.club?.color }} />
                            <span className="font-semibold text-gray-800">{primaryOrg.club?.name}</span>
                          </div>
                          <div className="text-gray-600 pl-3.5">
                            {primaryOrg.dept?.icon} {primaryOrg.dept?.name}
                          </div>
                          <div className="flex items-center gap-1.5 pl-3.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: primaryOrg.team?.color }} />
                            <span className="text-gray-700">{primaryOrg.team?.name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">{userInfo.name}</div>
                      )}
                    </div>
                  </div>

                  {/* Action column */}
                  <div className="flex flex-col items-end gap-2 p-3 pl-0 flex-shrink-0">
                    {booking.status === 'approved' && (<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500 text-white">Genehmigt</span>)}
                    {booking.status === 'pending' && (<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-400 text-gray-800">Ausstehend</span>)}
                    {booking.status === 'rejected' && (<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white">Abgelehnt</span>)}
                    {isAdmin && (
                      <div className="flex flex-col gap-1 mt-1">
                        {deleteConfirm?.id === booking.id ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs">
                            <p className="text-red-700 font-medium mb-1">L{String.fromCharCode(246)}schen?</p>
                            <div className="flex gap-1">
                              <Button variant="danger" size="sm" onClick={() => { onDelete(booking.id, deleteConfirm.type, booking.seriesId); setDeleteConfirm(null); }}>Ja</Button>
                              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>Nein</Button>
                            </div>
                          </div>
                        ) : (
                          <>{isSeries ? (
                            <div className="flex flex-col gap-1">
                              <button onClick={() => setDeleteConfirm({ id: booking.id, type: 'single' })} className="inline-flex items-center px-2 py-1 bg-gray-100 text-red-600 rounded text-xs font-medium hover:bg-gray-200 transition-colors gap-1" title="Nur diesen Termin loeschen"><X className="w-3 h-3" />1 Termin</button>
                              <button onClick={() => setDeleteConfirm({ id: booking.id, type: 'series' })} className="inline-flex items-center px-2 py-1 bg-gray-100 text-red-600 rounded text-xs font-medium hover:bg-gray-200 transition-colors gap-1" title="Ganze Serie loeschen"><X className="w-3 h-3" />Serie</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm({ id: booking.id, type: 'single' })} className="inline-flex items-center px-2 py-1 bg-gray-100 text-red-600 rounded text-xs font-medium hover:bg-gray-200 transition-colors gap-1"><X className="w-3 h-3" />L{String.fromCharCode(246)}schen</button>
                          )}</>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile: Trainers + Org collapsed into one row */}
                <div className="md:hidden border-t border-gray-100 px-3 py-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    {teamTrainers.length > 0 ? (
                      teamTrainers.map(t => (
                        <div key={t.id} className="text-gray-600">{t.firstName} {t.lastName}{!t.isPrimary ? ' (Co)' : ''}</div>
                      ))
                    ) : (
                      <div className="text-gray-600">{userInfo.name}</div>
                    )}
                  </div>
                  <div>
                    {primaryOrg ? (
                      <>
                        <div className="font-medium text-gray-800">{primaryOrg.club?.name}</div>
                        <div className="text-gray-500 text-xs">{primaryOrg.dept?.icon} {primaryOrg.dept?.name} {String.fromCharCode(8250)} {primaryOrg.team?.name}</div>
                      </>
                    ) : (
                      <div className="text-gray-500">{bookingType?.icon} {bookingType?.label}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
