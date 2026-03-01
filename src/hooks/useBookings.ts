/**
 * useBookings – Buchungen laden und mutieren (CRUD + Serien)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Booking, BookingCreateData, BookingUpdates, BookingStatus, DbResult, DbDeleteResult } from '../types';

function mapBooking(b: Record<string, unknown>): Booking {
  return {
    id: b.id as string, resourceId: b.resource_id as string, date: b.date as string,
    startTime: ((b.start_time as string)?.substring(0, 5) || b.start_time) as string,
    endTime:   ((b.end_time as string)?.substring(0, 5)   || b.end_time) as string,
    title: b.title as string, description: (b.description as string) || '',
    bookingType: b.booking_type as Booking['bookingType'], userId: b.user_id as string,
    teamId: (b.team_id as string) || null,
    status: b.status as Booking['status'], seriesId: (b.series_id as string) || null,
    parentBooking: (b.parent_booking as boolean) || false,
  };
}

function mapBookingToDb(b: BookingCreateData): Record<string, unknown> {
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
  const [bookings, setBookingsState] = useState<Booking[]>([]);
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
      console.warn('Bookings nicht geladen:', (err as Error).message);
      setBookingsState([]);
      setIsDemo(true);
    }
    setLoading(false);
  }, [user]);
  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const createBooking = useCallback(async (bookingData: BookingCreateData): Promise<DbResult<Booking>> => {
    try {
      const { data, error } = await supabase.from('bookings').insert(mapBookingToDb(bookingData)).select().single();
      if (error) throw error;
      const mapped = mapBooking(data);
      setBookingsState(prev => [...prev, mapped]);
      return { data: mapped, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const createBookings = useCallback(async (bookingsArray: BookingCreateData[]): Promise<DbResult<Booking[]>> => {
    try {
      const { data, error } = await supabase.from('bookings').insert(bookingsArray.map(mapBookingToDb)).select();
      if (error) throw error;
      const mappedArray = (data || []).map(mapBooking);
      setBookingsState(prev => [...prev, ...mappedArray]);
      return { data: mappedArray, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const updateBooking = useCallback(async (bookingId: string, updates: BookingUpdates): Promise<DbResult<Booking>> => {
    try {
      const dbUpdates: Record<string, unknown> = {};
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
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const updateBookingStatus = useCallback(async (bookingId: string, status: BookingStatus): Promise<DbResult<Booking>> => {
    try {
      const { data, error } = await supabase.from('bookings').update({ status }).eq('id', bookingId).select().single();
      if (error) throw error;
      const mapped = mapBooking(data);
      setBookingsState(prev => prev.map(b => b.id === bookingId ? mapped : b));
      return { data: mapped, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const updateSeriesStatus = useCallback(async (seriesId: string, status: BookingStatus): Promise<DbResult<Booking[]>> => {
    try {
      const { data, error } = await supabase.from('bookings').update({ status }).eq('series_id', seriesId).select();
      if (error) throw error;
      const mappedArray = (data || []).map(mapBooking);
      const updatedIds  = new Set(mappedArray.map(b => b.id));
      setBookingsState(prev => prev.map(b => updatedIds.has(b.id) ? mappedArray.find(u => u.id === b.id)! : b));
      return { data: mappedArray, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const deleteBooking = useCallback(async (bookingId: string): Promise<DbDeleteResult> => {
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
      if (error) throw error;
      setBookingsState(prev => prev.filter(b => b.id !== bookingId));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  const deleteBookingSeries = useCallback(async (seriesId: string): Promise<DbDeleteResult> => {
    try {
      const { error } = await supabase.from('bookings').delete().eq('series_id', seriesId);
      if (error) throw error;
      setBookingsState(prev => prev.filter(b => b.seriesId !== seriesId));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  const setBookings = useCallback((v: Booking[]) => setBookingsState(v), []);

  return {
    bookings, setBookings, loading, isDemo,
    createBooking, createBookings,
    updateBooking, updateBookingStatus, updateSeriesStatus,
    deleteBooking, deleteBookingSeries,
    refreshBookings: fetchBookings,
  };
}
