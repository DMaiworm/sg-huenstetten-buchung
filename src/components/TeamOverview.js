/**
 * TeamOverview – Seite mit Übersichtskarten aller Mannschaften.
 *
 * Verein → Abteilung auswählen, dann Grid mit TeamOverviewCards.
 */

import React, { useState, useMemo } from 'react';
import { Users2 } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import EmptyState from './ui/EmptyState';
import TeamOverviewCard from './TeamOverviewCard';

const sectionCls = 'bg-white border border-gray-200 rounded-lg p-4 mb-5';
const labelCls = 'block text-[13px] font-semibold text-gray-700 mb-1.5';
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

const TeamOverview = ({
  clubs, departments, teams, trainerAssignments,
  bookings, users, resources,
}) => {
  const [selectedClubId, setSelectedClubId] = useState(clubs?.[0]?.id || '');
  const [selectedDeptId, setSelectedDeptId] = useState('');

  // ── Cascading filters ──
  const clubDepartments = useMemo(() => {
    if (!departments || !selectedClubId) return [];
    return departments.filter(d => d.clubId === selectedClubId).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [departments, selectedClubId]);

  const departmentTeams = useMemo(() => {
    if (!teams || !selectedDeptId) return [];
    return teams.filter(t => t.departmentId === selectedDeptId).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [teams, selectedDeptId]);

  const handleClubChange = (v) => { setSelectedClubId(v); setSelectedDeptId(''); };

  // ── Heutiges Datum für "nächster Termin" ──
  const todayISO = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // ── Pro Team: Trainings + nächster Event vorberechnen ──
  const teamDataMap = useMemo(() => {
    const map = {};
    departmentTeams.forEach(t => { map[t.id] = { trainings: [], nextEvent: null }; });

    const teamIds = new Set(departmentTeams.map(t => t.id));
    const relevant = (bookings || []).filter(b => b.teamId && teamIds.has(b.teamId) && b.status === 'approved' && !b.parentBooking);

    relevant.forEach(b => {
      if (!map[b.teamId]) return;
      if (b.bookingType === 'training') {
        map[b.teamId].trainings.push(b);
      }
      if ((b.bookingType === 'match' || b.bookingType === 'event') && b.date >= todayISO) {
        if (!map[b.teamId].nextEvent || b.date < map[b.teamId].nextEvent.date ||
            (b.date === map[b.teamId].nextEvent.date && b.startTime < map[b.teamId].nextEvent.startTime)) {
          map[b.teamId].nextEvent = b;
        }
      }
    });
    return map;
  }, [departmentTeams, bookings, todayISO]);

  const selectedDept = (departments || []).find(d => d.id === selectedDeptId);

  return (
    <div>
      <PageHeader icon={Users2} title="Teamübersicht" subtitle="Mannschaften, Trainer und Trainingszeiten" />

      {/* Filter */}
      <div className={sectionCls}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Verein</label>
            <select value={selectedClubId} onChange={e => handleClubChange(e.target.value)} className={inputCls}>
              <option value="">-- Verein --</option>
              {(clubs || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Abteilung</label>
            <select value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)} className={inputCls} disabled={!selectedClubId}>
              <option value="">-- Abteilung wählen --</option>
              {clubDepartments.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Team Grid oder Empty State */}
      {!selectedDeptId ? (
        <EmptyState icon={Users2} title="Abteilung auswählen" subtitle="Wähle einen Verein und eine Abteilung, um die Mannschaften zu sehen." />
      ) : departmentTeams.length === 0 ? (
        <EmptyState icon={Users2} title="Keine Mannschaften" subtitle={`In der Abteilung „${selectedDept?.icon} ${selectedDept?.name}" sind noch keine Mannschaften angelegt.`} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departmentTeams.map(team => (
            <TeamOverviewCard
              key={team.id}
              team={team}
              trainerAssignments={trainerAssignments}
              users={users}
              resources={resources}
              trainings={teamDataMap[team.id]?.trainings || []}
              nextEvent={teamDataMap[team.id]?.nextEvent || null}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamOverview;
