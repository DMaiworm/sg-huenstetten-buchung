import React, { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, Users, X, List, Repeat, Building, UserCheck, Star } from 'lucide-react';
import { BOOKING_TYPES, ROLES } from '../config/constants';
import { Badge } from './ui/Badge';
import { Button } from './ui/Badge';

const ENDASH = String.fromCharCode(8211);
const DAYS_FULL_DE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

const MyBookings = ({ bookings, isAdmin, onDelete, users, resources, clubs, departments, teams, trainerAssignments }) => {
  const RESOURCES = resources;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedResource, setSelectedResource] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
    const cr = RESOURCES.filter(r => r.category === catId).map(r => r.id);
    return bookings.filter(b => cr.includes(b.resourceId)).length;
  };

  const getBookingCountForResource = (resId) => bookings.filter(b => b.resourceId === resId).length;

  const categoryResources = selectedCategory !== 'all' ? RESOURCES.filter(r => r.category === selectedCategory) : [];

  const filteredBookings = useMemo(() => {
    if (selectedCategory === 'all') return bookings;
    const ids = RESOURCES.filter(r => r.category === selectedCategory).map(r => r.id);
    let f = bookings.filter(b => ids.includes(b.resourceId));
    if (selectedResource !== 'all') f = f.filter(b => b.resourceId === selectedResource);
    return f;
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

  const getWeekday = (booking) => {
    const isSeries = booking.dates && booking.dates.length > 1;
    const dateStr = isSeries ? booking.dates[0] : booking.date;
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isSeries ? ('Jeden ' + DAYS_FULL_DE[d.getDay()]) : DAYS_FULL_DE[d.getDay()];
  };

  const getDateDisplay = (booking) => {
    const isSeries = booking.dates && booking.dates.length > 1;
    if (isSeries) {
      const fmt = (s) => new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return fmt(booking.dates[0]) + ENDASH + fmt(booking.dates[booking.dates.length - 1]);
    }
    if (booking.date) return new Date(booking.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return '';
  };

  // Icon row helper
  const IconRow = ({ icon, children, bold, muted }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: muted ? '#9ca3af' : bold ? '#1f2937' : '#6b7280', fontWeight: bold ? 700 : 400 }}>
      <span style={{ flexShrink: 0, width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
    </div>
  );

  // Pill button style (matching status badges)
  const pillButton = (color, bgColor, hoverBg) => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px 12px', borderRadius: '9999px',
    fontSize: '12px', fontWeight: 600,
    backgroundColor: bgColor, color: color,
    border: 'none', cursor: 'pointer',
    transition: 'background-color 0.15s',
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Meine Buchungen</h2>

      {/* Category filter */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-lg">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => handleCategoryChange(cat.id)}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${selectedCategory === cat.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
              {cat.label}
              <span className={`px-2 py-0.5 text-xs rounded-full ${selectedCategory === cat.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>{getBookingCountForCategory(cat.id)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Resource filter */}
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

      {/* Booking list */}
      {groupedBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><List className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>Keine Buchungen</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {groupedBookings.map((booking, idx) => {
            const resource = RESOURCES.find(r => r.id === booking.resourceId);
            const isSeries = booking.dates && booking.dates.length > 1;
            const bookingType = BOOKING_TYPES.find(t => t.id === booking.bookingType);
            const orgInfos = getOrgInfo(booking.userId);
            const primaryOrg = orgInfos && orgInfos.length > 0 ? orgInfos[0] : null;
            const teamTrainers = primaryOrg ? getTeamTrainers(primaryOrg.team.id) : [];
            const userInfo = getUserInfo(booking.userId);

            return (
              <div key={idx} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  {/* Color bar */}
                  <div style={{ width: '6px', flexShrink: 0, backgroundColor: resource?.color || '#ccc' }} />

                  {/* 3 columns */}
                  <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>

                    {/* Col 1: Booking info with icons */}
                    <div style={{ flex: '2 1 0%', padding: '12px 16px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          "{booking.title}"
                        </span>
                        {isSeries && (
                          <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <Repeat style={{ width: '11px', height: '11px' }} />{booking.dates.length}x
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <IconRow icon={<MapPin style={{ width: '14px', height: '14px' }} />}>{resource?.name}</IconRow>
                        <IconRow icon={<Calendar style={{ width: '14px', height: '14px' }} />}>{getWeekday(booking)}</IconRow>
                        <IconRow icon={<Clock style={{ width: '14px', height: '14px' }} />} bold>{booking.startTime} - {booking.endTime}</IconRow>
                        <IconRow icon={<Calendar style={{ width: '14px', height: '14px' }} />} muted>{getDateDisplay(booking)}</IconRow>
                      </div>
                    </div>

                    {/* Col 2: Trainers with header */}
                    <div style={{ flex: '1.2 1 0%', padding: '12px 16px', borderLeft: '1px solid #f3f4f6', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '6px' }}>
                        {'Trainer / ' + String.fromCharCode(220) + 'bungsleiter'}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {teamTrainers.length > 0 ? (
                          teamTrainers.map(t => (
                            <div key={t.id} style={{ fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
                              {t.firstName} {t.lastName}{!t.isPrimary ? ' (Co)' : ''}
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>{userInfo.name}</div>
                        )}
                      </div>
                    </div>

                    {/* Col 3: Org + Type */}
                    <div style={{ flex: '1.2 1 0%', padding: '12px 16px', borderLeft: '1px solid #f3f4f6', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {bookingType && (
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                          {bookingType.icon} {bookingType.label}
                        </div>
                      )}
                      {primaryOrg ? (
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                          <div style={{ fontWeight: 700, color: '#1f2937' }}>{primaryOrg.club?.name}</div>
                          <div style={{ color: '#6b7280' }}>{primaryOrg.dept?.icon} {primaryOrg.dept?.name}</div>
                          <div style={{ color: '#374151' }}>{primaryOrg.team?.name}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: '#9ca3af' }}>{userInfo.name}</div>
                      )}
                    </div>
                  </div>

                  {/* Col 4: Status + Actions */}
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0, borderLeft: '1px solid #f3f4f6' }}>
                    {booking.status === 'approved' && (<span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, backgroundColor: '#22c55e', color: '#fff' }}>Genehmigt</span>)}
                    {booking.status === 'pending' && (<span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, backgroundColor: '#facc15', color: '#1f2937' }}>Ausstehend</span>)}
                    {booking.status === 'rejected' && (<span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, backgroundColor: '#ef4444', color: '#fff' }}>Abgelehnt</span>)}
                    {isAdmin && (
                      <>
                        {deleteConfirm?.id === booking.id ? (
                          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px', fontSize: '12px' }}>
                            <div style={{ color: '#b91c1c', fontWeight: 600, marginBottom: '4px' }}>L{String.fromCharCode(246)}schen?</div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => { onDelete(booking.id, deleteConfirm.type, booking.seriesId); setDeleteConfirm(null); }} style={{ ...pillButton('#fff', '#ef4444'), padding: '3px 10px' }}>Ja</button>
                              <button onClick={() => setDeleteConfirm(null)} style={{ ...pillButton('#374151', '#e5e7eb'), padding: '3px 10px' }}>Nein</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {isSeries ? (
                              <>
                                <button onClick={() => setDeleteConfirm({ id: booking.id, type: 'single' })} style={pillButton('#fff', '#ef4444')}>
                                  <X style={{ width: '12px', height: '12px' }} />1 Termin
                                </button>
                                <button onClick={() => setDeleteConfirm({ id: booking.id, type: 'series' })} style={pillButton('#fff', '#dc2626')}>
                                  <X style={{ width: '12px', height: '12px' }} />Serie
                                </button>
                              </>
                            ) : (
                              <button onClick={() => setDeleteConfirm({ id: booking.id, type: 'single' })} style={pillButton('#fff', '#ef4444')}>
                                <X style={{ width: '12px', height: '12px' }} />L{String.fromCharCode(246)}schen
                              </button>
                            )}
                          </div>
                        )}
                      </>
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
