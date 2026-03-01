import React from 'react';
import { Shield } from 'lucide-react';

interface ResourceItem {
  id: string;
  name: string;
  color?: string;
}

interface GroupItem {
  id: string;
  name: string;
  resources: ResourceItem[];
}

interface FacilityItem {
  id: string;
  name: string;
  groups: GroupItem[];
}

interface ResourceAssignmentProps {
  user: { id: string; firstName: string };
  resourceTree: FacilityItem[];
  assignedIds: string[];
  onToggleResource: (userId: string, resourceId: string, assigned: boolean) => void;
}

const ResourceAssignment: React.FC<ResourceAssignmentProps> = ({ user, resourceTree, assignedIds, onToggleResource }) => (
  <div className="mt-4 pt-4 border-t border-gray-100">
    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
      <Shield className="w-4 h-4 text-violet-600" />
      Ressourcen die {user.firstName} genehmigen darf:
    </p>
    <div className="space-y-4">
      {resourceTree.map(fac => (
        <div key={fac.id}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{fac.name}</p>
          {fac.groups.map(grp => (
            <div key={grp.id} className="mb-2">
              <p className="text-xs text-gray-400 mb-1 ml-2">{grp.name}</p>
              <div className="flex flex-wrap gap-2 ml-2">
                {grp.resources.map(res => {
                  const assigned = assignedIds.includes(res.id);
                  return (
                    <button key={res.id}
                      onClick={() => onToggleResource(user.id, res.id, assigned)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        assigned ? 'bg-violet-100 text-violet-700 border-violet-300' : 'bg-white text-gray-500 border-gray-200 hover:border-violet-300'
                      }`}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: res.color }} />
                      {res.name}{assigned && <span className="text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default ResourceAssignment;
