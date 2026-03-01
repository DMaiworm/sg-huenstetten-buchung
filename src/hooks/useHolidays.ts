/**
 * useHolidays – Ferien & Feiertage (Hessen) laden und verwalten
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Holiday, HolidayCreateData, DbResult, DbDeleteResult } from '../types';

function mapHoliday(h: Record<string, unknown>): Holiday {
  return {
    id: h.id as string,
    name: h.name as string,
    type: h.type as Holiday['type'],
    startDate: h.start_date as string,
    endDate: h.end_date as string,
    year: h.year as number,
  };
}

export function useHolidays() {
  const { user } = useAuth();
  const [holidays, setHolidaysState] = useState<Holiday[]>([]);
  const [loading, setLoading]        = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('holidays').select('*').order('start_date');
      if (error) throw error;
      setHolidaysState((data || []).map(mapHoliday));
    } catch (err) { console.warn('Holidays nicht geladen:', (err as Error).message); setHolidaysState([]); }
    setLoading(false);
  }, [user]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createHoliday = useCallback(async (holidayData: HolidayCreateData): Promise<DbResult<Holiday>> => {
    try {
      const { data, error } = await supabase.from('holidays').insert({
        name: holidayData.name, type: holidayData.type,
        start_date: holidayData.startDate, end_date: holidayData.endDate,
        year: holidayData.year,
      }).select().single();
      if (error) throw error;
      const h = mapHoliday(data);
      setHolidaysState(p => [...p, h].sort((a, b) => a.startDate.localeCompare(b.startDate)));
      return { data: h, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const createHolidaysBulk = useCallback(async (holidaysArray: HolidayCreateData[]): Promise<DbResult<Holiday[]>> => {
    try {
      const { data, error } = await supabase.from('holidays').insert(
        holidaysArray.map(h => ({
          name: h.name, type: h.type,
          start_date: h.startDate, end_date: h.endDate,
          year: h.year,
        }))
      ).select();
      if (error) throw error;
      const mapped = (data || []).map(mapHoliday);
      setHolidaysState(p => [...p, ...mapped].sort((a, b) => a.startDate.localeCompare(b.startDate)));
      return { data: mapped, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const updateHoliday = useCallback(async (holiday: Holiday): Promise<DbResult<Holiday>> => {
    try {
      const { data, error } = await supabase.from('holidays').update({
        name: holiday.name, type: holiday.type,
        start_date: holiday.startDate, end_date: holiday.endDate,
        year: holiday.year,
      }).eq('id', holiday.id).select().single();
      if (error) throw error;
      const h = mapHoliday(data);
      setHolidaysState(p => p.map(x => x.id === h.id ? h : x));
      return { data: h, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const deleteHoliday = useCallback(async (id: string): Promise<DbDeleteResult> => {
    try {
      const { error } = await supabase.from('holidays').delete().eq('id', id);
      if (error) throw error;
      setHolidaysState(p => p.filter(h => h.id !== id));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  const deleteHolidaysByYear = useCallback(async (year: number, type?: string): Promise<DbDeleteResult> => {
    try {
      let query = supabase.from('holidays').delete().eq('year', year);
      if (type) query = query.eq('type', type);
      const { error } = await query;
      if (error) throw error;
      setHolidaysState(p => p.filter(h => !(h.year === year && (!type || h.type === type))));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  const setHolidays = useCallback((v: Holiday[]) => setHolidaysState(v), []);

  return {
    holidays, setHolidays, loading,
    createHoliday, createHolidaysBulk, updateHoliday,
    deleteHoliday, deleteHolidaysByYear,
    refreshHolidays: fetchAll,
  };
}
