/**
 * MyBookings – List view of all bookings with filtering and delete actions.
 *
 * Layout (top → bottom):
 *   1. Title
 *   2. Resource group filter tabs (dynamically derived from resourceGroups)
 *   3. Resource sub-filter     (when a specific group is selected)
 *   4. Booking cards           (series grouped, 4-column layout)
 *
 * Each booking card shows:
 *   Col 1: Title, resource, weekday, time, date range
 *   Col 2: Trainer(s) / requester
 *   Col 3: Booking type + organisation hierarchy (Club → Dept → Team)
 *   Col 4: Status badge + delete actions (admin only)
 *
 * Props:
 *   bookings            - Array of booking objects
 *   isAdmin             - Whether the current user has admin rights
 *   onDelete            - Callback(bookingId, deleteType, seriesId)
 *   users               - Array of user objects
 *   resources           - Legacy flat resource array (with groupId from buildLegacyResources)
 *   resourceGroups      - Array of resource group objects
 *   clubs               - Array of club objects
 *   departments         - Array of department objects
 *   teams               - Array of team objects
 *   trainerAssignments  - Array of trainer assignment objects
 */

import React, { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, X, List, Repeat } from 'lucide-react';
import { BOOKING_TYPES, DAYS_FULL } from '../config/constants';

// ──────────────────────────────────────────────
//  Display constants
// ──────────────────────────────────────────────
const ENDASH = '\u2013';

// ──────────────────────────────────────────────
//  Inline style helpers
// ──────────────────────────────────────────────

/** Generate a pill-button style object for delete/confirm buttons. */
const pillButtonStyle = (color, bgColor) => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '4px 12px', borderRadius: '9999px',
  fontSize: '12px', fontWeight: 600,
  backgroundColor: bgColor, color,
  border: 'none', cursor: 'pointer',
  transition: 'background-color 0.15s',
});

