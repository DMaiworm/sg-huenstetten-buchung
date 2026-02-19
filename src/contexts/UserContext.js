import React, { createContext, useContext } from 'react';
import { useUsers as useUsersHook, useOperators, useGenehmigerResources } from '../hooks/useSupabase';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const {
    users, setUsers, createUser, updateUser, deleteUser, inviteUser,
    loading: usersLoading,
  } = useUsersHook();

  const { operators } = useOperators();

  const {
    assignments: genehmigerAssignments,
    getResourcesForUser,
    getUsersForResource,
    addAssignment: addGenehmigerResource,
    removeAssignment: removeGenehmigerResource,
  } = useGenehmigerResources();

  const value = {
    // Users
    users, setUsers, createUser, updateUser, deleteUser, inviteUser,
    // Operators
    operators,
    // Genehmiger-Ressourcen
    genehmigerAssignments, getResourcesForUser, getUsersForResource,
    addGenehmigerResource, removeGenehmigerResource,
    // Meta
    loading: usersLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserContext muss innerhalb von <UserProvider> verwendet werden');
  return ctx;
}
