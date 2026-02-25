/**
 * MyBookings – List view of all bookings with filtering and delete actions.
 *
 * Layout (top → bottom):
 *   1. Title
 *   2. Resource group filter tabs (dynamically derived from resourceGroups)
 *   3. Resource sub-filter     (when a specific group is selected)
 *   4. Booking cards           (series grouped as expandable containers)
 */

import React, { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, X, List, Repeat, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Pencil } from 'lucide-react';
import { DAYS_FULL } from '../config/constants';
import { EVENT_TYPES } from '../config/organizationConfig';
import { findConflicts } from '../utils/helpers';

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
  bookings, isAdmin, onDelete, onEdit, users, resources, resourceGroups,
  clubs, departments, teams, trainerAssignments,
}) => {
  // ── Local state ────────────────────────────
  const [selectedGroupId, setSelectedGroupId]   = useState('all');
  const [selectedResource, setSelectedResource] = useState('all');
  const [deleteConfirm, setDeleteConfirm]       = useState(null);
  const [expandedSeries, setExpandedSeries]     = useState({});

  const toggleSeries = (seriesId) =>
    setExpandedSeries(prev => ({ ...prev, [seriesId]: !prev[seriesId] }));

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

  // ── Group series bookings together with conflict info ──
  const groupedBookings = useMemo(() => {
    const seriesMap = {};
    const singles = [];
    filteredBookings.forEach(b => {
      if (b.seriesId) {
        if (!seriesMap[b.seriesId]) {
          seriesMap[b.seriesId] = { ...b, seriesBookings: [] };
        }
        const conflicts = findConflicts(b, bookings);
        seriesMap[b.seriesId].seriesBookings.push({ ...b, conflicts });
      } else {
        singles.push(b);
      }
    });
    // Sort each series' bookings by date
    Object.values(seriesMap).forEach(s => {
      s.seriesBookings.sort((a, b) => a.date.localeCompare(b.date));
      s.totalCount = s.seriesBookings.length;
      s.freeCount = s.seriesBookings.filter(sb => sb.conflicts.length === 0).length;
      s.blockedCount = s.seriesBookings.filter(sb => sb.conflicts.length > 0).length;
    });
    return [...Object.values(seriesMap), ...singles];
  }, [filteredBookings, bookings]);

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
  const fmtDate = (s) => new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fmtDateShort = (s) => new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

  const getWeekday = (booking) => {
    const isSeries = booking.seriesBookings && booking.seriesBookings.length > 1;
    const dateStr = isSeries ? booking.seriesBookings[0].date : booking.date;
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isSeries ? ('Jeden ' + DAYS_FULL[d.getDay()]) : DAYS_FULL[d.getDay()];
  };

  const getDateDisplay = (booking) => {
    const isSeries = booking.seriesBookings && booking.seriesBookings.length > 1;
    if (isSeries) {
      const dates = booking.seriesBookings;
      return fmtDate(dates[0].date) + ' – ' + fmtDate(dates[dates.length - 1].date);
    }
    return booking.date ? fmtDate(booking.date) : '';
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
            const isSeries      = booking.seriesBookings && booking.seriesBookings.length > 1;
            const bookingType   = EVENT_TYPES.find(t => t.id === booking.bookingType);
            const orgInfos      = getOrgInfo(booking.userId);
            const primaryOrg    = orgInfos && orgInfos.length > 0 ? orgInfos[0] : null;
            const teamTrainers  = primaryOrg ? getTeamTrainers(primaryOrg.team.id) : [];
            const userName      = getUserName(booking.userId);
            const isExpanded    = isSeries && expandedSeries[booking.seriesId];

            return (
              <div key={booking.seriesId || booking.id || idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-stretch">
                  {/* Color bar */}
                  <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: resource?.color || '#ccc' }} />

                  <div className="flex flex-1 min-w-0">

                    {/* Col 1: Booking info */}
                    <div className="flex-[2] p-3 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {/* Expand/collapse toggle for series */}
                        {isSeries && (
                          <button
                            onClick={() => toggleSeries(booking.seriesId)}
                            className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {isExpanded
                              ? <ChevronDown className="w-4 h-4" />
                              : <ChevronRight className="w-4 h-4" />
                            }
                          </button>
                        )}
                        <span className="font-bold text-[15px] text-gray-900 truncate">
                          "{booking.title}"
                        </span>
                        {isSeries && (
                          <span className="text-[11px] text-blue-600 font-semibold flex-shrink-0 inline-flex items-center gap-0.5">
                            <Repeat className="w-3 h-3" />{booking.totalCount}x
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <IconRow icon={<MapPin className="w-3.5 h-3.5" />}>{resource?.name}</IconRow>
                        <IconRow icon={<Calendar className="w-3.5 h-3.5" />}>{getWeekday(booking)}</IconRow>
                        <IconRow icon={<Clock className="w-3.5 h-3.5" />} bold>{booking.startTime} - {booking.endTime}</IconRow>
                        <IconRow icon={<Calendar className="w-3.5 h-3.5" />} muted>{getDateDisplay(booking)}</IconRow>
                      </div>
                      {/* Conflict summary for series */}
                      {isSeries && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />{booking.freeCount} frei
                          </span>
                          {booking.blockedCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />{booking.blockedCount} Konflikt{booking.blockedCount !== 1 ? 'e' : ''}
                            </span>
                          )}
                        </div>
                      )}
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

                  {/* Col 4: Status + edit/delete actions */}
                  <div className="p-3 flex flex-col items-end gap-2 flex-shrink-0 border-l border-gray-100">
                    <StatusBadge status={booking.status} />

                    {/* Edit button */}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(booking)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />Bearbeiten
                      </button>
                    )}

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

                {/* ── Expanded series detail rows ── */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="px-4 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Einzeltermine ({booking.totalCount})
                      </div>
                      <div className="space-y-1">
                        {booking.seriesBookings.map(sb => {
                          const hasConflict = sb.conflicts.length > 0;
                          const dayName = DAYS_FULL[new Date(sb.date).getDay()];
                          return (
                            <div
                              key={sb.id}
                              className={`flex items-center gap-3 px-3 py-1.5 rounded text-[13px] ${
                                hasConflict ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-100'
                              }`}
                            >
                              {hasConflict
                                ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                : <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                              }
                              <span className="text-gray-500 w-6">{dayName.substring(0, 2)}</span>
                              <span className="font-medium text-gray-800">{fmtDateShort(sb.date)}</span>
                              <span className="text-gray-500">{sb.startTime} - {sb.endTime}</span>
                              <StatusBadge status={sb.status} />
                              {hasConflict && (
                                <span className="text-[11px] text-amber-700 ml-auto truncate">
                                  {sb.conflicts.map(c => `"${c.title}" ${c.startTime}-${c.endTime}`).join(', ')}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
