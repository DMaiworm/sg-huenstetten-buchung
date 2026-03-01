import React from 'react';

type BookingStatusKey = 'approved' | 'pending' | 'rejected' | 'cancelled';

const STATUS_CONFIG: Record<BookingStatusKey, { cls: string; label: string }> = {
  approved:  { cls: 'bg-green-500 text-white', label: 'Genehmigt' },
  pending:   { cls: 'bg-yellow-400 text-gray-800', label: 'Ausstehend' },
  rejected:  { cls: 'bg-red-500 text-white', label: 'Abgelehnt' },
  cancelled: { cls: 'bg-gray-400 text-white', label: 'Storniert' },
};

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg = STATUS_CONFIG[status as BookingStatusKey];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
