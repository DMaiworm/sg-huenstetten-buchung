import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================
// Konvertierungs-Hilfsfunktionen
// ============================================================

function profileToLegacyUser(profile) {
  return {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    phone: profile.phone || '',
    role: profile.role,
    operatorId: profile.operator_id,
    club: '',
    team: '',
  };
}

function legacyUserToProfile(user) {
  return {
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    operator_id: user.operatorId || null,
  };
}

function dbFacilityToLegacy(f) {
  return {
    id: f.id, name: f.name, street: f.street || '', houseNumber: f.house_number || '',
    zip: f.zip || '', city: f.city || '', sortOrder: f.sort_order,
  };
}

function dbResourceGroupToLegacy(g) {
  return {
    id: g.id, facilityId: g.facility_id, name: g.name, icon: g.icon,
    sortOrder: g.sort_order, sharedScheduling: g.shared_scheduling,
  };
}

function dbResourceToLegacy(r, subResources) {
  return {
    id: r.id, groupId: r.group_id, name: r.name, color: r.color,
    splittable: r.splittable, bookingMode: r.booking_mode,
    subResources: (subResources || [])
      .filter(sr => sr.resource_id === r.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(sr => ({ id: sr.id, name: sr.name, color: sr.color })),
  };
}

function dbSlotToLegacy(s) {
  return {
    id: s.id, resourceId: s.resource_id, dayOfWeek: s.day_of_week,
    startTime: s.start_time?.substring(0, 5) || s.start_time,
    endTime: s.end_time?.substring(0, 5) || s.end_time,
    validFrom: s.valid_from, validUntil: s.valid_until,
  };
}

function dbClubToLegacy(c) {
  return {
    id: c.id, name: c.name, shortName: c.short_name,
    color: c.color, isHomeClub: c.is_home_club,
  };
}

function dbDepartmentToLegacy(d) {
  return {
    id: d.id, clubId: d.club_id, name: d.name,
    icon: d.icon || '', sortOrder: d.sort_order,
  };
}

function dbTeamToLegacy(t) {
  return {
    id: t.id, departmentId: t.department_id, name: t.name,
    shortName: t.short_name, color: t.color, sortOrder: t.sort_order,
    eventTypes: t.event_types || ['training'],
  };
}

function dbTrainerAssignmentToLegacy(ta) {
  return {
    id: ta.id, userId: ta.user_id, teamId: ta.team_id,
    isPrimary: ta.is_primary,
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
      const { data, error: fetchError } = await supabase.from('profiles').select('*').order('last_name', { ascending: true });
      if (fetchError) throw fetchError;
      if (data && data.length > 0) { setUsersState(data.map(profileToLegacyUser)); setIsDemo(false); }
      else { setUsersState(DEMO_USERS_FALLBACK.map(profileToLegacyUser)); setIsDemo(true); }
    } catch (err) {
      console.warn('Supabase nicht erreichbar:', err.message);
      setUsersState(DEMO_USERS_FALLBACK.map(profileToLegacyUser)); setIsDemo(true); setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = useCallback(async (userData) => {
    if (isDemo) { const n = { ...userData, id: 'demo-' + Date.now() }; setUsersState(p => [...p, n]); return { data: n, error: null }; }
    try {
      const { data, error: e } = await supabase.from('profiles').insert(legacyUserToProfile(userData)).select().single();
      if (e) throw e; const u = profileToLegacyUser(data); setUsersState(p => [...p, u]); return { data: u, error: null };
    } catch (err) { console.error('Fehler:', err); return { data: null, error: err.message }; }
  }, [isDemo]);

  const updateUser = useCallback(async (userId, userData) => {
    if (isDemo) { setUsersState(p => p.map(u => u.id === userId ? { ...userData, id: userId } : u)); return { data: userData, error: null }; }
    try {
      const { data, error: e } = await supabase.from('profiles').update(legacyUserToProfile(userData)).eq('id', userId).select().single();
      if (e) throw e; const u = profileToLegacyUser(data); setUsersState(p => p.map(x => x.id === userId ? u : x)); return { data: u, error: null };
    } catch (err) { console.error('Fehler:', err); return { data: null, error: err.message }; }
  }, [isDemo]);

  const deleteUser = useCallback(async (userId) => {
    if (isDemo) { setUsersState(p => p.filter(u => u.id !== userId)); return { error: null }; }
    try {
      const { error: e } = await supabase.from('profiles').delete().eq('id', userId);
      if (e) throw e; setUsersState(p => p.filter(u => u.id !== userId)); return { error: null };
    } catch (err) { console.error('Fehler:', err); return { data: null, error: err.message }; }
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
    } catch (err) {
      console.warn('Operators nicht geladen:', err.message);
      setOperators([{ id: 'a0000000-0000-0000-0000-000000000001', name: 'SG Hünstetten', type: 'verein', primary_color: '#2563eb' }]);
    }
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
      if (facR.error) throw facR.error;
      if (grpR.error) throw grpR.error;
      if (resR.error) throw resR.error;
      if (subR.error) throw subR.error;
      if (slotR.error) throw slotR.error;

      if ((facR.data || []).length > 0) {
        setFacilitiesState((facR.data).map(dbFacilityToLegacy));
        setResourceGroupsState((grpR.data).map(dbResourceGroupToLegacy));
        setResourcesState((resR.data).map(r => dbResourceToLegacy(r, subR.data)));
        setSlotsState((slotR.data).map(dbSlotToLegacy));
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

  return {
    facilities, setFacilities, resourceGroups, setResourceGroups,
    resources, setResources, slots, setSlots,
    loading, isDemo, refreshFacilities: fetchAll,
  };
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
      if (clubR.error) throw clubR.error;
      if (deptR.error) throw deptR.error;
      if (teamR.error) throw teamR.error;
      if (taR.error) throw taR.error;

      if ((clubR.data || []).length > 0) {
        setClubsState((clubR.data).map(dbClubToLegacy));
        setDepartmentsState((deptR.data).map(dbDepartmentToLegacy));
        setTeamsState((teamR.data).map(dbTeamToLegacy));
        setTrainerAssignmentsState((taR.data).map(dbTrainerAssignmentToLegacy));
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

  return {
    clubs, setClubs, departments, setDepartments,
    teams, setTeams, trainerAssignments, setTrainerAssignments,
    loading, isDemo, refreshOrganization: fetchAll,
  };
}
