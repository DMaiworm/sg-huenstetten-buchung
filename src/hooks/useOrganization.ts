/**
 * useOrganization – Vereine, Abteilungen, Mannschaften & Trainer-Zuordnungen (CRUD)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type {
  Club, ClubCreateData,
  Department, DepartmentCreateData,
  Team, TeamCreateData,
  TrainerAssignment,
  BookingType,
  DbResult, DbDeleteResult,
} from '../types';

function mapClub(c: Record<string, unknown>): Club {
  return { id: c.id as string, name: c.name as string, shortName: c.short_name as string, color: c.color as string, isHomeClub: c.is_home_club as boolean };
}
function mapDepartment(d: Record<string, unknown>): Department {
  return { id: d.id as string, clubId: d.club_id as string, name: d.name as string, icon: (d.icon as string) || '', sortOrder: d.sort_order as number };
}
function mapTeam(t: Record<string, unknown>): Team {
  return { id: t.id as string, departmentId: t.department_id as string, name: t.name as string, shortName: t.short_name as string, color: t.color as string, sortOrder: t.sort_order as number, eventTypes: (t.event_types as BookingType[]) || ['training'], istJugendmannschaft: (t.ist_jugendmannschaft as boolean) || false };
}
function mapTrainerAssignment(ta: Record<string, unknown>): TrainerAssignment {
  return { id: ta.id as string, userId: ta.user_id as string, teamId: ta.team_id as string, isPrimary: ta.is_primary as boolean };
}

export function useOrganization() {
  const { user } = useAuth();
  const [clubs,              setClubsState]              = useState<Club[]>([]);
  const [departments,        setDepartmentsState]        = useState<Department[]>([]);
  const [teams,              setTeamsState]              = useState<Team[]>([]);
  const [trainerAssignments, setTrainerAssignmentsState] = useState<TrainerAssignment[]>([]);
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
    } catch (err) { console.warn('Organization nicht geladen:', (err as Error).message); setIsDemo(true); }
    setLoading(false);
  }, [user]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- Clubs ---
  const createClub = useCallback(async (clubData: ClubCreateData): Promise<DbResult<Club>> => {
    try {
      const { data, error } = await supabase.from('clubs').insert({
        name: clubData.name, short_name: clubData.shortName || '',
        color: clubData.color || '#3b82f6', is_home_club: clubData.isHomeClub || false,
      }).select().single();
      if (error) throw error;
      const c = mapClub(data);
      setClubsState(p => [...p, c]);
      return { data: c, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const updateClub = useCallback(async (club: Club): Promise<DbResult<Club>> => {
    try {
      const { data, error } = await supabase.from('clubs').update({
        name: club.name, short_name: club.shortName || '',
        color: club.color, is_home_club: club.isHomeClub || false,
      }).eq('id', club.id).select().single();
      if (error) throw error;
      const c = mapClub(data);
      setClubsState(p => p.map(x => x.id === c.id ? c : x));
      return { data: c, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const deleteClub = useCallback(async (id: string): Promise<DbDeleteResult> => {
    try {
      const { error } = await supabase.from('clubs').delete().eq('id', id);
      if (error) throw error;
      setClubsState(p => p.filter(c => c.id !== id));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  // --- Departments ---
  const createDepartment = useCallback(async (deptData: DepartmentCreateData): Promise<DbResult<Department>> => {
    try {
      const { data, error } = await supabase.from('departments').insert({
        club_id: deptData.clubId, name: deptData.name,
        icon: deptData.icon || null, sort_order: deptData.sortOrder || 0,
      }).select().single();
      if (error) throw error;
      const d = mapDepartment(data);
      setDepartmentsState(p => [...p, d]);
      return { data: d, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const updateDepartment = useCallback(async (dept: Department): Promise<DbResult<Department>> => {
    try {
      const { data, error } = await supabase.from('departments').update({
        name: dept.name, icon: dept.icon || null, sort_order: dept.sortOrder || 0,
      }).eq('id', dept.id).select().single();
      if (error) throw error;
      const d = mapDepartment(data);
      setDepartmentsState(p => p.map(x => x.id === d.id ? d : x));
      return { data: d, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const deleteDepartment = useCallback(async (id: string): Promise<DbDeleteResult> => {
    try {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
      setDepartmentsState(p => p.filter(d => d.id !== id));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  // --- Teams ---
  const createTeam = useCallback(async (teamData: TeamCreateData): Promise<DbResult<Team>> => {
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
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const updateTeam = useCallback(async (team: Team): Promise<DbResult<Team>> => {
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
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const deleteTeam = useCallback(async (id: string): Promise<DbDeleteResult> => {
    try {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
      setTeamsState(p => p.filter(t => t.id !== id));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  // --- Trainer Assignments ---
  const createTrainerAssignment = useCallback(async (userId: string, teamId: string, isPrimary: boolean): Promise<DbResult<TrainerAssignment>> => {
    try {
      const { data, error } = await supabase.from('trainer_assignments').insert({
        user_id: userId, team_id: teamId, is_primary: isPrimary,
      }).select().single();
      if (error) throw error;
      const ta = mapTrainerAssignment(data);
      setTrainerAssignmentsState(p => [...p, ta]);
      return { data: ta, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const updateTrainerAssignment = useCallback(async (assignment: TrainerAssignment): Promise<DbResult<TrainerAssignment>> => {
    try {
      const { data, error } = await supabase.from('trainer_assignments').update({
        is_primary: assignment.isPrimary,
      }).eq('id', assignment.id).select().single();
      if (error) throw error;
      const ta = mapTrainerAssignment(data);
      setTrainerAssignmentsState(p => p.map(x => x.id === ta.id ? ta : x));
      return { data: ta, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const deleteTrainerAssignment = useCallback(async (id: string): Promise<DbDeleteResult> => {
    try {
      const { error } = await supabase.from('trainer_assignments').delete().eq('id', id);
      if (error) throw error;
      setTrainerAssignmentsState(p => p.filter(ta => ta.id !== id));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  const setClubs              = useCallback((v: Club[]) => setClubsState(v),              []);
  const setDepartments        = useCallback((v: Department[]) => setDepartmentsState(v),        []);
  const setTeams              = useCallback((v: Team[]) => setTeamsState(v),              []);
  const setTrainerAssignments = useCallback((v: TrainerAssignment[]) => setTrainerAssignmentsState(v), []);

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
