import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Schützt Routen die eine bestimmte Berechtigung benötigen.
 *
 * Props:
 *   permission  - Name des Auth-Flags: 'kannBuchen' | 'kannGenehmigen' | 'kannVerwalten' | 'kannAdministrieren' | 'istTrainer'
 *   fallback    - optionale Redirect-URL (default: '/')
 *   children    - geschützter Inhalt
 */
const PermissionRoute = ({ permission, fallback = '/', children }) => {
  const auth = useAuth();

  // Wenn die Berechtigung nicht vorhanden ist → zurück zur Startseite
  if (!auth[permission]) {
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default PermissionRoute;
