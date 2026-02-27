/**
 * useOrganization – Vereine, Abteilungen, Mannschaften & Trainer-Zuordnungen (CRUD)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function mapClub(c)       { return { id: c.id, name: c.name, shortName: c.short_name, color: c.color, isHomeClub: c.is_home_club }; }
function mapDepartment(d) { return { id: d.id, clubId: d.club_id, name: d.name, icon: d.icon || '', sortOrder: d.sort_order }; }
function mapTeam(t)       { return { id: t.id, departmentId: t.department_id, name: t.name, shortName: t.short_name, color: t.color, sortOrder: t.sort_order, eventTypes: t.event_types || ['training'], istJugendmannschaft: t.ist_jugendmannschaft || false }; }
function mapTrainerAssignment(ta) { return { id: ta.id, userId: ta.user_id, teamId: ta.team_id, isPrimary: ta.is_primary }; }

export function useOrganization() {
  const { user } = useAuth();
  const [clubs,              setClubsState]              = useState([]);
  const [departments,        setDepartmentsState]        = useState([]);
  const [teams,              setTeamsState]              = useState([]);
  const [trainerAssignments, setTrainerAssignmentsState] = useState([]);
  const [loading,            setLoading]                 = useState(true);
  const [isDemo,             setIsDemo]                  = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
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
  }, [user]);
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
        ist_jugendmannschaft: teamData.istJugendmannschaft || false,
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
        ist_jugendmannschaft: team.istJugendmannschaft || false,
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
