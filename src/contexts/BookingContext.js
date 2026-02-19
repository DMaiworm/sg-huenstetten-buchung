import React, { createContext, useContext } from 'react';
import { useBookings as useBookingsHook } from '../hooks/useSupabase';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const {
    bookings, setBookings,
    createBooking, createBookings,
    updateBookingStatus, updateSeriesStatus,
    deleteBooking, deleteBookingSeries,
    loading, isDemo,
  } = useBookingsHook();

  const value = {
    bookings, setBookings,
    createBooking, createBookings,
    updateBookingStatus, updateSeriesStatus,
    deleteBooking, deleteBookingSeries,
    loading, isDemo,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookingContext() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBookingContext muss innerhalb von <BookingProvider> verwendet werden');
  return ctx;
}