/** Compact icon + text row used inside booking cards. */
const IconRow = ({ icon, children, bold, muted }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px',
    color: muted ? '#9ca3af' : bold ? '#1f2937' : '#6b7280',
    fontWeight: bold ? 700 : 400,
  }}>
    <span style={{ flexShrink: 0, width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
      {icon}
    </span>
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  </div>
);

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

  // ── Dynamic group tabs (derived from resourceGroups prop) ──
  const groupTabs = useMemo(() => {
    if (!resourceGroups || resourceGroups.length === 0) return [];
    return resourceGroups
      .slice()
      .sort((a, b) => {
        // Sort by facilityId first (to keep facility grouping), then sortOrder
        if (a.facilityId < b.facilityId) return -1;
        if (a.facilityId > b.facilityId) return 1;
        return a.sortOrder - b.sortOrder;
      });
  }, [resourceGroups]);

  // ── Resources for the selected group (via groupId) ──
  const groupResources = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    return resources.filter(r => r.groupId === selectedGroupId);
  }, [selectedGroupId, resources]);

  // ── Filtered bookings ────────────────────────
  const filteredBookings = useMemo(() => {
    if (selectedGroupId === 'all') return bookings;
    const groupResIds = resources.filter(r => r.groupId === selectedGroupId).map(r => r.id);
    let filtered = bookings.filter(b => groupResIds.includes(b.resourceId));
    if (selectedResource !== 'all') {
      filtered = filtered.filter(b => b.resourceId === selectedResource);
    }
    return filtered;
  }, [bookings, selectedGroupId, selectedResource, resources]);

  // ── Group series bookings together ─────────────
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
    // Sort series dates chronologically
    Object.values(seriesMap).forEach(s => s.dates.sort());
    return [...Object.values(seriesMap), ...singles];
  }, [filteredBookings]);

  // ── Tab change handler ───────────────────────
  const handleGroupChange = (groupId) => {
    setSelectedGroupId(groupId);
    setSelectedResource('all');
  };

  // ── Booking count helpers ────────────────────

  /** Count bookings across all resources in a group. */
  const getBookingCountForGroup = (groupId) => {
    const resIds = resources.filter(r => r.groupId === groupId).map(r => r.id);
    return bookings.filter(b => resIds.includes(b.resourceId)).length;
  };

  /** Count bookings for a single resource. */
  const getBookingCountForResource = (resId) =>
    bookings.filter(b => b.resourceId === resId).length;

  // ── Organisation / trainer lookup helpers ────

  /**
   * Resolve a userId to their organisational context(s).
   * Returns an array of { team, dept, club, isPrimary } or null.
   */
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

  /** Get all trainers assigned to a team, sorted primary-first. */
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

  /** Resolve userId → display name. */
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unbekannt';
  };

  // ── Date / weekday display helpers ─────────────

  /** Return weekday string, e.g. "Montag" or "Jeden Montag" for series. */
  const getWeekday = (booking) => {
    const isSeries = booking.dates && booking.dates.length > 1;
    const dateStr = isSeries ? booking.dates[0] : booking.date;
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isSeries ? ('Jeden ' + DAYS_FULL[d.getDay()]) : DAYS_FULL[d.getDay()];
  };

  /** Return formatted date or date range for display. */
  const getDateDisplay = (booking) => {
    const fmt = (s) => new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const isSeries = booking.dates && booking.dates.length > 1;
    if (isSeries) {
      return fmt(booking.dates[0]) + ' ' + ENDASH + ' ' + fmt(booking.dates[booking.dates.length - 1]);
    }
    return booking.date ? fmt(booking.date) : '';
  };

  // ══════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Meine Buchungen</h2>

      {/* ── 1. Resource group filter tabs (dynamic) ── */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-lg">
          {/* "Alle" tab */}
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

          {/* Dynamic group tabs */}
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

      {/* ── 2. Resource sub-filter (when a group is selected) ── */}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {groupedBookings.map((booking, idx) => {
            const resource      = resources.find(r => r.id === booking.resourceId);
            const isSeries      = booking.dates && booking.dates.length > 1;
            const bookingType   = BOOKING_TYPES.find(t => t.id === booking.bookingType);
            const orgInfos      = getOrgInfo(booking.userId);
            const primaryOrg    = orgInfos && orgInfos.length > 0 ? orgInfos[0] : null;
            const teamTrainers  = primaryOrg ? getTeamTrainers(primaryOrg.team.id) : [];
            const userName      = getUserName(booking.userId);

            return (
              <div key={booking.seriesId || booking.id || idx} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  {/* Color bar */}
                  <div style={{ width: '6px', flexShrink: 0, backgroundColor: resource?.color || '#ccc' }} />

                  <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>

                    {/* Col 1: Booking info */}
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

                    {/* Col 2: Trainers */}
                    <div style={{ flex: '1.2 1 0%', padding: '12px 16px', borderLeft: '1px solid #f3f4f6', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '6px' }}>
                        Trainer / \u00dcbungsleiter
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {teamTrainers.length > 0 ? (
                          teamTrainers.map(t => (
                            <div key={t.id} style={{ fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
                              {t.firstName} {t.lastName}{!t.isPrimary ? ' (Co)' : ''}
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>{userName}</div>
                        )}
                      </div>
                    </div>

                    {/* Col 3: Org + booking type */}
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
                        <div style={{ fontSize: '13px', color: '#9ca3af' }}>{userName}</div>
                      )}
                    </div>
                  </div>

                  {/* Col 4: Status + delete actions */}
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0, borderLeft: '1px solid #f3f4f6' }}>
                    {/* Status badge */}
                    {booking.status === 'approved' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, backgroundColor: '#22c55e', color: '#fff' }}>
                        Genehmigt
                      </span>
                    )}
                    {booking.status === 'pending' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, backgroundColor: '#facc15', color: '#1f2937' }}>
                        Ausstehend
                      </span>
                    )}
                    {booking.status === 'rejected' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, backgroundColor: '#ef4444', color: '#fff' }}>
                        Abgelehnt
                      </span>
                    )}

                    {/* Delete actions (admin only) */}
                    {isAdmin && (
                      <>
                        {deleteConfirm?.id === booking.id ? (
                          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px', fontSize: '12px' }}>
                            <div style={{ color: '#b91c1c', fontWeight: 600, marginBottom: '4px' }}>L\u00f6schen?</div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => { onDelete(booking.id, deleteConfirm.type, booking.seriesId); setDeleteConfirm(null); }}
                                style={{ ...pillButtonStyle('#fff', '#ef4444'), padding: '3px 10px' }}
                              >
                                Ja
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{ ...pillButtonStyle('#374151', '#e5e7eb'), padding: '3px 10px' }}
                              >
                                Nein
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {isSeries ? (
                              <>
                                <button
                                  onClick={() => setDeleteConfirm({ id: booking.id, type: 'single' })}
                                  style={pillButtonStyle('#fff', '#ef4444')}
                                >
                                  <X style={{ width: '12px', height: '12px' }} />1 Termin
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ id: booking.id, type: 'series' })}
                                  style={pillButtonStyle('#fff', '#dc2626')}
                                >
                                  <X style={{ width: '12px', height: '12px' }} />Serie
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm({ id: booking.id, type: 'single' })}
                                style={pillButtonStyle('#fff', '#ef4444')}
                              >
                                <X style={{ width: '12px', height: '12px' }} />L\u00f6schen
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
