/**
 * Approvals – Genehmigungsansicht für Admins und Genehmiger.
 *
 * Serien werden als aufklappbare Container dargestellt.
 * Bei Zeitkonflikten können Einzeltermine separat genehmigt/abgelehnt werden.
 */

import React, { useState, useMemo } from 'react';
import { Calendar, MapPin, Users, Check, X, Clock, Shield, ChevronDown, ChevronRight, Repeat, AlertTriangle, CheckCircle, ClipboardCheck } from 'lucide-react';
import { ROLES, DAYS_FULL } from '../../config/constants';
import { EVENT_TYPES } from '../../config/organizationConfig';
import { Badge } from '../ui/Badge';
import { findConflicts } from '../../utils/helpers';
import PageHeader from '../ui/PageHeader';
import EmptyState from '../ui/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useBookingContext } from '../../contexts/BookingContext';
import { useUserContext } from '../../contexts/UserContext';
import { useFacility } from '../../contexts/FacilityContext';

const Approvals = ({ onApprove, onReject }) => {
  const { profile, kannAdministrieren } = useAuth();
  const { bookings } = useBookingContext();
  const { users, getResourcesForUser } = useUserContext();
  const { RESOURCES: resources } = useFacility();

  const genehmigerResources = kannAdministrieren ? null : (getResourcesForUser(profile?.id) || null);
  const isAdmin = kannAdministrieren;
  const [rejectDialog, setRejectDialog] = useState(null);
  const [expandedSeries, setExpandedSeries] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const toggleSeries = (seriesId) =>
    setExpandedSeries(prev => ({ ...prev, [seriesId]: !prev[seriesId] }));

  // ── Filter pending bookings ──
  const pendingBookings = useMemo(() =>
    bookings.filter(b => {
      if (b.status !== 'pending' || b.parentBooking) return false;
      if (isAdmin || genehmigerResources === null) return true;
      return genehmigerResources.includes(b.resourceId);
    }),
    [bookings, isAdmin, genehmigerResources]
  );

  // ── Group series bookings into containers ──
  const groupedPending = useMemo(() => {
    const seriesMap = {};
    const singles = [];
    pendingBookings.forEach(b => {
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
    Object.values(seriesMap).forEach(s => {
      s.seriesBookings.sort((a, b) => a.date.localeCompare(b.date));
      s.totalCount = s.seriesBookings.length;
      s.freeCount = s.seriesBookings.filter(sb => sb.conflicts.length === 0).length;
      s.blockedCount = s.seriesBookings.filter(sb => sb.conflicts.length > 0).length;
    });
    return [...Object.values(seriesMap), ...singles];
  }, [pendingBookings, bookings]);

  // ── Helpers ──
  const getUserInfo = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return { name: 'Unbekannt', role: null };
    const role = ROLES.find(r => r.id === user.role);
    return { name: `${user.firstName} ${user.lastName}`, role };
  };

  const fmtDate = (s) => new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fmtDateShort = (s) => new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

  const handleApproveWrapped = async (bookingId, opts) => {
    if (processingId) return;
    setProcessingId(bookingId);
    await onApprove(bookingId, opts);
    setProcessingId(null);
  };

  const handleReject = async (bookingId, opts) => {
    if (processingId) return;
    if (rejectDialog && rejectDialog.reason !== undefined) {
      setProcessingId(bookingId);
      await onReject(bookingId, opts);
      setProcessingId(null);
      setRejectDialog(null);
    }
  };

  return (
    <div>
      <PageHeader
        icon={ClipboardCheck}
        title="Offene Genehmigungen"
        actions={
          <>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-400 text-gray-800">
              {groupedPending.length}
            </span>
            {pendingBookings.length !== groupedPending.length && (
              <span className="text-sm text-gray-500">
                ({pendingBookings.length} Einzeltermine)
              </span>
            )}
            {!isAdmin && genehmigerResources !== null && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                <Shield className="w-3 h-3" /> Nur zugewiesene Ressourcen
              </span>
            )}
          </>
        }
      />

      {groupedPending.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Keine offenen Anfragen"
          subtitle={!isAdmin && genehmigerResources !== null && genehmigerResources.length === 0
            ? 'Dir wurden noch keine Ressourcen zur Genehmigung zugewiesen.'
            : undefined}
        />
      ) : (
        <div className="space-y-4">
          {groupedPending.map(item => {
            const isSeries = item.seriesBookings && item.seriesBookings.length > 1;
            const resource = resources.find(r => r.id === item.resourceId);
            const userInfo = getUserInfo(item.userId);
            const isExpanded = isSeries && expandedSeries[item.seriesId];
            const bookingType = item.bookingType ? EVENT_TYPES.find(t => t.id === item.bookingType) : null;

            if (isSeries) {
              // ── Series container ──
              const dateRange = fmtDate(item.seriesBookings[0].date) + ' – ' + fmtDate(item.seriesBookings[item.seriesBookings.length - 1].date);
              const dayName = DAYS_FULL[new Date(item.seriesBookings[0].date).getDay()];

              return (
                <div key={item.seriesId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* ── Header ── */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-3 min-h-[64px] rounded-full flex-shrink-0" style={{ backgroundColor: resource?.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <button
                              onClick={() => toggleSeries(item.seriesId)}
                              className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <h3 className="font-semibold text-gray-800">{item.title}</h3>
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold">
                              <Repeat className="w-3 h-3" />{item.totalCount}x Serie
                            </span>
                            {bookingType && <Badge variant="default" className="text-xs">{bookingType.icon} {bookingType.label}</Badge>}
                            {resource?.type === 'limited' && <Badge variant="warning">Limitiert</Badge>}
                            {resource?.isComposite && <Badge variant="info">Ganzes Feld</Badge>}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 flex items-center gap-2"><MapPin className="w-4 h-4" />{resource?.name}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-2"><Clock className="w-4 h-4" />{item.startTime} - {item.endTime}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-2"><Calendar className="w-4 h-4" />Jeden {dayName}, {dateRange}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>Angefragt von: {userInfo.name}</span>
                              {userInfo.role && (
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: userInfo.role.color }} />
                                  <span className="text-xs">({userInfo.role.label})</span>
                                </span>
                              )}
                            </p>
                          </div>
                          {/* Conflict summary */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" />{item.freeCount} frei
                            </span>
                            {item.blockedCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3" />{item.blockedCount} Konflikt{item.blockedCount !== 1 ? 'e' : ''}
                              </span>
                            )}
                          </div>

                          {/* Reject dialog for series */}
                          {rejectDialog?.seriesId === item.seriesId && !rejectDialog?.bookingId && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <label className="block text-sm font-medium text-red-800 mb-2">Grund der Ablehnung (optional):</label>
                              <textarea
                                value={rejectDialog.reason}
                                onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                                placeholder="z.B. Ressource bereits anderweitig vergeben..."
                                rows={2}
                                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                              />
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => handleReject(item.seriesBookings[0].id)}
                                  className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors gap-1.5">
                                  <X className="w-4 h-4" /> Ganze Serie ablehnen
                                </button>
                                <button onClick={() => setRejectDialog(null)}
                                  className="inline-flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors">
                                  Abbrechen
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Series-level actions */}
                      {!(rejectDialog?.seriesId === item.seriesId) && (
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                          <button onClick={() => handleApproveWrapped(item.seriesBookings[0].id)}
                            disabled={!!processingId}
                            className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Check className="w-4 h-4" /> Alle genehmigen
                          </button>
                          <button onClick={() => setRejectDialog({ seriesId: item.seriesId, reason: '' })}
                            disabled={!!processingId}
                            className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                            <X className="w-4 h-4" /> Alle ablehnen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Expanded: individual dates ── */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      <div className="px-4 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                          Einzeltermine ({item.totalCount})
                        </div>
                        <div className="space-y-1">
                          {item.seriesBookings.map(sb => {
                            const hasConflict = sb.conflicts.length > 0;
                            const dayShort = DAYS_FULL[new Date(sb.date).getDay()].substring(0, 2);
                            const showingSbReject = rejectDialog?.bookingId === sb.id;

                            return (
                              <div
                                key={sb.id}
                                className={`px-3 py-2 rounded text-[13px] ${
                                  hasConflict ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-100'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {hasConflict
                                    ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                    : <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                  }
                                  <span className="text-gray-500 w-6">{dayShort}</span>
                                  <span className="font-medium text-gray-800">{fmtDateShort(sb.date)}</span>
                                  <span className="text-gray-500">{sb.startTime} - {sb.endTime}</span>
                                  {hasConflict && (
                                    <span className="text-[11px] text-amber-700 truncate flex-1">
                                      Konflikt: {sb.conflicts.map(c => `"${c.title}" ${c.startTime}-${c.endTime}`).join(', ')}
                                    </span>
                                  )}
                                  {/* Individual actions only for conflicted dates */}
                                  {hasConflict && !showingSbReject && (
                                    <div className="flex gap-1 ml-auto flex-shrink-0">
                                      <button onClick={() => handleApproveWrapped(sb.id, { singleOnly: true })}
                                        disabled={!!processingId}
                                        className="inline-flex items-center px-2 py-0.5 bg-green-500 text-white rounded-full text-[11px] font-medium hover:bg-green-600 transition-colors gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Check className="w-3 h-3" /> Genehmigen
                                      </button>
                                      <button onClick={() => setRejectDialog({ bookingId: sb.id, seriesId: item.seriesId, reason: '' })}
                                        disabled={!!processingId}
                                        className="inline-flex items-center px-2 py-0.5 bg-red-500 text-white rounded-full text-[11px] font-medium hover:bg-red-600 transition-colors gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <X className="w-3 h-3" /> Ablehnen
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {/* Inline reject dialog for individual date */}
                                {showingSbReject && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                    <textarea
                                      value={rejectDialog.reason}
                                      onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                                      placeholder="Grund (optional)..."
                                      rows={1}
                                      className="w-full px-2 py-1 border border-red-300 rounded text-xs"
                                    />
                                    <div className="flex gap-1 mt-1">
                                      <button onClick={() => handleReject(sb.id, { singleOnly: true })}
                                        className="inline-flex items-center px-2 py-0.5 bg-red-500 text-white rounded-full text-[11px] font-medium hover:bg-red-600 transition-colors gap-1">
                                        <X className="w-3 h-3" /> Ablehnen
                                      </button>
                                      <button onClick={() => setRejectDialog(null)}
                                        className="inline-flex items-center px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-[11px] font-medium hover:bg-gray-300 transition-colors">
                                        Abbrechen
                                      </button>
                                    </div>
                                  </div>
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
            }

            // ── Single booking (unchanged layout) ──
            const showingSingleReject = rejectDialog?.bookingId === item.id;
            return (
              <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-3 min-h-[64px] rounded-full" style={{ backgroundColor: resource?.color }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800">{item.title}</h3>
                        {bookingType && <Badge variant="default" className="text-xs">{bookingType.icon} {bookingType.label}</Badge>}
                        {resource?.type === 'limited' && <Badge variant="warning">Limitiert</Badge>}
                        {resource?.isComposite && <Badge variant="info">Ganzes Feld</Badge>}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 flex items-center gap-2"><MapPin className="w-4 h-4" />{resource?.name}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2"><Clock className="w-4 h-4" />{item.startTime} - {item.endTime}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2"><Calendar className="w-4 h-4" />{item.date}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Angefragt von: {userInfo.name}</span>
                          {userInfo.role && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: userInfo.role.color }} />
                              <span className="text-xs">({userInfo.role.label})</span>
                            </span>
                          )}
                        </p>
                      </div>
                      {showingSingleReject && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <label className="block text-sm font-medium text-red-800 mb-2">Grund der Ablehnung (optional):</label>
                          <textarea
                            value={rejectDialog.reason}
                            onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                            placeholder="z.B. Ressource bereits anderweitig vergeben..."
                            rows={2}
                            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                          />
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleReject(item.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors gap-1.5">
                              <X className="w-4 h-4" /> Ablehnen
                            </button>
                            <button onClick={() => setRejectDialog(null)}
                              className="inline-flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors">
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {!showingSingleReject && (
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => handleApproveWrapped(item.id)}
                        disabled={!!processingId}
                        className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Check className="w-4 h-4" /> Genehmigen
                      </button>
                      <button onClick={() => setRejectDialog({ bookingId: item.id, reason: '' })}
                        disabled={!!processingId}
                        className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                        <X className="w-4 h-4" /> Ablehnen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Approvals;
