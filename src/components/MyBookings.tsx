/**
 * MyBookings – List view of all bookings with filtering and delete actions.
 */

import React, { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, X, List, Repeat, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, BookMarked, Building2 } from 'lucide-react';
import { DAYS_FULL } from '../config/constants';
import { EVENT_TYPES } from '../config/organizationConfig';
import { findConflicts } from '../utils/helpers';
import { useConfirm } from '../hooks/useConfirm';
import StatusBadge from './ui/StatusBadge';
import EmptyState from './ui/EmptyState';
import { useBookingContext } from '../contexts/BookingContext';
import { useFacility } from '../contexts/FacilityContext';
import { useUserContext } from '../contexts/UserContext';
import { useOrg } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';
import type { Booking, User, Team, Department, Club } from '../types';

// ──────────────────────────────────────────────
//  Sub-components
// ──────────────────────────────────────────────

interface IconRowProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  bold?: boolean;
  muted?: boolean;
}

const IconRow: React.FC<IconRowProps> = ({ icon, children, bold, muted }) => (
  <div className={`flex items-center gap-1.5 text-[13px] ${
    muted ? 'text-gray-400' : bold ? 'text-gray-800 font-bold' : 'text-gray-500'
  }`}>
    <span className="flex-shrink-0 w-4 flex items-center justify-center text-gray-400">
      {icon}
    </span>
    <span className="truncate">{children}</span>
  </div>
);

const btnBase   = 'inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer w-full';
const btnEdit   = `${btnBase} bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200`;
const btnDanger = `${btnBase} bg-red-600 text-white hover:bg-red-700`;

// ──────────────────────────────────────────────
//  Types
// ──────────────────────────────────────────────

interface OrgInfo {
  team: Team;
  dept: Department | undefined;
  club: Club | undefined;
  isPrimary?: boolean;
}

interface BookingWithSeries extends Booking {
  seriesBookings?: (Booking & { conflicts: Booking[] })[];
  totalCount?: number;
  freeCount?: number;
  blockedCount?: number;
}

interface MyBookingsProps {
  onDelete: (id: string, mode: 'single' | 'series', seriesId: string | null) => void;
  onEdit?: (booking: BookingWithSeries) => void;
}

// ──────────────────────────────────────────────
//  Component
// ──────────────────────────────────────────────

