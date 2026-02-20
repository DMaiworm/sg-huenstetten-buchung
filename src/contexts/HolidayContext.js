import React, { createContext, useContext } from 'react';
import { useHolidays as useHolidaysHook } from '../hooks/useSupabase';

const HolidayContext = createContext(null);

export function HolidayProvider({ children }) {
  const {
    holidays, setHolidays, loading,
    createHoliday, createHolidaysBulk, updateHoliday,
    deleteHoliday, deleteHolidaysByYear, refreshHolidays,
  } = useHolidaysHook();

  const value = {
    holidays, setHolidays, loading,
    createHoliday, createHolidaysBulk, updateHoliday,
    deleteHoliday, deleteHolidaysByYear, refreshHolidays,
  };

  return <HolidayContext.Provider value={value}>{children}</HolidayContext.Provider>;
}

export function useHolidayContext() {
  const ctx = useContext(HolidayContext);
  if (!ctx) throw new Error('useHolidayContext muss innerhalb von <HolidayProvider> verwendet werden');
  return ctx;
}
