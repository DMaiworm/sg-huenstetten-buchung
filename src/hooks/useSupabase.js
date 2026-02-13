import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================
// Konvertierungs-Hilfsfunktionen
// ============================================================

function profileToLegacyUser(profile) {
  return {
    id: profile.id, firstName: profile.first_name, lastName: profile.last_name,
    email: profile.email, phone: profile.phone || '', role: profile.role,
    operatorId: profile.operator_id, club: '', team: '',
  };
}

function legacyUserToProfile(user) {
  return {
    first_name: user.firstName, last_name: user.lastName, email: user.email,
    phone: user.phone || null, role: user.role, operator_id: user.operatorId || null,
  };
}

function dbFacilityToLegacy(f) {
  return { id: f.id, name: f.name, street: f.street || '', houseNumber: f.house_number || '', zip: f.zip || '', city: f.city || '', sortOrder: f.sort_order };
}
function dbResourceGroupToLegacy(g) {
  return { id: g.id, facilityId: g.facility_id, name: g.name, icon: g.icon, sortOrder: g.sort_order, sharedScheduling: g.shared_scheduling };
}
function dbResourceToLegacy(r, subResources) {
  return {
    id: r.id, groupId: r.group_id, name: r.name, color: r.color, splittable: r.splittable, bookingMode: r.booking_mode,
    subResources: (subResources || []).filter(sr => sr.resource_id === r.id).sort((a, b) => a.sort_order - b.sort_order).map(sr => ({ id: sr.id, name: sr.name, color: sr.color })),
  };
}
function dbSlotToLegacy(s) {
  return { id: s.id, resourceId: s.resource_id, dayOfWeek: s.day_of_week, startTime: s.start_time?.substring(0, 5) || s.start_time, endTime: s.end_time?.substring(0, 5) || s.end_time, validFrom: s.valid_from, validUntil: s.valid_until };
}
function dbClubToLegacy(c) {
  return { id: c.id, name: c.name, shortName: c.short_name, color: c.color, isHomeClub: c.is_home_club };
}
function dbDepartmentToLegacy(d) {
  return { id: d.id, clubId: d.club_id, name: d.name, icon: d.icon || '', sortOrder: d.sort_order };
}
function dbTeamToLegacy(t) {
  return { id: t.id, departmentId: t.department_id, name: t.name, shortName: t.short_name, color: t.color, sortOrder: t.sort_order, eventTypes: t.event_types || ['training'] };
}
function dbTrainerAssignmentToLegacy(ta) {
  return { id: ta.id, userId: ta.user_id, teamId: ta.team_id, isPrimary: ta.is_primary };
}

