/**
 * Approvals – Genehmigungsansicht für Admins und Genehmiger.
 */

import React, { useState } from 'react';
import { Calendar, MapPin, Users, Check, X, Clock, Shield } from 'lucide-react';
import { ROLES } from '../../config/constants';
import { EVENT_TYPES } from '../../config/organizationConfig';
import { Badge } from '../ui/Badge';

const Approvals = ({ bookings, onApprove, onReject, users, resources, genehmigerResources = null, isAdmin = false }) => {
  const [rejectDialog, setRejectDialog] = useState(null);

  const pendingBookings = bookings.filter(b => {
    if (b.status !== 'pending' || b.parentBooking) return false;
    if (isAdmin || genehmigerResources === null) return true;
    return genehmigerResources.includes(b.resourceId);
  });

  const getUserInfo = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return { name: 'Unbekannt', role: null };
    const role = ROLES.find(r => r.id === user.role);
    return { name: `${user.firstName} ${user.lastName}`, role };
  };

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
        {!isAdmin && genehmigerResources !== null && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
            <Shield className="w-3 h-3" /> Nur zugewiesene Ressourcen
          </span>
        )}
      </div>

      {pendingBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <p>Keine offenen Anfragen</p>
          {!isAdmin && genehmigerResources !== null && genehmigerResources.length === 0 && (
            <p className="text-sm text-gray-400 mt-2">Dir wurden noch keine Ressourcen zur Genehmigung zugewiesen.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {pendingBookings.map(booking => {
            const resource = resources.find(r => r.id === booking.resourceId);
            const userInfo = getUserInfo(booking.userId);
            const showingRejectDlg = rejectDialog?.bookingId === booking.id;
            const relatedCount = getRelatedCount(booking);

            return (
              <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-3 min-h-[64px] rounded-full" style={{ backgroundColor: resource?.color }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800">{booking.title}</h3>
                        {booking.bookingType && (() => {
                          const et = EVENT_TYPES.find(t => t.id === booking.bookingType);
                          return et ? <Badge variant="default" className="text-xs">{et.icon} {et.label}</Badge> : null;
                        })()}
                        {resource?.type === 'limited' && <Badge variant="warning">Limitiert</Badge>}
                        {resource?.isComposite && <Badge variant="info">Ganzes Feld</Badge>}
                        {booking.seriesId && <Badge variant="default">Serie</Badge>}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 flex items-center gap-2"><MapPin className="w-4 h-4" />{resource?.name}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2"><Clock className="w-4 h-4" />{booking.startTime} - {booking.endTime}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2"><Calendar className="w-4 h-4" />{booking.date}</p>
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
                      {relatedCount > 0 && (
                        <div className="mt-2 px-2.5 py-1.5 bg-blue-50 rounded text-xs text-blue-800">
                          ℹ️ Genehmigung/Ablehnung gilt auch für {relatedCount} verknüpfte Buchung{relatedCount !== 1 ? 'en' : ''} (Serie/Teilflächen).
                        </div>
                      )}
                      {showingRejectDlg && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <label className="block text-sm font-medium text-red-800 mb-2">Grund der Ablehnung (optional):</label>
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
                  {!showingRejectDlg && (
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => onApprove(booking.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors gap-1.5">
                        <Check className="w-4 h-4" /> Genehmigen
                      </button>
                      <button onClick={() => setRejectDialog({ bookingId: booking.id, reason: '' })}
                        className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors gap-1.5">
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
