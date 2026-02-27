/**
 * StatusBadge – Einheitliche Status-Anzeige für Buchungen und andere Entitäten.
 */

import React from 'react';

const STATUS_CONFIG = {
  approved:  { cls: 'bg-green-500 text-white', label: 'Genehmigt' },
  pending:   { cls: 'bg-yellow-400 text-gray-800', label: 'Ausstehend' },
  rejected:  { cls: 'bg-red-500 text-white', label: 'Abgelehnt' },
  cancelled: { cls: 'bg-gray-400 text-white', label: 'Storniert' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
