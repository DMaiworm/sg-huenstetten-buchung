import React, { createContext, useContext } from 'react';
import { useOrganization as useOrganizationHook } from '../hooks/useSupabase';
import { DEFAULT_CLUBS, DEFAULT_DEPARTMENTS, DEFAULT_TEAMS, DEFAULT_TRAINER_ASSIGNMENTS } from '../config/organizationConfig';

const OrganizationContext = createContext(null);

export function OrganizationProvider({ children }) {
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
  const clubs              = isDemo ? DEFAULT_CLUBS               : dbClubs;
  const departments        = isDemo ? DEFAULT_DEPARTMENTS         : dbDepartments;
  const teams              = isDemo ? DEFAULT_TEAMS               : dbTeams;
  const trainerAssignments = isDemo ? DEFAULT_TRAINER_ASSIGNMENTS : dbTrainerAssignments;

  const value = {
    clubs, departments, teams, trainerAssignments,
    // CRUD (undefined im Demo-Modus → Komponenten prüfen bereits darauf)
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
    // Legacy Setter (für Demo-Fallback)
    setClubs: setDbClubs, setDepartments: setDbDepartments,
    setTeams: setDbTeams, setTrainerAssignments: setDbTrainerAssignments,
    // Meta
    loading, isDemo,
  };

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrg muss innerhalb von <OrganizationProvider> verwendet werden');
  return ctx;
}
