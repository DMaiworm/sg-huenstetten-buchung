import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Holiday } from '../../../types';

const TYPE_STYLES: Record<string, string> = {
  feiertag:    'bg-red-100 text-red-700',
  schulferien: 'bg-amber-100 text-amber-700',
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
};

const daysBetween = (startStr: string, endStr: string) => {
  const start = new Date(startStr);
  const end   = new Date(endStr);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

interface HolidayRowProps {
  holiday: Holiday;
  onEdit: () => void;
  onDelete: () => void;
}

const HolidayRow: React.FC<HolidayRowProps> = ({ holiday, onEdit, onDelete }) => {
  const isSingleDay = holiday.startDate === holiday.endDate;
  const days = isSingleDay ? null : daysBetween(holiday.startDate, holiday.endDate);

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 group transition-colors">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${holiday.type === 'feiertag' ? 'bg-red-400' : 'bg-amber-400'}`} />
      <span className="text-sm text-gray-500 font-mono w-40 flex-shrink-0">
        {isSingleDay
          ? formatDate(holiday.startDate)
          : `${formatDate(holiday.startDate)} – ${formatDate(holiday.endDate)}`}
      </span>
      <span className="text-sm font-medium text-gray-900 flex-1">{holiday.name}</span>
      {days && (
        <span className="text-xs text-gray-400">{days} Tage</span>
      )}
      <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_STYLES[holiday.type]}`}>
        {holiday.type === 'feiertag' ? 'Feiertag' : 'Ferien'}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit}
          className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete}
          className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default HolidayRow;
