import React, { createContext, useContext } from 'react';
import { useUsers as useUsersHook, useOperators, useGenehmigerResources } from '../hooks/useSupabase';
import type { User, UserCreateData, Operator, GenehmigerResourceAssignment, DbResult, DbDeleteResult } from '../types';

interface UserContextValue {
  users: User[];
  setUsers: (v: User[]) => void;
  createUser: (userData: UserCreateData) => Promise<DbResult<User>>;
  updateUser: (userId: string, userData: UserCreateData) => Promise<DbResult<User>>;
  deleteUser: (userId: string) => Promise<DbDeleteResult>;
  inviteUser: (userId: string) => Promise<DbDeleteResult>;
  operators: Operator[];
  genehmigerAssignments: GenehmigerResourceAssignment[];
  getResourcesForUser: (userId: string) => string[];
  getUsersForResource: (resourceId: string) => string[];
  addGenehmigerResource: (userId: string, resourceId: string) => Promise<DbDeleteResult>;
  removeGenehmigerResource: (userId: string, resourceId: string) => Promise<DbDeleteResult>;
  loading: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
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

  const value: UserContextValue = {
    users, setUsers, createUser, updateUser, deleteUser, inviteUser,
    operators,
    genehmigerAssignments, getResourcesForUser, getUsersForResource,
    addGenehmigerResource, removeGenehmigerResource,
    loading: usersLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserContext muss innerhalb von <UserProvider> verwendet werden');
  return ctx;
}
