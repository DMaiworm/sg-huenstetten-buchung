import React, { createContext, useContext } from 'react';
import { useHolidays as useHolidaysHook } from '../hooks/useSupabase';

type HolidayContextValue = ReturnType<typeof useHolidaysHook>;

const HolidayContext = createContext<HolidayContextValue | null>(null);

export function HolidayProvider({ children }: { children: React.ReactNode }) {
  const hook = useHolidaysHook();
  return <HolidayContext.Provider value={hook}>{children}</HolidayContext.Provider>;
}

export function useHolidayContext(): HolidayContextValue {
  const ctx = useContext(HolidayContext);
  if (!ctx) throw new Error('useHolidayContext muss innerhalb von <HolidayProvider> verwendet werden');
  return ctx;
}
