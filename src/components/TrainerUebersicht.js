/**
 * TrainerUebersicht – Intranet-Übersicht aller Trainer.
 *
 * Filter: Verein-Dropdown → Abteilung-Dropdown (kaskadierend wie TeamOverview).
 * Detail-Modal: öffnet Vollprofil bei Klick auf "Vollprofil ansehen".
 */

import React, { useState, useMemo } from 'react';
import { Users2, AlertCircle } from 'lucide-react';
import { useTrainerUebersicht } from '../hooks/useTrainerUebersicht';
import { useOrg } from '../contexts/OrganizationContext';
import PageHeader from './ui/PageHeader';
import EmptyState from './ui/EmptyState';
import TrainerUebersichtCard from './TrainerUebersichtCard';
import TrainerDetailModal from './TrainerDetailModal';

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';
const labelCls = 'block text-[13px] font-semibold text-gray-700 mb-1.5';

const TrainerUebersicht = () => {
  const { trainers, loading, error } = useTrainerUebersicht();
  const { clubs, departments, teams, trainerAssignments } = useOrg();

  const [selectedClubId, setSelectedClubId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [detailTrainer,  setDetailTrainer]  = useState(null);

  const handleClubChange = (v) => { setSelectedClubId(v); setSelectedDeptId(''); };

  // Abteilungen des gewählten Vereins, die mindestens einen Trainer haben
  const clubDepts = useMemo(() => {
    if (!selectedClubId) return [];
    // Alle Teams dieses Vereins
    const clubDeptIds = new Set(
      (departments || []).filter(d => d.clubId === selectedClubId).map(d => d.id)
    );
    const clubTeamIds = new Set(
      (teams || []).filter(t => clubDeptIds.has(t.departmentId)).map(t => t.id)
    );
    // Trainer, die aktiv_fuer diesen Club sind
    const clubTrainerIds = new Set(
      trainers.filter(tr => (tr.aktivFuer || []).includes(selectedClubId)).map(tr => tr.id)
    );
    // Departements, in denen diese Trainer Teams haben
    const activeDeptIds = new Set();
    for (const ta of (trainerAssignments || [])) {
      if (clubTrainerIds.has(ta.userId) && clubTeamIds.has(ta.teamId)) {
        const team = (teams || []).find(t => t.id === ta.teamId);
        if (team) activeDeptIds.add(team.departmentId);
      }
    }
    return (departments || [])
      .filter(d => d.clubId === selectedClubId && activeDeptIds.has(d.id))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [selectedClubId, departments, teams, trainers, trainerAssignments]);

  // Gefilterte Trainer
  const filtered = useMemo(() => {
    let result = trainers;
    if (selectedClubId) {
      result = result.filter(tr => (tr.aktivFuer || []).includes(selectedClubId));
    }
    if (selectedDeptId) {
      // Teams in dieser Abteilung
      const deptTeamIds = new Set((teams || []).filter(t => t.departmentId === selectedDeptId).map(t => t.id));
      // Trainer, die mind. ein Team in dieser Abteilung haben
      const trainerIdsInDept = new Set(
        (trainerAssignments || []).filter(ta => deptTeamIds.has(ta.teamId)).map(ta => ta.userId)
      );
      result = result.filter(tr => trainerIdsInDept.has(tr.id));
    }
    return result;
  }, [trainers, selectedClubId, selectedDeptId, teams, trainerAssignments]);

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
        subtitle={`${filtered.length} von ${trainers.length} Trainer${trainers.length !== 1 ? 'n' : ''}`}
      />

      {/* Filter-Dropdowns */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Verein</label>
            <select value={selectedClubId} onChange={e => handleClubChange(e.target.value)} className={inputCls}>
              <option value="">Alle Vereine</option>
              {(clubs || []).map(c => {
                const count = trainers.filter(tr => (tr.aktivFuer || []).includes(c.id)).length;
                return <option key={c.id} value={c.id}>{c.name} ({count})</option>;
              })}
            </select>
          </div>
          <div>
            <label className={labelCls}>Abteilung</label>
            <select
              value={selectedDeptId}
              onChange={e => setSelectedDeptId(e.target.value)}
              className={inputCls}
              disabled={!selectedClubId}
            >
              <option value="">Alle Abteilungen</option>
              {clubDepts.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="Keine Trainer gefunden"
          subtitle={selectedDeptId
            ? 'Für diese Abteilung sind keine Trainer zugewiesen.'
            : selectedClubId
            ? 'Für diesen Verein sind noch keine Trainer angelegt.'
            : 'Es sind noch keine Trainer angelegt.'
          }
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
              onDetail={setDetailTrainer}
            />
          ))}
        </div>
      )}

      {/* Detail-Modal */}
      {detailTrainer && (
        <TrainerDetailModal
          trainer={detailTrainer}
          trainerAssignments={trainerAssignments}
          teams={teams}
          departments={departments}
          clubs={clubs}
          onClose={() => setDetailTrainer(null)}
        />
      )}
    </div>
  );
};

export default TrainerUebersicht;
