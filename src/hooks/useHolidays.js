/**
 * useHolidays – Ferien & Feiertage (Hessen) laden und verwalten
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function mapHoliday(h) {
  return { id: h.id, name: h.name, type: h.type, startDate: h.start_date, endDate: h.end_date, year: h.year };
}

export function useHolidays() {
  const { user } = useAuth();
  const [holidays, setHolidaysState] = useState([]);
  const [loading, setLoading]        = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('holidays').select('*').order('start_date');
      if (error) throw error;
      setHolidaysState((data || []).map(mapHoliday));
    } catch (err) { console.warn('Holidays nicht geladen:', err.message); setHolidaysState([]); }
    setLoading(false);
  }, [user]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createHoliday = useCallback(async (holidayData) => {
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
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const createHolidaysBulk = useCallback(async (holidaysArray) => {
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
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateHoliday = useCallback(async (holiday) => {
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
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const deleteHoliday = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('holidays').delete().eq('id', id);
      if (error) throw error;
      setHolidaysState(p => p.filter(h => h.id !== id));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  const deleteHolidaysByYear = useCallback(async (year, type) => {
    try {
      let query = supabase.from('holidays').delete().eq('year', year);
      if (type) query = query.eq('type', type);
      const { error } = await query;
      if (error) throw error;
      setHolidaysState(p => p.filter(h => !(h.year === year && (!type || h.type === type))));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  const setHolidays = useCallback((v) => setHolidaysState(v), []);

  return {
    holidays, setHolidays, loading,
    createHoliday, createHolidaysBulk, updateHoliday,
    deleteHoliday, deleteHolidaysByYear,
    refreshHolidays: fetchAll,
  };
}
