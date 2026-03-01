import React from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import type { SubResource } from '../../../types';

interface SubResourceRowProps {
  sub: SubResource;
  onUpdate: (updated: SubResource) => void;
  onDelete: () => void;
}

const SubResourceRow: React.FC<SubResourceRowProps> = ({ sub, onUpdate, onDelete }) => (
  <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded ml-8 border border-gray-100">
    <GripVertical className="w-4 h-4 text-gray-300" />
    <div className="w-4 h-4 rounded" style={{ backgroundColor: sub.color }} />
    <input type="text" value={sub.name} onChange={e => onUpdate({ ...sub, name: e.target.value })}
      className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500" />
    <input type="color" value={sub.color} onChange={e => onUpdate({ ...sub, color: e.target.value })}
      className="w-7 h-7 rounded cursor-pointer border-0" />
    <button onClick={onDelete} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

export default SubResourceRow;
