import React, { useState, useMemo } from 'react';
import { Users, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrg } from '../../../contexts/OrganizationContext';
import { useTrainerVerwaltung } from '../../../hooks/useTrainerVerwaltung';
import { PageHeader } from '../../ui';
import TrainerVerwaltungCard from './TrainerVerwaltungCard';
import type { Operator, Team } from '../../../types';

interface TrainerVerwaltungProps {
  operators?: Operator[];
}

export default function TrainerVerwaltung({ operators = [] }: TrainerVerwaltungProps) {
  const { profile } = useAuth();
  const { teams, trainerAssignments } = useOrg();

  const myOperatorId    = profile?.operator_id || null;
  const isSuperAdmin    = !myOperatorId;

  const { trainers, loading, error, refresh, updateAdminFields, uploadDocumentForTrainer } = useTrainerVerwaltung(
    isSuperAdmin ? null : myOperatorId
  );

  const [activeTab, setActiveTab] = useState('all');

  const tabs = isSuperAdmin
    ? [
        { id: 'all', label: 'Alle' },
        ...operators.map(op => ({ id: op.id, label: op.name })),
      ]
    : [];

  const trainerJugendteamsMap = useMemo(() => {
    const map: Record<string, Team[]> = {};
    for (const trainer of trainers) {
      const assignments = (trainerAssignments || []).filter(ta => ta.userId === trainer.id);
      map[trainer.id] = assignments
        .map(ta => (teams || []).find(t => t.id === ta.teamId))
        .filter((t): t is Team => !!t?.istJugendmannschaft);
    }
    return map;
  }, [trainers, teams, trainerAssignments]);

  const displayedTrainers = isSuperAdmin && activeTab !== 'all'
    ? trainers.filter((t: any) => t.operatorId === activeTab)
    : trainers;

  const total      = displayedTrainers.length;
  const vollst     = displayedTrainers.filter((t: any) => t.details?.unterlagenVollstaendig).length;
  const fzVerified = displayedTrainers.filter((t: any) => t.details?.fuehrungszeugnisVerified).length;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 text-red-600 py-10">
      <AlertCircle className="w-5 h-5" /> Fehler beim Laden: {error}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trainerverwaltung"
        subtitle={`${total} Trainer · ${vollst} vollständig · ${fzVerified} FZ verifiziert`}
        actions={
          <button onClick={refresh}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" title="Aktualisieren">
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      {isSuperAdmin && tabs.length > 1 && (
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-white border border-b-white border-gray-200 text-blue-700 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {displayedTrainers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Keine Trainer gefunden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedTrainers.map((trainer: any) => (
            <TrainerVerwaltungCard
              key={trainer.id}
              trainer={trainer}
              onUpdate={updateAdminFields}
              onUpload={uploadDocumentForTrainer}
              jugendteams={trainerJugendteamsMap[trainer.id] || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
