/**
 * MyBookings – List view of all bookings with filtering and delete actions.
 *
 * Layout (top → bottom):
 *   1. Title
 *   2. Resource group filter tabs (dynamically derived from resourceGroups)
 *   3. Resource sub-filter     (when a specific group is selected)
 *   4. Booking cards           (series grouped)
 */

import React, { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, X, List, Repeat } from 'lucide-react';
import { DAYS_FULL } from '../config/constants';
import { EVENT_TYPES } from '../config/organizationConfig';

// ──────────────────────────────────────────────
//  Sub-components
// ──────────────────────────────────────────────

/** Compact icon + text row used inside booking cards. */
const IconRow = ({ icon, children, bold, muted }) => (
  <div className={`flex items-center gap-1.5 text-[13px] ${
    muted ? 'text-gray-400' : bold ? 'text-gray-800 font-bold' : 'text-gray-500'
  }`}>
    <span className="flex-shrink-0 w-4 flex items-center justify-center text-gray-400">
      {icon}
    </span>
    <span className="truncate">{children}</span>
  </div>
);

/** Status badge pill. */
const StatusBadge = ({ status }) => {
  const cfg = {
    approved: { cls: 'bg-green-500 text-white', label: 'Genehmigt' },
    pending:  { cls: 'bg-yellow-400 text-gray-800', label: 'Ausstehend' },
    rejected: { cls: 'bg-red-500 text-white', label: 'Abgelehnt' },
  }[status];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ──────────────────────────────────────────────
//  Component
// ──────────────────────────────────────────────

const MyBookings = ({
  bookings, isAdmin, onDelete, users, resources, resourceGroups,
  clubs, departments, teams, trainerAssignments,
}) => {
  // ── Local state ────────────────────────────
  const [selectedGroupId, setSelectedGroupId]   = useState('all');
  const [selectedResource, setSelectedResource] = useState('all');
  const [deleteConfirm, setDeleteConfirm]       = useState(null);

  // ── Dynamic group tabs ──
  const groupTabs = useMemo(() => {
    if (!resourceGroups || resourceGroups.length === 0) return [];
    return resourceGroups
      .slice()
      .sort((a, b) => {
        if (a.facilityId < b.facilityId) return -1;
        if (a.facilityId > b.facilityId) return 1;
        return a.sortOrder - b.sortOrder;
      });
  }, [resourceGroups]);

  // ── Resources for the selected group ──
  const groupResources = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    return resources.filter(r => r.groupId === selectedGroupId);
  }, [selectedGroupId, resources]);

  // ── Filtered bookings ──
  const filteredBookings = useMemo(() => {
    if (selectedGroupId === 'all') return bookings;
    const groupResIds = resources.filter(r => r.groupId === selectedGroupId).map(r => r.id);
    let filtered = bookings.filter(b => groupResIds.includes(b.resourceId));
    if (selectedResource !== 'all') {
      filtered = filtered.filter(b => b.resourceId === selectedResource);
    }
    return filtered;
  }, [bookings, selectedGroupId, selectedResource, resources]);

  // ── Group series bookings together ──
  const groupedBookings = useMemo(() => {
    const seriesMap = {};
    const singles = [];
    filteredBookings.forEach(b => {
      if (b.seriesId) {
        if (!seriesMap[b.seriesId]) {
          seriesMap[b.seriesId] = { ...b, dates: [] };
        }
        seriesMap[b.seriesId].dates.push(b.date);
      } else {
        singles.push(b);
      }
    });
    Object.values(seriesMap).forEach(s => s.dates.sort());
    return [...Object.values(seriesMap), ...singles];
  }, [filteredBookings]);

  // ── Tab change handler ──
  const handleGroupChange = (groupId) => {
    setSelectedGroupId(groupId);
    setSelectedResource('all');
  };

  // ── Booking count helpers ──
  const getBookingCountForGroup = (groupId) => {
    const resIds = resources.filter(r => r.groupId === groupId).map(r => r.id);
    return bookings.filter(b => resIds.includes(b.resourceId)).length;
  };

  const getBookingCountForResource = (resId) =>
    bookings.filter(b => b.resourceId === resId).length;

  // ── Organisation / trainer lookup helpers ──
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

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unbekannt';
  };

  // ── Date / weekday display helpers ──
  const getWeekday = (booking) => {
    const isSeries = booking.dates && booking.dates.length > 1;
    const dateStr = isSeries ? booking.dates[0] : booking.date;
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isSeries ? ('Jeden ' + DAYS_FULL[d.getDay()]) : DAYS_FULL[d.getDay()];
  };

  const getDateDisplay = (booking) => {
    const fmt = (s) => new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const isSeries = booking.dates && booking.dates.length > 1;
    if (isSeries) {
      return fmt(booking.dates[0]) + ' – ' + fmt(booking.dates[booking.dates.length - 1]);
    }
    return booking.date ? fmt(booking.date) : '';
  };

  // ══════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Meine Buchungen</h2>

      {/* ── 1. Resource group filter tabs ── */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-lg">
          <button
            onClick={() => handleGroupChange('all')}
            className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
              selectedGroupId === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Alle Buchungen
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              selectedGroupId === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {bookings.length}
            </span>
          </button>

          {groupTabs.map(group => (
            <button
              key={group.id}
              onClick={() => handleGroupChange(group.id)}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedGroupId === group.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {group.name}
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                selectedGroupId === group.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {getBookingCountForGroup(group.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Resource sub-filter ── */}
      {selectedGroupId !== 'all' && groupResources.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setSelectedResource('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                selectedResource === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Alle
            </button>
            {groupResources.map(res => (
              <button
                key={res.id}
                onClick={() => setSelectedResource(res.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-all flex items-center gap-1.5 ${
                  selectedResource === res.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={selectedResource === res.id ? { borderLeft: `3px solid ${res.color}` } : {}}
              >
                {res.name}
                {getBookingCountForResource(res.id) > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {getBookingCountForResource(res.id)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Booking cards ── */}
      {groupedBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <List className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Keine Buchungen</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groupedBookings.map((booking, idx) => {
            const resource      = resources.find(r => r.id === booking.resourceId);
            const isSeries      = booking.dates && booking.dates.length > 1;
            const bookingType   = EVENT_TYPES.find(t => t.id === booking.bookingType);
            const orgInfos      = getOrgInfo(booking.userId);
            const primaryOrg    = orgInfos && orgInfos.length > 0 ? orgInfos[0] : null;
            const teamTrainers  = primaryOrg ? getTeamTrainers(primaryOrg.team.id) : [];
            const userName      = getUserName(booking.userId);

            return (
              <div key={booking.seriesId || booking.id || idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-stretch">
                  {/* Color bar */}
                  <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: resource?.color || '#ccc' }} />

                  <div className="flex flex-1 min-w-0">

                    {/* Col 1: Booking info */}
                    <div className="flex-[2] p-3 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-[15px] text-gray-900 truncate">
                          "{booking.title}"
                        </span>
                        {isSeries && (
                          <span className="text-[11px] text-blue-600 font-semibold flex-shrink-0 inline-flex items-center gap-0.5">
                            <Repeat className="w-3 h-3" />{booking.dates.length}x
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <IconRow icon={<MapPin className="w-3.5 h-3.5" />}>{resource?.name}</IconRow>
                        <IconRow icon={<Calendar className="w-3.5 h-3.5" />}>{getWeekday(booking)}</IconRow>
                        <IconRow icon={<Clock className="w-3.5 h-3.5" />} bold>{booking.startTime} - {booking.endTime}</IconRow>
                        <IconRow icon={<Calendar className="w-3.5 h-3.5" />} muted>{getDateDisplay(booking)}</IconRow>
                      </div>
                    </div>

                    {/* Col 2: Trainers */}
                    <div className="flex-[1.2] p-3 border-l border-gray-100 min-w-0 flex flex-col">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Trainer / Übungsleiter
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        {teamTrainers.length > 0 ? (
                          teamTrainers.map(t => (
                            <div key={t.id} className="text-[13px] text-gray-700 leading-7">
                              {t.firstName} {t.lastName}{!t.isPrimary ? ' (Co)' : ''}
                            </div>
                          ))
                        ) : (
                          <div className="text-[13px] text-gray-500">{userName}</div>
                        )}
                      </div>
                    </div>

                    {/* Col 3: Org + booking type */}
                    <div className="flex-[1.2] p-3 border-l border-gray-100 min-w-0 flex flex-col justify-center">
                      {bookingType && (
                        <div className="text-[13px] font-semibold text-gray-700 mb-1.5">
                          {bookingType.icon} {bookingType.label}
                        </div>
                      )}
                      {primaryOrg ? (
                        <div className="text-[13px] leading-relaxed">
                          <div className="font-bold text-gray-800">{primaryOrg.club?.name}</div>
                          <div className="text-gray-500">{primaryOrg.dept?.icon} {primaryOrg.dept?.name}</div>
                          <div className="text-gray-700">{primaryOrg.team?.name}</div>
                        </div>
                      ) : (
                        <div className="text-[13px] text-gray-400">{userName}</div>
                      )}
                    </div>
                  </div>

                  {/* Col 4: Status + delete actions */}
                  <div className="p-3 flex flex-col items-end gap-2 flex-shrink-0 border-l border-gray-100">
                    <StatusBadge status={booking.status} />

                    {/* Delete actions (admin only) */}
                    {isAdmin && (
                      <>
                        {deleteConfirm?.id === booking.id ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs">
                            <div className="text-red-700 font-semibold mb-1">Löschen?</div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => { onDelete(booking.id, deleteConfirm.type, booking.seriesId); setDeleteConfirm(null); }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                              >
                                Ja
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer"
                              >
                                Nein
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {isSeries ? (
                              <>
                                <button
                                  onClick={() => setDeleteConfirm({ id: booking.id, type: 'single' })}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                                >
                                  <X className="w-3 h-3" />1 Termin
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ id: booking.id, type: 'series' })}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                                >
                                  <X className="w-3 h-3" />Serie
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm({ id: booking.id, type: 'single' })}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />Löschen
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
