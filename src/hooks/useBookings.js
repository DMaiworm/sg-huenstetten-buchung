/**
 * useBookings – Buchungen laden und mutieren (CRUD + Serien)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function mapBooking(b) {
  return {
    id: b.id, resourceId: b.resource_id, date: b.date,
    startTime: b.start_time?.substring(0, 5) || b.start_time,
    endTime:   b.end_time?.substring(0, 5)   || b.end_time,
    title: b.title, description: b.description || '',
    bookingType: b.booking_type, userId: b.user_id,
    teamId: b.team_id || null,
    status: b.status, seriesId: b.series_id || null,
    parentBooking: b.parent_booking || false,
  };
}

function mapBookingToDb(b) {
  return {
    resource_id: b.resourceId, date: b.date,
    start_time: b.startTime, end_time: b.endTime,
    title: b.title, description: b.description || null,
    booking_type: b.bookingType, user_id: b.userId,
    team_id: b.teamId || null,
    status: b.status || 'pending', series_id: b.seriesId || null,
    parent_booking: b.parentBooking || false,
  };
}

export function useBookings() {
  const { user } = useAuth();
  const [bookings, setBookingsState] = useState([]);
  const [loading,  setLoading]       = useState(true);
  const [isDemo,   setIsDemo]        = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('bookings').select('*').order('date');
      if (error) throw error;
      setBookingsState((data || []).map(mapBooking));
      setIsDemo(false);
    } catch (err) {
      console.warn('Bookings nicht geladen:', err.message);
      setBookingsState([]);
      setIsDemo(true);
    }
    setLoading(false);
  }, [user]);
  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const createBooking = useCallback(async (bookingData) => {
    try {
      const { data, error } = await supabase.from('bookings').insert(mapBookingToDb(bookingData)).select().single();
      if (error) throw error;
      const mapped = mapBooking(data);
      setBookingsState(prev => [...prev, mapped]);
      return { data: mapped, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const createBookings = useCallback(async (bookingsArray) => {
    try {
      const { data, error } = await supabase.from('bookings').insert(bookingsArray.map(mapBookingToDb)).select();
      if (error) throw error;
      const mappedArray = (data || []).map(mapBooking);
      setBookingsState(prev => [...prev, ...mappedArray]);
      return { data: mappedArray, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateBooking = useCallback(async (bookingId, updates) => {
    try {
      const dbUpdates = {};
      if (updates.title !== undefined)       dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description || null;
      if (updates.bookingType !== undefined) dbUpdates.booking_type = updates.bookingType;
      if (updates.date !== undefined)        dbUpdates.date = updates.date;
      if (updates.startTime !== undefined)   dbUpdates.start_time = updates.startTime;
      if (updates.endTime !== undefined)     dbUpdates.end_time = updates.endTime;
      if (updates.resourceId !== undefined)  dbUpdates.resource_id = updates.resourceId;
      if (updates.teamId !== undefined)      dbUpdates.team_id = updates.teamId;
      if (updates.status !== undefined)      dbUpdates.status = updates.status;
      const { data, error } = await supabase.from('bookings').update(dbUpdates).eq('id', bookingId).select().single();
      if (error) throw error;
      const mapped = mapBooking(data);
      setBookingsState(prev => prev.map(b => b.id === bookingId ? mapped : b));
      return { data: mapped, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateBookingStatus = useCallback(async (bookingId, status) => {
    try {
      const { data, error } = await supabase.from('bookings').update({ status }).eq('id', bookingId).select().single();
      if (error) throw error;
      const mapped = mapBooking(data);
      setBookingsState(prev => prev.map(b => b.id === bookingId ? mapped : b));
      return { data: mapped, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateSeriesStatus = useCallback(async (seriesId, status) => {
    try {
      const { data, error } = await supabase.from('bookings').update({ status }).eq('series_id', seriesId).select();
      if (error) throw error;
      const mappedArray = (data || []).map(mapBooking);
      const updatedIds  = new Set(mappedArray.map(b => b.id));
      setBookingsState(prev => prev.map(b => updatedIds.has(b.id) ? mappedArray.find(u => u.id === b.id) : b));
      return { data: mappedArray, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const deleteBooking = useCallback(async (bookingId) => {
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
      if (error) throw error;
      setBookingsState(prev => prev.filter(b => b.id !== bookingId));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  const deleteBookingSeries = useCallback(async (seriesId) => {
    try {
      const { error } = await supabase.from('bookings').delete().eq('series_id', seriesId);
      if (error) throw error;
      setBookingsState(prev => prev.filter(b => b.seriesId !== seriesId));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  const setBookings = useCallback((v) => setBookingsState(v), []);

  return {
    bookings, setBookings, loading, isDemo,
    createBooking, createBookings,
    updateBooking, updateBookingStatus, updateSeriesStatus,
    deleteBooking, deleteBookingSeries,
    refreshBookings: fetchBookings,
  };
}
