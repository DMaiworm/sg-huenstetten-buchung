/**
 * TrainerUebersicht – Intranet-Übersicht aller Trainer.
 *
 * Filter: Alle / nach Verein. Grid mit TrainerUebersichtCards.
 * Daten: useTrainerUebersicht (öffentliche Felder) + useOrg (Teams).
 */

import React, { useState, useMemo } from 'react';
import { Users2, AlertCircle } from 'lucide-react';
import { useTrainerUebersicht } from '../hooks/useTrainerUebersicht';
import { useOrg } from '../contexts/OrganizationContext';
import PageHeader from './ui/PageHeader';
import EmptyState from './ui/EmptyState';
import TrainerUebersichtCard from './TrainerUebersichtCard';

const TrainerUebersicht = () => {
  const { trainers, loading, error } = useTrainerUebersicht();
  const { clubs, departments, teams, trainerAssignments } = useOrg();

  const [filterClubId, setFilterClubId] = useState('all');

  const filtered = useMemo(() => {
    if (filterClubId === 'all') return trainers;
    return trainers.filter(t => (t.aktivFuer || []).includes(filterClubId));
  }, [trainers, filterClubId]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 text-red-600 py-10">
      <AlertCircle className="w-5 h-5" /> Fehler: {error}
    </div>
  );

  return (
    <div>
      <PageHeader
        icon={Users2}
        title="Trainerübersicht"
        subtitle={`${trainers.length} Trainer · ${filtered.length} angezeigt`}
      />

      {/* Filter-Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1.5 rounded-lg w-fit flex-wrap">
        <button
          onClick={() => setFilterClubId('all')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            filterClubId === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Alle <span className="ml-1 text-xs font-bold text-gray-400">{trainers.length}</span>
        </button>
        {(clubs || []).map(club => {
          const count = trainers.filter(t => (t.aktivFuer || []).includes(club.id)).length;
          if (count === 0) return null;
          return (
            <button
              key={club.id}
              onClick={() => setFilterClubId(club.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                filterClubId === club.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {club.name} <span className="ml-1 text-xs font-bold text-gray-400">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="Keine Trainer gefunden"
          subtitle="Für diesen Verein sind noch keine Trainer angelegt."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(trainer => (
            <TrainerUebersichtCard
              key={trainer.id}
              trainer={trainer}
              trainerAssignments={trainerAssignments}
              teams={teams}
              departments={departments}
              clubs={clubs}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainerUebersicht;
