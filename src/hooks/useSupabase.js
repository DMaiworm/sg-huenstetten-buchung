/**
 * Supabase hooks for data loading and CRUD operations.
 *
 * Hooks: useUsers, useOperators, useFacilities, useOrganization, useBookings, useGenehmigerResources
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================
// Conversion helpers
// ============================================================

function profileToLegacyUser(profile) {
  return {
    id: profile.id, firstName: profile.first_name, lastName: profile.last_name,
    email: profile.email, phone: profile.phone || '', role: profile.role,
    operatorId: profile.operator_id, club: '', team: '',
    isPassive: profile.is_passive || false,
  };
}

function legacyUserToProfile(user) {
  return {
    first_name: user.firstName, last_name: user.lastName, email: user.email,
    phone: user.phone || null, role: user.role, operator_id: user.operatorId || null,
    is_passive: user.isPassive || false,
  };
}

function dbFacilityToLegacy(f) {
  return { id: f.id, name: f.name, street: f.street || '', houseNumber: f.house_number || '', zip: f.zip || '', city: f.city || '', sortOrder: f.sort_order };
}

function dbResourceGroupToLegacy(g) {
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

function dbSlotToLegacy(s) {
  return {
    id: s.id, resourceId: s.resource_id, dayOfWeek: s.day_of_week,
    startTime: s.start_time?.substring(0, 5) || s.start_time,
    endTime:   s.end_time?.substring(0, 5)   || s.end_time,
    validFrom: s.valid_from, validUntil: s.valid_until,
  };
}

function dbClubToLegacy(c)  { return { id: c.id, name: c.name, shortName: c.short_name, color: c.color, isHomeClub: c.is_home_club }; }
function dbDepartmentToLegacy(d) { return { id: d.id, clubId: d.club_id, name: d.name, icon: d.icon || '', sortOrder: d.sort_order }; }
function dbTeamToLegacy(t)  { return { id: t.id, departmentId: t.department_id, name: t.name, shortName: t.short_name, color: t.color, sortOrder: t.sort_order, eventTypes: t.event_types || ['training'] }; }
function dbTrainerAssignmentToLegacy(ta) { return { id: ta.id, userId: ta.user_id, teamId: ta.team_id, isPrimary: ta.is_primary }; }

function dbBookingToLegacy(b) {
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

function legacyBookingToDb(b) {
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
      if (data && data.length > 0) { setUsersState(data.map(profileToLegacyUser)); setIsDemo(false); }
      else { setUsersState([]); setIsDemo(false); }
    } catch (err) { setUsersState([]); setIsDemo(true); setError(err.message); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = useCallback(async (userData) => {
    try {
      const { data, error: e } = await supabase.from('profiles').insert(legacyUserToProfile(userData)).select().single();
      if (e) throw e;
      const u = profileToLegacyUser(data);
      setUsersState(p => [...p, u]);
      return { data: u, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateUser = useCallback(async (userId, userData) => {
    try {
      const { data, error: e } = await supabase.from('profiles').update(legacyUserToProfile(userData)).eq('id', userId).select().single();
      if (e) throw e;
      const u = profileToLegacyUser(data);
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

  const setUsers = useCallback((v) => setUsersState(v), []);
  return { users, setUsers, loading, error, isDemo, createUser, updateUser, deleteUser, refreshUsers: fetchUsers };
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
        setFacilitiesState(facR.data.map(dbFacilityToLegacy));
        setResourceGroupsState(grpR.data.map(dbResourceGroupToLegacy));
        setResourcesState(buildConfigResources(resR.data || []));
        setSlotsState(slotR.data.map(dbSlotToLegacy));
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
// useOrganization
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
        setClubsState(clubR.data.map(dbClubToLegacy));
        setDepartmentsState(deptR.data.map(dbDepartmentToLegacy));
        setTeamsState(teamR.data.map(dbTeamToLegacy));
        setTrainerAssignmentsState(taR.data.map(dbTrainerAssignmentToLegacy));
        setIsDemo(false);
      } else { setIsDemo(true); }
    } catch (err) { console.warn('Organization nicht geladen:', err.message); setIsDemo(true); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const setClubs              = useCallback((v) => setClubsState(v),              []);
  const setDepartments        = useCallback((v) => setDepartmentsState(v),        []);
  const setTeams              = useCallback((v) => setTeamsState(v),              []);
  const setTrainerAssignments = useCallback((v) => setTrainerAssignmentsState(v), []);

  return { clubs, setClubs, departments, setDepartments, teams, setTeams, trainerAssignments, setTrainerAssignments, loading, isDemo, refreshOrganization: fetchAll };
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
      setBookingsState((data || []).map(dbBookingToLegacy));
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
      const { data, error } = await supabase.from('bookings').insert(legacyBookingToDb(bookingData)).select().single();
      if (error) throw error;
      const legacy = dbBookingToLegacy(data);
      setBookingsState(prev => [...prev, legacy]);
      return { data: legacy, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const createBookings = useCallback(async (bookingsArray) => {
    try {
      const { data, error } = await supabase.from('bookings').insert(bookingsArray.map(legacyBookingToDb)).select();
      if (error) throw error;
      const legacyArray = (data || []).map(dbBookingToLegacy);
      setBookingsState(prev => [...prev, ...legacyArray]);
      return { data: legacyArray, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateBookingStatus = useCallback(async (bookingId, status) => {
    try {
      const { data, error } = await supabase.from('bookings').update({ status }).eq('id', bookingId).select().single();
      if (error) throw error;
      const legacy = dbBookingToLegacy(data);
      setBookingsState(prev => prev.map(b => b.id === bookingId ? legacy : b));
      return { data: legacy, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateSeriesStatus = useCallback(async (seriesId, status) => {
    try {
      const { data, error } = await supabase.from('bookings').update({ status }).eq('series_id', seriesId).select();
      if (error) throw error;
      const legacyArray = (data || []).map(dbBookingToLegacy);
      const updatedIds  = new Set(legacyArray.map(b => b.id));
      setBookingsState(prev => prev.map(b => updatedIds.has(b.id) ? legacyArray.find(u => u.id === b.id) : b));
      return { data: legacyArray, error: null };
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

  const getResourcesForUser = useCallback((userId) => {
    return assignments.filter(a => a.user_id === userId).map(a => a.resource_id);
  }, [assignments]);

  const getUsersForResource = useCallback((resourceId) => {
    return assignments.filter(a => a.resource_id === resourceId).map(a => a.user_id);
  }, [assignments]);

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
