/**
 * Supabase hooks for data loading and CRUD operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================
// Conversion helpers
// ============================================================

function mapProfile(profile) {
  return {
    id:                 profile.id,
    firstName:          profile.first_name,
    lastName:           profile.last_name,
    email:              profile.email,
    phone:              profile.phone || '',
    operatorId:         profile.operator_id,
    isPassive:          profile.is_passive          || false,
    invitedAt:          profile.invited_at          || null,
    istTrainer:         profile.ist_trainer         || false,
    kannBuchen:         profile.kann_buchen         || false,
    kannGenehmigen:     profile.kann_genehmigen     || false,
    kannAdministrieren: profile.kann_administrieren || false,
  };
}

function mapUserToDb(user) {
  return {
    first_name:          user.firstName,
    last_name:           user.lastName,
    email:               user.email,
    phone:               user.phone || null,
    operator_id:         user.operatorId || null,
    is_passive:          user.isPassive          || false,
    ist_trainer:         user.istTrainer         || false,
    kann_buchen:         user.kannBuchen         || false,
    kann_genehmigen:     user.kannGenehmigen     || false,
    kann_administrieren: user.kannAdministrieren || false,
  };
}

function mapFacility(f) {
  return { id: f.id, name: f.name, street: f.street || '', houseNumber: f.house_number || '', zip: f.zip || '', city: f.city || '', sortOrder: f.sort_order };
}
function mapResourceGroup(g) {
  return { id: g.id, facilityId: g.facility_id, name: g.name, icon: g.icon, sortOrder: g.sort_order, sharedScheduling: g.shared_scheduling };
}
function buildConfigResources(allDbResources) {
  const parents  = allDbResources.filter(r => !r.parent_resource_id);
  const children = allDbResources.filter(r =>  r.parent_resource_id);
  return parents.map(r => ({
    id: r.id, groupId: r.group_id, name: r.name, color: r.color,
    splittable: r.splittable, bookingMode: r.booking_mode,
    subResources: children
      .filter(c => c.parent_resource_id === r.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(c => ({ id: c.id, name: c.name, color: c.color })),
  }));
}
function mapSlot(s) {
  return {
    id: s.id, resourceId: s.resource_id, dayOfWeek: s.day_of_week,
    startTime: s.start_time?.substring(0, 5) || s.start_time,
    endTime:   s.end_time?.substring(0, 5)   || s.end_time,
    validFrom: s.valid_from, validUntil: s.valid_until,
  };
}
function mapClub(c)       { return { id: c.id, name: c.name, shortName: c.short_name, color: c.color, isHomeClub: c.is_home_club }; }
function mapDepartment(d) { return { id: d.id, clubId: d.club_id, name: d.name, icon: d.icon || '', sortOrder: d.sort_order }; }
function mapTeam(t)       { return { id: t.id, departmentId: t.department_id, name: t.name, shortName: t.short_name, color: t.color, sortOrder: t.sort_order, eventTypes: t.event_types || ['training'] }; }
function mapTrainerAssignment(ta) { return { id: ta.id, userId: ta.user_id, teamId: ta.team_id, isPrimary: ta.is_primary }; }
function mapBooking(b) {
  return {
    id: b.id, resourceId: b.resource_id, date: b.date,
    startTime: b.start_time?.substring(0, 5) || b.start_time,
    endTime:   b.end_time?.substring(0, 5)   || b.end_time,
    title: b.title, description: b.description || '',
    bookingType: b.booking_type, userId: b.user_id,
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
    status: b.status || 'pending', series_id: b.seriesId || null,
    parent_booking: b.parentBooking || false,
  };
}

// ============================================================
// useUsers
// ============================================================
export function useUsers() {
  const [users, setUsersState] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [error,   setError]    = useState(null);
  const [isDemo,  setIsDemo]   = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: e } = await supabase.from('profiles').select('*').order('last_name');
      if (e) throw e;
      setUsersState((data || []).map(mapProfile));
      setIsDemo(false);
    } catch (err) { setUsersState([]); setIsDemo(true); setError(err.message); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = useCallback(async (userData) => {
    try {
      const { data, error: e } = await supabase.from('profiles').insert(mapUserToDb(userData)).select().single();
      if (e) throw e;
      const u = mapProfile(data);
      setUsersState(p => [...p, u]);
      return { data: u, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateUser = useCallback(async (userId, userData) => {
    try {
      const { data, error: e } = await supabase.from('profiles').update(mapUserToDb(userData)).eq('id', userId).select().single();
      if (e) throw e;
      const u = mapProfile(data);
      setUsersState(p => p.map(x => x.id === userId ? u : x));
      return { data: u, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const deleteUser = useCallback(async (userId) => {
    try {
      const { error: e } = await supabase.from('profiles').delete().eq('id', userId);
      if (e) throw e;
      setUsersState(p => p.filter(u => u.id !== userId));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  const inviteUser = useCallback(async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return { error: 'User nicht gefunden' };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        'https://zqjheewhgrmcwzjurjlg.supabase.co/functions/v1/invite-trainer',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ profileId: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }),
        }
      );
      const result = await response.json();
      if (!response.ok || result.error) return { error: result.error || 'Unbekannter Fehler' };
      setUsersState(p => p.map(u => u.id === userId
        ? { ...u, invitedAt: new Date().toISOString(), isPassive: false, kannBuchen: true }
        : u
      ));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, [users]);

  const setUsers = useCallback((v) => setUsersState(v), []);
  return { users, setUsers, loading, error, isDemo, createUser, updateUser, deleteUser, inviteUser, refreshUsers: fetchUsers };
}

// ============================================================
// useOperators
// ============================================================
export function useOperators() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading]     = useState(true);
  const fetchOperators = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('operators').select('*').order('name');
      if (error) throw error;
      setOperators(data || []);
    } catch { setOperators([]); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchOperators(); }, [fetchOperators]);
  return { operators, loading, refreshOperators: fetchOperators };
}

// ============================================================
// useFacilities
// ============================================================
export function useFacilities() {
  const [facilities,     setFacilitiesState]     = useState([]);
  const [resourceGroups, setResourceGroupsState] = useState([]);
  const [resources,      setResourcesState]      = useState([]);
  const [slots,          setSlotsState]          = useState([]);
  const [loading,        setLoading]             = useState(true);
  const [isDemo,         setIsDemo]              = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [facR, grpR, resR, slotR] = await Promise.all([
        supabase.from('facilities').select('*').order('sort_order'),
        supabase.from('resource_groups').select('*').order('sort_order'),
        supabase.from('resources').select('*').order('sort_order'),
        supabase.from('slots').select('*').order('day_of_week'),
      ]);
      if (facR.error) throw facR.error;
      if (grpR.error) throw grpR.error;
      if (resR.error) throw resR.error;
      if (slotR.error) throw slotR.error;
      if ((facR.data || []).length > 0) {
        setFacilitiesState(facR.data.map(mapFacility));
        setResourceGroupsState(grpR.data.map(mapResourceGroup));
        setResourcesState(buildConfigResources(resR.data || []));
        setSlotsState(slotR.data.map(mapSlot));
        setIsDemo(false);
      } else { setIsDemo(true); }
    } catch (err) { console.warn('Facilities nicht geladen:', err.message); setIsDemo(true); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const setFacilities     = useCallback((v) => setFacilitiesState(v),     []);
  const setResourceGroups = useCallback((v) => setResourceGroupsState(v), []);
  const setResources      = useCallback((v) => setResourcesState(v),      []);
  const setSlots          = useCallback((v) => setSlotsState(v),          []);

  return { facilities, setFacilities, resourceGroups, setResourceGroups, resources, setResources, slots, setSlots, loading, isDemo, refreshFacilities: fetchAll };
}

// ============================================================
// useOrganization  –  alle Mutationen schreiben direkt in Supabase
// ============================================================
export function useOrganization() {
  const [clubs,              setClubsState]              = useState([]);
  const [departments,        setDepartmentsState]        = useState([]);
  const [teams,              setTeamsState]              = useState([]);
  const [trainerAssignments, setTrainerAssignmentsState] = useState([]);
  const [loading,            setLoading]                 = useState(true);
  const [isDemo,             setIsDemo]                  = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [clubR, deptR, teamR, taR] = await Promise.all([
        supabase.from('clubs').select('*').order('name'),
        supabase.from('departments').select('*').order('sort_order'),
        supabase.from('teams').select('*').order('sort_order'),
        supabase.from('trainer_assignments').select('*'),
      ]);
      if (clubR.error) throw clubR.error;
      if (deptR.error) throw deptR.error;
      if (teamR.error) throw teamR.error;
      if (taR.error)   throw taR.error;
      if ((clubR.data || []).length > 0) {
        setClubsState(clubR.data.map(mapClub));
        setDepartmentsState(deptR.data.map(mapDepartment));
        setTeamsState(teamR.data.map(mapTeam));
        setTrainerAssignmentsState(taR.data.map(mapTrainerAssignment));
        setIsDemo(false);
      } else { setIsDemo(true); }
    } catch (err) { console.warn('Organization nicht geladen:', err.message); setIsDemo(true); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- Clubs ---
  const createClub = useCallback(async (clubData) => {
    try {
      const { data, error } = await supabase.from('clubs').insert({
        name: clubData.name, short_name: clubData.shortName || '',
        color: clubData.color || '#3b82f6', is_home_club: clubData.isHomeClub || false,
      }).select().single();
      if (error) throw error;
      const c = mapClub(data);
      setClubsState(p => [...p, c]);
      return { data: c, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateClub = useCallback(async (club) => {
    try {
      const { data, error } = await supabase.from('clubs').update({
        name: club.name, short_name: club.shortName || '',
        color: club.color, is_home_club: club.isHomeClub || false,
      }).eq('id', club.id).select().single();
      if (error) throw error;
      const c = mapClub(data);
      setClubsState(p => p.map(x => x.id === c.id ? c : x));
      return { data: c, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const deleteClub = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('clubs').delete().eq('id', id);
      if (error) throw error;
      setClubsState(p => p.filter(c => c.id !== id));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  // --- Departments ---
  const createDepartment = useCallback(async (deptData) => {
    try {
      const { data, error } = await supabase.from('departments').insert({
        club_id: deptData.clubId, name: deptData.name,
        icon: deptData.icon || null, sort_order: deptData.sortOrder || 0,
      }).select().single();
      if (error) throw error;
      const d = mapDepartment(data);
      setDepartmentsState(p => [...p, d]);
      return { data: d, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateDepartment = useCallback(async (dept) => {
    try {
      const { data, error } = await supabase.from('departments').update({
        name: dept.name, icon: dept.icon || null, sort_order: dept.sortOrder || 0,
      }).eq('id', dept.id).select().single();
      if (error) throw error;
      const d = mapDepartment(data);
      setDepartmentsState(p => p.map(x => x.id === d.id ? d : x));
      return { data: d, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const deleteDepartment = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
      setDepartmentsState(p => p.filter(d => d.id !== id));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  // --- Teams ---
  const createTeam = useCallback(async (teamData) => {
    try {
      const { data, error } = await supabase.from('teams').insert({
        department_id: teamData.departmentId, name: teamData.name,
        short_name: teamData.shortName || '', color: teamData.color || '#3b82f6',
        sort_order: teamData.sortOrder || 0, event_types: teamData.eventTypes || ['training'],
      }).select().single();
      if (error) throw error;
      const t = mapTeam(data);
      setTeamsState(p => [...p, t]);
      return { data: t, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateTeam = useCallback(async (team) => {
    try {
      const { data, error } = await supabase.from('teams').update({
        name: team.name, short_name: team.shortName || '',
        color: team.color, sort_order: team.sortOrder || 0,
        event_types: team.eventTypes || ['training'],
      }).eq('id', team.id).select().single();
      if (error) throw error;
      const t = mapTeam(data);
      setTeamsState(p => p.map(x => x.id === t.id ? t : x));
      return { data: t, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const deleteTeam = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
      setTeamsState(p => p.filter(t => t.id !== id));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  // --- Trainer Assignments ---
  const createTrainerAssignment = useCallback(async (userId, teamId, isPrimary) => {
    try {
      const { data, error } = await supabase.from('trainer_assignments').insert({
        user_id: userId, team_id: teamId, is_primary: isPrimary,
      }).select().single();
      if (error) throw error;
      const ta = mapTrainerAssignment(data);
      setTrainerAssignmentsState(p => [...p, ta]);
      return { data: ta, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateTrainerAssignment = useCallback(async (assignment) => {
    try {
      const { data, error } = await supabase.from('trainer_assignments').update({
        is_primary: assignment.isPrimary,
      }).eq('id', assignment.id).select().single();
      if (error) throw error;
      const ta = mapTrainerAssignment(data);
      setTrainerAssignmentsState(p => p.map(x => x.id === ta.id ? ta : x));
      return { data: ta, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const deleteTrainerAssignment = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('trainer_assignments').delete().eq('id', id);
      if (error) throw error;
      setTrainerAssignmentsState(p => p.filter(ta => ta.id !== id));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  // Setter (für Demo-Fallback in App.js)
  const setClubs              = useCallback((v) => setClubsState(v),              []);
  const setDepartments        = useCallback((v) => setDepartmentsState(v),        []);
  const setTeams              = useCallback((v) => setTeamsState(v),              []);
  const setTrainerAssignments = useCallback((v) => setTrainerAssignmentsState(v), []);

  return {
    clubs, departments, teams, trainerAssignments, loading, isDemo,
    setClubs, setDepartments, setTeams, setTrainerAssignments,
    createClub, updateClub, deleteClub,
    createDepartment, updateDepartment, deleteDepartment,
    createTeam, updateTeam, deleteTeam,
    createTrainerAssignment, updateTrainerAssignment, deleteTrainerAssignment,
    refreshOrganization: fetchAll,
  };
}

// ============================================================
// useBookings
// ============================================================
export function useBookings() {
  const [bookings, setBookingsState] = useState([]);
  const [loading,  setLoading]       = useState(true);
  const [isDemo,   setIsDemo]        = useState(false);

  const fetchBookings = useCallback(async () => {
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
  }, []);
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
    updateBookingStatus, updateSeriesStatus,
    deleteBooking, deleteBookingSeries,
    refreshBookings: fetchBookings,
  };
}

// ============================================================
// useGenehmigerResources
// ============================================================
export function useGenehmigerResources() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('genehmiger_resources').select('*');
      if (error) throw error;
      setAssignments(data || []);
    } catch (err) { console.warn('Genehmiger-Ressourcen nicht geladen:', err.message); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getResourcesForUser = useCallback((userId) =>
    assignments.filter(a => a.user_id === userId).map(a => a.resource_id)
  , [assignments]);

  const getUsersForResource = useCallback((resourceId) =>
    assignments.filter(a => a.resource_id === resourceId).map(a => a.user_id)
  , [assignments]);

  const addAssignment = useCallback(async (userId, resourceId) => {
    try {
      const { data, error } = await supabase
        .from('genehmiger_resources')
        .insert({ user_id: userId, resource_id: resourceId })
        .select().single();
      if (error) throw error;
      setAssignments(prev => [...prev, data]);
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  const removeAssignment = useCallback(async (userId, resourceId) => {
    try {
      const { error } = await supabase
        .from('genehmiger_resources')
        .delete()
        .eq('user_id', userId)
        .eq('resource_id', resourceId);
      if (error) throw error;
      setAssignments(prev => prev.filter(a => !(a.user_id === userId && a.resource_id === resourceId)));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  return { assignments, loading, getResourcesForUser, getUsersForResource, addAssignment, removeAssignment, refresh: fetchAll };
}

// ============================================================
// useHolidays  –  Ferien & Feiertage (Hessen)
// ============================================================
function mapHoliday(h) {
  return { id: h.id, name: h.name, type: h.type, startDate: h.start_date, endDate: h.end_date, year: h.year };
}

export function useHolidays() {
  const [holidays, setHolidaysState] = useState([]);
  const [loading, setLoading]        = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('holidays').select('*').order('start_date');
      if (error) throw error;
      setHolidaysState((data || []).map(mapHoliday));
    } catch (err) { console.warn('Holidays nicht geladen:', err.message); setHolidaysState([]); }
    setLoading(false);
  }, []);
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
