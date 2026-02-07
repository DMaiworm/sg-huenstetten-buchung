import React, { useState } from 'react';
import { Calendar, MapPin, Users, Check, X } from 'lucide-react';
import { RESOURCES, BOOKING_TYPES, ROLES } from '../../config/constants';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Badge';

const Approvals = ({ bookings, onApprove, onReject, users }) => {
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const [rejectDialog, setRejectDialog] = useState(null);

  const getUserInfo = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return { name: 'Unbekannt', role: null };
    const role = ROLES.find(r => r.id === user.role);
    return { name: `${user.firstName} ${user.lastName}`, team: user.team, club: user.club, role };
  };

  const handleReject = (bookingId) => {
    if (rejectDialog && rejectDialog.reason) { onReject(bookingId, rejectDialog.reason); setRejectDialog(null); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Offene Genehmigungen
        <Badge variant="warning" className="ml-3">{pendingBookings.length}</Badge>
      </h2>

      {pendingBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <p>Keine offenen Anfragen</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingBookings.map(booking => {
            const resource = RESOURCES.find(r => r.id === booking.resourceId);
            const userInfo = getUserInfo(booking.userId);
            const showingRejectDialog = rejectDialog?.bookingId === booking.id;
            return (
              <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800">{booking.title}</h3>
                      {booking.bookingType && (
                        <Badge variant="default">
                          {BOOKING_TYPES.find(t => t.id === booking.bookingType)?.icon} {BOOKING_TYPES.find(t => t.id === booking.bookingType)?.label}
                        </Badge>
                      )}
                      {resource?.type === 'limited' && <Badge variant="warning">Limitiert</Badge>}
                      {resource?.isComposite && <Badge variant="info">Ganzes Feld</Badge>}
                      {booking.seriesId && <Badge variant="default">Serie</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />{resource?.name}
                    </p>
                    <p className="text-sm text-gray-500 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {booking.date} &bull; {booking.startTime} - {booking.endTime}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Angefragt von:
                      <span className="font-medium text-gray-700">{userInfo.name}</span>
                      {userInfo.role && (
                        <>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: userInfo.role.color }} />
                          <span className="text-xs">({userInfo.role.label})</span>
                        </>
                      )}
                      {userInfo.team && <span className="text-xs">&bull; {userInfo.team}</span>}
                    </p>

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
                          <Button variant="danger" size="sm" onClick={() => handleReject(booking.id)}>
                            <X className="w-4 h-4 mr-1" />Ablehnen &amp; E-Mail senden
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setRejectDialog(null)}>Abbrechen</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!showingRejectDialog && (
                    <div className="flex gap-2 ml-4">
                      <Button variant="success" size="sm" onClick={() => onApprove(booking.id)}>
                        <Check className="w-4 h-4 mr-1" />Genehmigen
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setRejectDialog({ bookingId: booking.id, reason: '' })}>
                        <X className="w-4 h-4 mr-1" />Ablehnen
                      </Button>
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
