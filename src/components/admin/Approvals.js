/**
 * Approvals – Admin view for pending booking requests.
 *
 * Shows all bookings with status 'pending' that are NOT parentBookings
 * (auto-generated blocking entries for composite resources like “ganzes Feld”).
 * When the admin approves/rejects, the callback in App.js handles
 * cascading the status to all related bookings in the same series.
 *
 * Props:
 *   bookings   - All bookings
 *   onApprove  - Callback(bookingId)
 *   onReject   - Callback(bookingId, reason)
 *   users      - User objects
 *   resources  - Legacy resource array
 */

import React, { useState } from 'react';
import { Calendar, MapPin, Users, Check, X, Clock } from 'lucide-react';
import { BOOKING_TYPES, ROLES } from '../../config/constants';
import { Badge } from '../ui/Badge';

const Approvals = ({ bookings, onApprove, onReject, users, resources }) => {
  // Filter: only show genuine pending requests (exclude auto-generated parentBooking entries)
  const pendingBookings = bookings.filter(b => b.status === 'pending' && !b.parentBooking);
  const [rejectDialog, setRejectDialog] = useState(null);

  /** Resolve userId \u2192 display name + role info. */
  const getUserInfo = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return { name: 'Unbekannt', role: null };
    const role = ROLES.find(r => r.id === user.role);
    return { name: `${user.firstName} ${user.lastName}`, team: user.team, club: user.club, role };
  };

  /** Count how many related bookings (same seriesId) exist for a booking. */
  const getRelatedCount = (booking) => {
    if (!booking.seriesId) return 0;
    return bookings.filter(b => b.seriesId === booking.seriesId && b.id !== booking.id).length;
  };

  const handleReject = (bookingId) => {
    if (rejectDialog && rejectDialog.reason !== undefined) {
      onReject(bookingId, rejectDialog.reason);
      setRejectDialog(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Offene Genehmigungen</h2>
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-400 text-gray-800">
          {pendingBookings.length}
        </span>
      </div>

      {pendingBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <p>Keine offenen Anfragen</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingBookings.map(booking => {
            const resource = resources.find(r => r.id === booking.resourceId);
            const userInfo = getUserInfo(booking.userId);
            const showingRejectDialog = rejectDialog?.bookingId === booking.id;
            const relatedCount = getRelatedCount(booking);

            return (
              <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-3 h-full min-h-16 rounded-full" style={{ backgroundColor: resource?.color }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800">{booking.title}</h3>
                        {booking.bookingType && (
                          <Badge variant="default" className="text-xs">
                            {BOOKING_TYPES.find(t => t.id === booking.bookingType)?.icon}{' '}
                            {BOOKING_TYPES.find(t => t.id === booking.bookingType)?.label}
                          </Badge>
                        )}
                        {resource?.type === 'limited' && <Badge variant="warning">Limitiert</Badge>}
                        {resource?.isComposite && <Badge variant="info">Ganzes Feld</Badge>}
                        {booking.seriesId && <Badge variant="default">Serie</Badge>}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <MapPin className="w-4 h-4" /><span>{resource?.name}</span>
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" /><span>{booking.startTime} - {booking.endTime}</span>
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4" /><span>{booking.date}</span>
                        </p>
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

                      {/* Info: related bookings that will be affected */}
                      {relatedCount > 0 && (
                        <div style={{ marginTop: '8px', padding: '6px 10px', backgroundColor: '#eff6ff', borderRadius: '6px', fontSize: '12px', color: '#1e40af' }}>
                          \u2139\ufe0f Genehmigung/Ablehnung gilt auch f\u00fcr {relatedCount} verkn\u00fcpfte Buchung{relatedCount !== 1 ? 'en' : ''} (Serie/Teilfl\u00e4chen).
                        </div>
                      )}

                      {/* Reject dialog */}
                      {showingRejectDialog && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <label className="block text-sm font-medium text-red-800 mb-2">
                            Grund der Ablehnung (optional):
                          </label>
                          <textarea
                            value={rejectDialog.reason}
                            onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                            placeholder="z.B. Ressource bereits anderweitig vergeben..."
                            rows={3}
                            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                          />
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleReject(booking.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors gap-1.5">
                              <X className="w-4 h-4" /><span>Ablehnen & E-Mail senden</span>
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

                  {/* Action buttons */}
                  {!showingRejectDialog && (
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => onApprove(booking.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors gap-1.5">
                        <Check className="w-4 h-4" /><span>Genehmigen</span>
                      </button>
                      <button onClick={() => setRejectDialog({ bookingId: booking.id, reason: '' })}
                        className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors gap-1.5">
                        <X className="w-4 h-4" /><span>Ablehnen</span>
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
