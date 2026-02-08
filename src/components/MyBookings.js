import React, { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, Users, X, List, Repeat } from 'lucide-react';
import { RESOURCES, BOOKING_TYPES, ROLES } from '../config/constants';
import { Badge } from './ui/Badge';
import { Button } from './ui/Badge';

const MyBookings = ({ bookings, isAdmin, onDelete, users }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedResource, setSelectedResource] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const getUserInfo = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return { name: 'Unbekannt', role: null };
    const role = ROLES.find(r => r.id === user.role);
    return { name: `${user.firstName} ${user.lastName}`, team: user.team, club: user.club, role };
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
  }, [bookings, selectedCategory, selectedResource]);

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
            <button onClick={() => setSelectedResource('all')} className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${selectedResource === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              Alle
            </button>
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
        <div className="space-y-4">
          {groupedBookings.map((booking, idx) => {
            const resource = RESOURCES.find(r => r.id === booking.resourceId);
            const isSeries = booking.dates && booking.dates.length > 1;
            const userInfo = getUserInfo(booking.userId);
            return (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-full min-h-16 rounded-full" style={{ backgroundColor: resource?.color }} />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800">{booking.title}</h3>
                        {booking.bookingType && (<Badge variant="default" className="text-xs">{BOOKING_TYPES.find(t => t.id === booking.bookingType)?.icon} {BOOKING_TYPES.find(t => t.id === booking.bookingType)?.label}</Badge>)}
                        {isSeries && (<Badge variant="info"><Repeat className="w-3 h-3 inline mr-1" />Serie ({booking.dates.length}x)</Badge>)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{resource?.name}</span>
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{booking.startTime} - {booking.endTime}</span>
                        </p>
                        {isSeries ? (
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{booking.dates.length} Termine ({booking.dates[0]} bis {booking.dates[booking.dates.length - 1]})</span>
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{booking.date}</span>
                          </p>
                        )}
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{userInfo.name}</span>
                          {userInfo.role && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: userInfo.role.color }} />
                              <span className="text-xs">({userInfo.role.label})</span>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      booking.status === 'approved' 
                        ? 'bg-green-500 text-white' 
                        : booking.status === 'pending' 
                        ? 'bg-yellow-400 text-gray-800' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {booking.status === 'approved' ? 'Genehmigt' : booking.status === 'pending' ? 'Ausstehend' : 'Abgelehnt'}
                    </span>
                    {isAdmin && (
                      <div className="flex flex-col gap-1">
                        {deleteConfirm?.id === booking.id ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs">
                            <p className="text-red-700 font-medium mb-2">Wirklich loeschen?</p>
                            <div className="flex gap-1">
                              <Button variant="danger" size="sm" onClick={() => { onDelete(booking.id, deleteConfirm.type, booking.seriesId); setDeleteConfirm(null); }}>Ja</Button>
                              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>Nein</Button>
                            </div>
                          </div>
                        ) : (
                          <>{isSeries ? (
                            <div className="flex gap-1">
                              <button 
                                onClick={() => setDeleteConfirm({ id: booking.id, type: 'single' })} 
                                className="px-3 py-1.5 bg-gray-200 text-red-600 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors flex items-center gap-1.5"
                                title="Nur diesen Termin loeschen"
                              >
                                <X className="w-4 h-4" />
                                <span>1 Termin</span>
                              </button>
                              <button 
                                onClick={() => setDeleteConfirm({ id: booking.id, type: 'series' })} 
                                className="px-3 py-1.5 bg-gray-200 text-red-600 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors flex items-center gap-1.5"
                                title="Ganze Serie loeschen"
                              >
                                <X className="w-4 h-4" />
                                <span>Serie</span>
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setDeleteConfirm({ id: booking.id, type: 'single' })} 
                              className="px-3 py-1.5 bg-gray-200 text-red-600 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors flex items-center gap-1.5"
                            >
                              <X className="w-4 h-4" />
                              <span>Loeschen</span>
                            </button>
                          )}</>
                        )}
                      </div>
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
