import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type PermissionKey = 'kannBuchen' | 'kannGenehmigen' | 'kannVerwalten' | 'kannAdministrieren' | 'istTrainer';

interface PermissionRouteProps {
  permission: PermissionKey;
  fallback?: string;
  children: React.ReactNode;
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({ permission, fallback = '/', children }) => {
  const auth = useAuth();

  if (!auth[permission]) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default PermissionRoute;