const MyBookings: React.FC<MyBookingsProps> = ({ onDelete, onEdit }) => {
  const { isAdmin } = useAuth();
  const { bookings } = useBookingContext();
  const { RESOURCES: resources, resourceGroups, facilities } = useFacility();
  const { users } = useUserContext();
  const { clubs, departments, teams, trainerAssignments } = useOrg();
  // ── Local state ────────────────────────────
  const [selectedFacilityId, setSelectedFacilityId] = useState('all');
  const [selectedGroupId, setSelectedGroupId]       = useState('all');
  const [selectedResource, setSelectedResource]     = useState('all');
  const [expandedSeries, setExpandedSeries]     = useState<Record<string, boolean>>({});
  const [confirm, ConfirmDialogEl]              = useConfirm();

  const toggleSeries = (seriesId: string) =>
    setExpandedSeries(prev => ({ ...prev, [seriesId]: !prev[seriesId] }));

  // ── Delete handlers (mit Bestätigungs-Dialog) ──
  const handleDeleteSeries = async (booking: BookingWithSeries) => {
    const ok = await confirm({
      title: 'Serie löschen',
      message: `Alle ${booking.totalCount} Termine dieser Serie wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      confirmLabel: 'Serie löschen',
      cancelLabel: 'Abbrechen',
      variant: 'danger',
    });
    if (ok) onDelete(booking.id, 'series', booking.seriesId || null);
  };

  const handleDeleteSingle = async (booking: Booking) => {
    const ok = await confirm({
      title: 'Termin löschen',
      message: 'Diesen Termin wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      confirmLabel: 'Löschen',
      cancelLabel: 'Abbrechen',
      variant: 'danger',
    });
    if (ok) onDelete(booking.id, 'single', null);
  };

  const handleDeleteSingleInSeries = async (sb: Booking) => {
    const ok = await confirm({
      title: 'Einzeltermin löschen',
      message: `Termin vom ${fmtDate(sb.date)} (${sb.startTime} – ${sb.endTime}) wirklich löschen?`,
      confirmLabel: 'Löschen',
      cancelLabel: 'Abbrechen',
      variant: 'danger',
    });
    if (ok) onDelete(sb.id, 'single', null);
  };

  // ── Gruppen für Dropdown 2 (gefiltert nach Anlage) ──
  const groupsForDropdown = useMemo(() => {
    if (!resourceGroups) return [];
    const groups = selectedFacilityId === 'all'
      ? resourceGroups
      : resourceGroups.filter(g => g.facilityId === selectedFacilityId);
    return groups.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [resourceGroups, selectedFacilityId]);

  // ── Resources for the selected group ──
  const groupResources = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    return resources.filter(r => r.groupId === selectedGroupId);
  }, [selectedGroupId, resources]);

  // ── Visible bookings (exclude auto-generated sub-resource blockers) ──
  const visibleBookings = useMemo(() =>
    bookings.filter(b => !b.parentBooking),
    [bookings]
  );

  // ── Filtered bookings ──
  const filteredBookings = useMemo(() => {
    let result = visibleBookings;
    if (selectedFacilityId !== 'all') {
      const facGroupIds = (resourceGroups || []).filter(g => g.facilityId === selectedFacilityId).map(g => g.id);
      const facResIds = resources.filter(r => facGroupIds.includes(r.groupId)).map(r => r.id);
      result = result.filter(b => facResIds.includes(b.resourceId));
    }
    if (selectedGroupId !== 'all') {
      const groupResIds = resources.filter(r => r.groupId === selectedGroupId).map(r => r.id);
      result = result.filter(b => groupResIds.includes(b.resourceId));
    }
    if (selectedResource !== 'all') {
      result = result.filter(b => b.resourceId === selectedResource);
    }
    return result;
  }, [visibleBookings, selectedFacilityId, selectedGroupId, selectedResource, resources, resourceGroups]);

  // ── Group series bookings together with conflict info ──
  const groupedBookings = useMemo(() => {
    const seriesMap: Record<string, BookingWithSeries> = {};
    const singles: Booking[] = [];
    filteredBookings.forEach(b => {
      if (b.seriesId) {
        if (!seriesMap[b.seriesId]) {
          seriesMap[b.seriesId] = { ...b, seriesBookings: [] };
        }
        const conflicts = findConflicts(b, bookings);
        seriesMap[b.seriesId].seriesBookings!.push({ ...b, conflicts });
      } else {
        singles.push(b);
      }
    });
    Object.values(seriesMap).forEach(s => {
      s.seriesBookings!.sort((a, b) => a.date.localeCompare(b.date));
      s.totalCount = s.seriesBookings!.length;
      s.freeCount = s.seriesBookings!.filter(sb => sb.conflicts.length === 0).length;
      s.blockedCount = s.seriesBookings!.filter(sb => sb.conflicts.length > 0).length;
    });
    return [...Object.values(seriesMap), ...singles]
      .sort((a, b) => (a.title || '').localeCompare(b.title || '', 'de'));
  }, [filteredBookings, bookings]);

  // ── Dropdown change handlers ──
  const handleFacilityChange = (facId: string) => {
    setSelectedFacilityId(facId);
    setSelectedGroupId('all');
    setSelectedResource('all');
  };

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedResource('all');
  };

  const getBookingCountForResource = (resId: string) =>
    visibleBookings.filter(b => b.resourceId === resId).length;

  // ── Organisation / trainer lookup helpers ──
  const getOrgInfo = (booking: Booking): OrgInfo[] | null => {
    if (!teams || !departments || !clubs) return null;
    if (booking.teamId) {
      const team = teams.find(t => t.id === booking.teamId);
      if (team) {
        const dept = departments.find(d => d.id === team.departmentId);
        const club = dept ? clubs.find(c => c.id === dept.clubId) : undefined;
        return [{ team, dept, club }];
      }
    }
    if (!trainerAssignments) return null;
    const assignments = trainerAssignments.filter(ta => ta.userId === booking.userId);
    if (assignments.length === 0) return null;
    return assignments.map(ta => {
      const team = teams.find(t => t.id === ta.teamId);
      if (!team) return null;
      const dept = departments.find(d => d.id === team.departmentId);
      const club = dept ? clubs.find(c => c.id === dept.clubId) : undefined;
      return { team, dept, club, isPrimary: ta.isPrimary };
    }).filter(Boolean) as OrgInfo[];
  };

  const getTeamTrainers = (teamId: string) => {
    if (!trainerAssignments || !users) return [];
    return trainerAssignments
      .filter(ta => ta.teamId === teamId)
      .map(ta => {
        const user = users.find(u => u.id === ta.userId);
        return user ? { ...user, isPrimary: ta.isPrimary } : null;
      })
      .filter(Boolean) as (User & { isPrimary: boolean })[];
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unbekannt';
  };

  // ── Date / weekday display helpers ──
  const fmtDate = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fmtDateShort = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

  const getWeekday = (booking: BookingWithSeries) => {
    const isSeries = booking.seriesBookings && booking.seriesBookings.length > 1;
    const dateStr = isSeries ? booking.seriesBookings![0].date : booking.date;
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return isSeries ? ('Jeden ' + DAYS_FULL[d.getDay()]) : DAYS_FULL[d.getDay()];
  };

  const getDateDisplay = (booking: BookingWithSeries) => {
    const isSeries = booking.seriesBookings && booking.seriesBookings.length > 1;
    if (isSeries) {
      const dates = booking.seriesBookings!;
      return fmtDate(dates[0].date) + ' – ' + fmtDate(dates[dates.length - 1].date);
    }
    return booking.date ? fmtDate(booking.date) : '';
  };

  // ══════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════

  return (
    <div>
      {ConfirmDialogEl}
      {/* ── Titel + Anlage + Ressourcengruppe ── */}
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-shrink-0">
          <BookMarked className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Buchungsübersicht</h2>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={selectedFacilityId}
            onChange={e => handleFacilityChange(e.target.value)}
            className="px-3 py-1.5 text-sm font-semibold bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Alle Anlagen</option>
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
            className="px-3 py-1.5 text-sm font-semibold bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Alle Gruppen</option>
            {groupsForDropdown.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
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
        <EmptyState icon={List} title="Keine Buchungen" />
      ) : (
        <div className="flex flex-col gap-3">
          {groupedBookings.map((booking, idx) => {
            const resource      = resources.find(r => r.id === booking.resourceId);
            const isSeries      = !!(booking as BookingWithSeries).seriesBookings && (booking as BookingWithSeries).seriesBookings!.length > 1;
            const bookingType   = EVENT_TYPES.find(t => t.id === booking.bookingType);
            const orgInfos      = getOrgInfo(booking);
            const primaryOrg    = orgInfos && orgInfos.length > 0 ? orgInfos[0] : null;
            const teamTrainersList = primaryOrg ? getTeamTrainers(primaryOrg.team.id) : [];
            const userName      = getUserName(booking.userId);
            const isExpanded    = isSeries && expandedSeries[booking.seriesId || ''];

            const team      = teams?.find(t => t.id === booking.teamId);
            const cardColor = team?.color || resource?.color || '#ccc';

            const bws = booking as BookingWithSeries;

            return (
              <div key={booking.seriesId || booking.id || idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-stretch">
                  <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: cardColor }} />

                  <div className="flex flex-1 min-w-0">

                    {/* Col 1: Booking info */}
                    <div className="flex-[2] p-3 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-[15px] text-gray-900 truncate">
                          {booking.title}
                        </span>
                        {isSeries && (
                          <>
                            <span className="text-[11px] text-blue-600 font-semibold flex-shrink-0 inline-flex items-center gap-0.5">
                              <Repeat className="w-3 h-3" />{bws.totalCount}x
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">
                              <CheckCircle className="w-3 h-3" />{bws.freeCount} frei
                            </span>
                            {(bws.blockedCount || 0) > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                                <AlertTriangle className="w-3 h-3" />{bws.blockedCount} Konflikt{bws.blockedCount !== 1 ? 'e' : ''}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <IconRow icon={<MapPin className="w-3.5 h-3.5" />}>{resource?.name}</IconRow>
                        <IconRow icon={<Calendar className="w-3.5 h-3.5" />}>{getWeekday(bws)}</IconRow>
                        <IconRow icon={<Clock className="w-3.5 h-3.5" />} bold>{booking.startTime} - {booking.endTime}</IconRow>
                        <IconRow icon={<Calendar className="w-3.5 h-3.5" />} muted>{getDateDisplay(bws)}</IconRow>
                      </div>
                      {isSeries && (
                        <button
                          onClick={() => toggleSeries(booking.seriesId || '')}
                          className="flex items-center gap-1 mt-2 text-[12px] text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {isExpanded
                            ? <ChevronDown className="w-3.5 h-3.5" />
                            : <ChevronRight className="w-3.5 h-3.5" />
                          }
                          Termine
                        </button>
                      )}
                    </div>

                    {/* Col 2: Trainers */}
                    <div className="flex-[1.2] p-3 border-l border-gray-100 min-w-0 flex flex-col justify-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Trainer / Übungsleiter
                      </div>
                      {teamTrainersList.length > 0 ? (
                        teamTrainersList.map(t => (
                          <div key={t.id} className="text-[13px] text-gray-700 leading-5">
                            {t.firstName} {t.lastName}{!t.isPrimary ? ' (Co)' : ''}
                          </div>
                        ))
                      ) : (
                        <div className="text-[13px] text-gray-500">{userName}</div>
                      )}
                    </div>

                    {/* Col 3: Org + booking type */}
                    <div className="flex-[1.2] p-3 border-l border-gray-100 min-w-0 flex flex-col justify-center">
                      {bookingType && (
                        <div className="text-[13px] font-semibold text-gray-700 mb-1.5">
                          {bookingType.label}
                        </div>
                      )}
                      {primaryOrg ? (
                        <div className="text-[13px] leading-relaxed">
                          <div className="font-bold text-gray-800">{primaryOrg.club?.name}</div>
                          <div className="text-gray-500">{primaryOrg.dept?.name}</div>
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

                    {onEdit && (
                      <button onClick={() => onEdit(bws)} className={btnEdit}>
                        Bearbeiten
                      </button>
                    )}

                    {isAdmin && (
                      isSeries ? (
                        <button onClick={() => handleDeleteSeries(bws)} className={btnDanger}>
                          <X className="w-3 h-3" />Serie
                        </button>
                      ) : (
                        <button onClick={() => handleDeleteSingle(booking)} className={btnDanger}>
                          <X className="w-3 h-3" />Löschen
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* ── Expanded series detail rows ── */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="px-4 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Einzeltermine ({bws.totalCount})
                      </div>
                      <div className="space-y-1">
                        {bws.seriesBookings!.map(sb => {
                          const hasConflict = sb.conflicts.length > 0;
                          const dayName = DAYS_FULL[new Date(sb.date + 'T00:00:00').getDay()];
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
                                <span className="text-[11px] text-amber-700 truncate">
                                  {sb.conflicts.map(c => `"${c.title}" ${c.startTime}-${c.endTime}`).join(', ')}
                                </span>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteSingleInSeries(sb)}
                                  className={`ml-auto flex-shrink-0 !w-auto ${btnDanger}`}
                                >
                                  <X className="w-3 h-3" />Termin
                                </button>
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