function dbBookingToLegacy(b) {
  return {
    id: b.id, resourceId: b.resource_id, date: b.date,
    startTime: b.start_time?.substring(0, 5) || b.start_time,
    endTime: b.end_time?.substring(0, 5) || b.end_time,
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

// Fallback Demo-Daten
const DEMO_USERS_FALLBACK = [
  { id: 'demo-1', first_name: 'Max', last_name: 'Müller', email: 'max.mueller@sg-huenstetten.de', phone: '0171-1234567', role: 'trainer', operator_id: null },
  { id: 'demo-2', first_name: 'Anna', last_name: 'Schmidt', email: 'anna.schmidt@sg-huenstetten.de', phone: '0172-2345678', role: 'trainer', operator_id: null },
  { id: 'demo-3', first_name: 'Tom', last_name: 'Weber', email: 'tom.weber@sg-huenstetten.de', phone: '0173-3456789', role: 'trainer', operator_id: null },
  { id: 'demo-4', first_name: 'Lisa', last_name: 'Braun', email: 'lisa.braun@sg-huenstetten.de', phone: '0174-4567890', role: 'trainer', operator_id: null },
  { id: 'demo-5', first_name: 'Hans', last_name: 'Meier', email: 'hans.meier@sg-huenstetten.de', phone: '0175-5678901', role: 'trainer', operator_id: null },
  { id: 'demo-6', first_name: 'Peter', last_name: 'König', email: 'peter.koenig@sg-huenstetten.de', phone: '0176-6789012', role: 'admin', operator_id: 'a0000000-0000-0000-0000-000000000001' },
  { id: 'demo-7', first_name: 'Sandra', last_name: 'Fischer', email: 'sandra.fischer@tv-idstein.de', phone: '0177-7890123', role: 'extern', operator_id: null },
  { id: 'demo-8', first_name: 'Michael', last_name: 'Wagner', email: 'm.wagner@tsv-wallrabenstein.de', phone: '0178-8901234', role: 'extern', operator_id: null },
];

// ============================================================
// useUsers Hook
// ============================================================
export function useUsers() {
  const [users, setUsersState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: e } = await supabase.from('profiles').select('*').order('last_name', { ascending: true });
      if (e) throw e;
      if (data && data.length > 0) { setUsersState(data.map(profileToLegacyUser)); setIsDemo(false); }
      else { setUsersState(DEMO_USERS_FALLBACK.map(profileToLegacyUser)); setIsDemo(true); }
    } catch (err) { setUsersState(DEMO_USERS_FALLBACK.map(profileToLegacyUser)); setIsDemo(true); setError(err.message); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = useCallback(async (userData) => {
    if (isDemo) { const n = { ...userData, id: 'demo-' + Date.now() }; setUsersState(p => [...p, n]); return { data: n, error: null }; }
    try {
      const { data, error: e } = await supabase.from('profiles').insert(legacyUserToProfile(userData)).select().single();
      if (e) throw e; const u = profileToLegacyUser(data); setUsersState(p => [...p, u]); return { data: u, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, [isDemo]);

  const updateUser = useCallback(async (userId, userData) => {
    if (isDemo) { setUsersState(p => p.map(u => u.id === userId ? { ...userData, id: userId } : u)); return { data: userData, error: null }; }
    try {
      const { data, error: e } = await supabase.from('profiles').update(legacyUserToProfile(userData)).eq('id', userId).select().single();
      if (e) throw e; const u = profileToLegacyUser(data); setUsersState(p => p.map(x => x.id === userId ? u : x)); return { data: u, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, [isDemo]);

  const deleteUser = useCallback(async (userId) => {
    if (isDemo) { setUsersState(p => p.filter(u => u.id !== userId)); return { error: null }; }
    try {
      const { error: e } = await supabase.from('profiles').delete().eq('id', userId);
      if (e) throw e; setUsersState(p => p.filter(u => u.id !== userId)); return { error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, [isDemo]);

  const setUsers = useCallback((v) => { typeof v === 'function' ? setUsersState(v) : setUsersState(v); }, []);
  return { users, setUsers, loading, error, isDemo, createUser, updateUser, deleteUser, refreshUsers: fetchUsers };
}

// ============================================================
// useOperators Hook
// ============================================================
export function useOperators() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchOperators = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('operators').select('*').order('name');
      if (error) throw error; setOperators(data || []);
    } catch (err) { setOperators([{ id: 'a0000000-0000-0000-0000-000000000001', name: 'SG Hünstetten', type: 'verein', primary_color: '#2563eb' }]); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchOperators(); }, [fetchOperators]);
  return { operators, loading, refreshOperators: fetchOperators };
}

// ============================================================
// useFacilities Hook
// ============================================================
export function useFacilities() {
  const [facilities, setFacilitiesState] = useState([]);
  const [resourceGroups, setResourceGroupsState] = useState([]);
  const [resources, setResourcesState] = useState([]);
  const [slots, setSlotsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [facR, grpR, resR, subR, slotR] = await Promise.all([
        supabase.from('facilities').select('*').order('sort_order'),
        supabase.from('resource_groups').select('*').order('sort_order'),
        supabase.from('resources').select('*').order('sort_order'),
        supabase.from('sub_resources').select('*').order('sort_order'),
        supabase.from('slots').select('*').order('day_of_week'),
      ]);
      if (facR.error) throw facR.error; if (grpR.error) throw grpR.error;
      if (resR.error) throw resR.error; if (subR.error) throw subR.error; if (slotR.error) throw slotR.error;
      if ((facR.data || []).length > 0) {
        setFacilitiesState(facR.data.map(dbFacilityToLegacy));
        setResourceGroupsState(grpR.data.map(dbResourceGroupToLegacy));
        setResourcesState(resR.data.map(r => dbResourceToLegacy(r, subR.data)));
        setSlotsState(slotR.data.map(dbSlotToLegacy));
        setIsDemo(false);
      } else { setIsDemo(true); }
    } catch (err) { console.warn('Facilities nicht geladen:', err.message); setIsDemo(true); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const setFacilities = useCallback((v) => { typeof v === 'function' ? setFacilitiesState(v) : setFacilitiesState(v); }, []);
  const setResourceGroups = useCallback((v) => { typeof v === 'function' ? setResourceGroupsState(v) : setResourceGroupsState(v); }, []);
  const setResources = useCallback((v) => { typeof v === 'function' ? setResourcesState(v) : setResourcesState(v); }, []);
  const setSlots = useCallback((v) => { typeof v === 'function' ? setSlotsState(v) : setSlotsState(v); }, []);

  return { facilities, setFacilities, resourceGroups, setResourceGroups, resources, setResources, slots, setSlots, loading, isDemo, refreshFacilities: fetchAll };
}

// ============================================================
// useOrganization Hook
// ============================================================
export function useOrganization() {
  const [clubs, setClubsState] = useState([]);
  const [departments, setDepartmentsState] = useState([]);
  const [teams, setTeamsState] = useState([]);
  const [trainerAssignments, setTrainerAssignmentsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [clubR, deptR, teamR, taR] = await Promise.all([
        supabase.from('clubs').select('*').order('name'),
        supabase.from('departments').select('*').order('sort_order'),
        supabase.from('teams').select('*').order('sort_order'),
        supabase.from('trainer_assignments').select('*'),
      ]);
      if (clubR.error) throw clubR.error; if (deptR.error) throw deptR.error;
      if (teamR.error) throw teamR.error; if (taR.error) throw taR.error;
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

  const setClubs = useCallback((v) => { typeof v === 'function' ? setClubsState(v) : setClubsState(v); }, []);
  const setDepartments = useCallback((v) => { typeof v === 'function' ? setDepartmentsState(v) : setDepartmentsState(v); }, []);
  const setTeams = useCallback((v) => { typeof v === 'function' ? setTeamsState(v) : setTeamsState(v); }, []);
  const setTrainerAssignments = useCallback((v) => { typeof v === 'function' ? setTrainerAssignmentsState(v) : setTrainerAssignmentsState(v); }, []);

  return { clubs, setClubs, departments, setDepartments, teams, setTeams, trainerAssignments, setTrainerAssignments, loading, isDemo, refreshOrganization: fetchAll };
}

// ============================================================
// useBookings Hook
// ============================================================
export function useBookings() {
  const [bookings, setBookingsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('bookings').select('*').order('date', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        setBookingsState(data.map(dbBookingToLegacy));
        setIsDemo(false);
      } else {
        // DB erreichbar aber leer → leere Liste (keine Demo-Bookings mehr nötig)
        setBookingsState([]);
        setIsDemo(false);
      }
    } catch (err) {
      console.warn('Bookings nicht geladen:', err.message);
      setBookingsState([]);
      setIsDemo(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Buchung erstellen (einzeln oder mehrere für Serien)
  const createBooking = useCallback(async (bookingData) => {
    try {
      const dbData = legacyBookingToDb(bookingData);
      const { data, error } = await supabase.from('bookings').insert(dbData).select().single();
      if (error) throw error;
      const legacy = dbBookingToLegacy(data);
      setBookingsState(prev => [...prev, legacy]);
      return { data: legacy, error: null };
    } catch (err) {
      console.error('Buchung erstellen fehlgeschlagen:', err);
      return { data: null, error: err.message };
    }
  }, []);

  // Mehrere Buchungen auf einmal (Serien)
  const createBookings = useCallback(async (bookingsArray) => {
    try {
      const dbArray = bookingsArray.map(legacyBookingToDb);
      const { data, error } = await supabase.from('bookings').insert(dbArray).select();
      if (error) throw error;
      const legacyArray = (data || []).map(dbBookingToLegacy);
      setBookingsState(prev => [...prev, ...legacyArray]);
      return { data: legacyArray, error: null };
    } catch (err) {
      console.error('Buchungen erstellen fehlgeschlagen:', err);
      return { data: null, error: err.message };
    }
  }, []);

  // Buchung Status aktualisieren (approve/reject)
  const updateBookingStatus = useCallback(async (bookingId, status) => {
    try {
      const { data, error } = await supabase.from('bookings').update({ status }).eq('id', bookingId).select().single();
      if (error) throw error;
      const legacy = dbBookingToLegacy(data);
      setBookingsState(prev => prev.map(b => b.id === bookingId ? legacy : b));
      return { data: legacy, error: null };
    } catch (err) {
      console.error('Status-Update fehlgeschlagen:', err);
      return { data: null, error: err.message };
    }
  }, []);

  // Einzelne Buchung löschen
  const deleteBooking = useCallback(async (bookingId) => {
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
      if (error) throw error;
      setBookingsState(prev => prev.filter(b => b.id !== bookingId));
      return { error: null };
    } catch (err) {
      console.error('Löschen fehlgeschlagen:', err);
      return { error: err.message };
    }
  }, []);

  // Serie löschen
  const deleteBookingSeries = useCallback(async (seriesId) => {
    try {
      const { error } = await supabase.from('bookings').delete().eq('series_id', seriesId);
      if (error) throw error;
      setBookingsState(prev => prev.filter(b => b.seriesId !== seriesId));
      return { error: null };
    } catch (err) {
      console.error('Serie löschen fehlgeschlagen:', err);
      return { error: err.message };
    }
  }, []);

  // Setter für Abwärtskompatibilität
  const setBookings = useCallback((v) => { typeof v === 'function' ? setBookingsState(v) : setBookingsState(v); }, []);

  return {
    bookings, setBookings, loading, isDemo,
    createBooking, createBookings, updateBookingStatus,
    deleteBooking, deleteBookingSeries,
    refreshBookings: fetchBookings,
  };
}
