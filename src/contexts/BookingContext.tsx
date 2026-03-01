import React, { createContext, useContext } from 'react';
import { useBookings as useBookingsHook } from '../hooks/useSupabase';

type BookingContextValue = ReturnType<typeof useBookingsHook>;

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const hook = useBookingsHook();
  return <BookingContext.Provider value={hook}>{children}</BookingContext.Provider>;
}

export function useBookingContext(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBookingContext muss innerhalb von <BookingProvider> verwendet werden');
  return ctx;
}
