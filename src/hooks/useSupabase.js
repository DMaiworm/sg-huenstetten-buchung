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

/**
 * Konvertiert DB-Facility-Daten ins Legacy-Format (facilityConfig.js kompatibel)
 */
function dbFacilityToLegacy(f) {
  return {
    id: f.id,
    name: f.name,
    street: f.street || '',
    houseNumber: f.house_number || '',
    zip: f.zip || '',
    city: f.city || '',
    sortOrder: f.sort_order,
  };
}

function dbResourceGroupToLegacy(g) {
  return {
    id: g.id,
    facilityId: g.facility_id,
    name: g.name,
    icon: g.icon,
    sortOrder: g.sort_order,
    sharedScheduling: g.shared_scheduling,
  };
}

function dbResourceToLegacy(r, subResources) {
  return {
    id: r.id,
    groupId: r.group_id,
    name: r.name,
    color: r.color,
    splittable: r.splittable,
    bookingMode: r.booking_mode,
    subResources: (subResources || [])
      .filter(sr => sr.resource_id === r.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(sr => ({ id: sr.id, name: sr.name, color: sr.color })),
  };
}

function dbSlotToLegacy(s) {
  return {
    id: s.id,
    resourceId: s.resource_id,
    dayOfWeek: s.day_of_week,
    startTime: s.start_time?.substring(0, 5) || s.start_time,
    endTime: s.end_time?.substring(0, 5) || s.end_time,
    validFrom: s.valid_from,
    validUntil: s.valid_until,
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
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('last_name', { ascending: true });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setUsersState(data.map(profileToLegacyUser));
        setIsDemo(false);
      } else {
        setUsersState(DEMO_USERS_FALLBACK.map(profileToLegacyUser));
        setIsDemo(true);
      }
    } catch (err) {
      console.warn('Supabase nicht erreichbar, nutze Demo-Daten:', err.message);
      setUsersState(DEMO_USERS_FALLBACK.map(profileToLegacyUser));
      setIsDemo(true);
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = useCallback(async (userData) => {
    if (isDemo) {
      const newUser = { ...userData, id: 'demo-' + Date.now() };
      setUsersState(prev => [...prev, newUser]);
      return { data: newUser, error: null };
    }
    try {
      const profile = legacyUserToProfile(userData);
      const { data, error: insertError } = await supabase
        .from('profiles').insert(profile).select().single();
      if (insertError) throw insertError;
      const legacyUser = profileToLegacyUser(data);
      setUsersState(prev => [...prev, legacyUser]);
      return { data: legacyUser, error: null };
    } catch (err) {
      console.error('Fehler beim Erstellen:', err);
      return { data: null, error: err.message };
    }
  }, [isDemo]);

  const updateUser = useCallback(async (userId, userData) => {
    if (isDemo) {
      setUsersState(prev => prev.map(u => u.id === userId ? { ...userData, id: userId } : u));
      return { data: userData, error: null };
    }
    try {
      const profile = legacyUserToProfile(userData);
      const { data, error: updateError } = await supabase
        .from('profiles').update(profile).eq('id', userId).select().single();
      if (updateError) throw updateError;
      const legacyUser = profileToLegacyUser(data);
      setUsersState(prev => prev.map(u => u.id === userId ? legacyUser : u));
      return { data: legacyUser, error: null };
    } catch (err) {
      console.error('Fehler beim Aktualisieren:', err);
      return { data: null, error: err.message };
    }
  }, [isDemo]);

  const deleteUser = useCallback(async (userId) => {
    if (isDemo) {
      setUsersState(prev => prev.filter(u => u.id !== userId));
      return { error: null };
    }
    try {
      const { error: deleteError } = await supabase
        .from('profiles').delete().eq('id', userId);
      if (deleteError) throw deleteError;
      setUsersState(prev => prev.filter(u => u.id !== userId));
      return { error: null };
    } catch (err) {
      console.error('Fehler beim Löschen:', err);
      return { data: null, error: err.message };
    }
  }, [isDemo]);

  const setUsers = useCallback((v) => {
    typeof v === 'function' ? setUsersState(v) : setUsersState(v);
  }, []);

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
      if (error) throw error;
      setOperators(data || []);
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
// useFacilities Hook – Lädt Facilities, Groups, Resources, SubResources, Slots
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
      // Parallele Abfragen für alle Tabellen
      const [facResult, groupResult, resResult, subResult, slotResult] = await Promise.all([
        supabase.from('facilities').select('*').order('sort_order'),
        supabase.from('resource_groups').select('*').order('sort_order'),
        supabase.from('resources').select('*').order('sort_order'),
        supabase.from('sub_resources').select('*').order('sort_order'),
        supabase.from('slots').select('*').order('day_of_week'),
      ]);

      if (facResult.error) throw facResult.error;
      if (groupResult.error) throw groupResult.error;
      if (resResult.error) throw resResult.error;
      if (subResult.error) throw subResult.error;
      if (slotResult.error) throw slotResult.error;

      const dbFacilities = facResult.data || [];
      const dbGroups = groupResult.data || [];
      const dbResources = resResult.data || [];
      const dbSubResources = subResult.data || [];
      const dbSlots = slotResult.data || [];

      if (dbFacilities.length > 0) {
        setFacilitiesState(dbFacilities.map(dbFacilityToLegacy));
        setResourceGroupsState(dbGroups.map(dbResourceGroupToLegacy));
        setResourcesState(dbResources.map(r => dbResourceToLegacy(r, dbSubResources)));
        setSlotsState(dbSlots.map(dbSlotToLegacy));
        setIsDemo(false);
      } else {
        // Keine Daten → Legacy-Imports bleiben aktiv (App.js Fallback)
        setIsDemo(true);
      }
    } catch (err) {
      console.warn('Facilities nicht aus DB geladen:', err.message);
      setIsDemo(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Setter für Abwärtskompatibilität (FacilityManagement nutzt diese)
  const setFacilities = useCallback((v) => {
    typeof v === 'function' ? setFacilitiesState(v) : setFacilitiesState(v);
  }, []);
  const setResourceGroups = useCallback((v) => {
    typeof v === 'function' ? setResourceGroupsState(v) : setResourceGroupsState(v);
  }, []);
  const setResources = useCallback((v) => {
    typeof v === 'function' ? setResourcesState(v) : setResourcesState(v);
  }, []);
  const setSlots = useCallback((v) => {
    typeof v === 'function' ? setSlotsState(v) : setSlotsState(v);
  }, []);

  return {
    facilities, setFacilities,
    resourceGroups, setResourceGroups,
    resources, setResources,
    slots, setSlots,
    loading, isDemo,
    refreshFacilities: fetchAll,
  };
}
