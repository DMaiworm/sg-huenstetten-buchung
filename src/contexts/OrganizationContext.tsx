import React, { createContext, useContext } from 'react';
import { useOrganization as useOrganizationHook } from '../hooks/useSupabase';
import { DEFAULT_CLUBS, DEFAULT_DEPARTMENTS, DEFAULT_TEAMS, DEFAULT_TRAINER_ASSIGNMENTS } from '../config/organizationConfig';
import type {
  Club, ClubCreateData,
  Department, DepartmentCreateData,
  Team, TeamCreateData,
  TrainerAssignment,
  DbResult, DbDeleteResult,
} from '../types';

interface OrganizationContextValue {
  clubs: Club[];
  departments: Department[];
  teams: Team[];
  trainerAssignments: TrainerAssignment[];
  createClub?: (data: ClubCreateData) => Promise<DbResult<Club>>;
  updateClub?: (club: Club) => Promise<DbResult<Club>>;
  deleteClub?: (id: string) => Promise<DbDeleteResult>;
  createDepartment?: (data: DepartmentCreateData) => Promise<DbResult<Department>>;
  updateDepartment?: (dept: Department) => Promise<DbResult<Department>>;
  deleteDepartment?: (id: string) => Promise<DbDeleteResult>;
  createTeam?: (data: TeamCreateData) => Promise<DbResult<Team>>;
  updateTeam?: (team: Team) => Promise<DbResult<Team>>;
  deleteTeam?: (id: string) => Promise<DbDeleteResult>;
  createTrainerAssignment?: (userId: string, teamId: string, isPrimary: boolean) => Promise<DbResult<TrainerAssignment>>;
  updateTrainerAssignment?: (assignment: TrainerAssignment) => Promise<DbResult<TrainerAssignment>>;
  deleteTrainerAssignment?: (id: string) => Promise<DbDeleteResult>;
  setClubs: (v: Club[]) => void;
  setDepartments: (v: Department[]) => void;
  setTeams: (v: Team[]) => void;
  setTrainerAssignments: (v: TrainerAssignment[]) => void;
  loading: boolean;
  isDemo: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const {
    clubs: dbClubs, departments: dbDepartments, teams: dbTeams, trainerAssignments: dbTrainerAssignments,
    setClubs: setDbClubs, setDepartments: setDbDepartments, setTeams: setDbTeams, setTrainerAssignments: setDbTrainerAssignments,
    createClub, updateClub, deleteClub,
    createDepartment, updateDepartment, deleteDepartment,
    createTeam, updateTeam, deleteTeam,
    createTrainerAssignment, updateTrainerAssignment, deleteTrainerAssignment,
    loading, isDemo,
  } = useOrganizationHook();

  // Demo-Fallback
  const clubs              = isDemo ? DEFAULT_CLUBS as unknown as Club[]                         : dbClubs;
  const departments        = isDemo ? DEFAULT_DEPARTMENTS as unknown as Department[]             : dbDepartments;
  const teams              = isDemo ? DEFAULT_TEAMS as unknown as Team[]                         : dbTeams;
  const trainerAssignments = isDemo ? DEFAULT_TRAINER_ASSIGNMENTS as unknown as TrainerAssignment[] : dbTrainerAssignments;

  const value: OrganizationContextValue = {
    clubs, departments, teams, trainerAssignments,
    createClub:              isDemo ? undefined : createClub,
    updateClub:              isDemo ? undefined : updateClub,
    deleteClub:              isDemo ? undefined : deleteClub,
    createDepartment:        isDemo ? undefined : createDepartment,
    updateDepartment:        isDemo ? undefined : updateDepartment,
    deleteDepartment:        isDemo ? undefined : deleteDepartment,
    createTeam:              isDemo ? undefined : createTeam,
    updateTeam:              isDemo ? undefined : updateTeam,
    deleteTeam:              isDemo ? undefined : deleteTeam,
    createTrainerAssignment: isDemo ? undefined : createTrainerAssignment,
    updateTrainerAssignment: isDemo ? undefined : updateTrainerAssignment,
    deleteTrainerAssignment: isDemo ? undefined : deleteTrainerAssignment,
    setClubs: setDbClubs, setDepartments: setDbDepartments,
    setTeams: setDbTeams, setTrainerAssignments: setDbTrainerAssignments,
    loading, isDemo,
  };

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrg(): OrganizationContextValue {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrg muss innerhalb von <OrganizationProvider> verwendet werden');
  return ctx;
}
