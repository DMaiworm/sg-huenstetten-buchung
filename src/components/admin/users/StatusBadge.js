import React from 'react';
import { trainerStatus, STATUS_CONFIG } from './userConstants';

const StatusBadge = ({ user }) => {
  const status = trainerStatus(user);
  if (!status) return null;
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      <Icon style={{ width: '10px', height: '10px' }} />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
