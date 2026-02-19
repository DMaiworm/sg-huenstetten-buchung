import React from 'react';
import { PERMISSIONS } from './userConstants';

const PermBadges = ({ user }) => (
  <div className="flex flex-wrap gap-1 mt-1">
    {PERMISSIONS.filter(p => user[p.key]).map(p => (
      <span key={p.key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
        style={{ backgroundColor: p.color + '18', color: p.color }}>
        {p.label}
      </span>
    ))}
    {!PERMISSIONS.some(p => user[p.key]) && (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-400">Kein Zugriff</span>
    )}
  </div>
);

export default PermBadges;
