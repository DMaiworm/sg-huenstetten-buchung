import React, { useState, useMemo } from 'react';
import { Users2 } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import EmptyState from './ui/EmptyState';
import TeamOverviewCard from './TeamOverviewCard';
import { useOrg } from '../contexts/OrganizationContext';
import { useBookingContext } from '../contexts/BookingContext';
import { useUserContext } from '../contexts/UserContext';
import { useFacility } from '../contexts/FacilityContext';
import type { Booking } from '../types';

const sectionCls = 'bg-white border border-gray-200 rounded-lg p-4 mb-5';
const labelCls = 'block text-[13px] font-semibold text-gray-700 mb-1.5';
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

const TeamOverview: React.FC = () => {
  const { clubs, departments, teams, trainerAssignments } = useOrg();
  const { bookings } = useBookingContext();
  const { users } = useUserContext();
  const { RESOURCES: resources } = useFacility();
  const [selectedClubId, setSelectedClubId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');

  const clubDepartments = useMemo(() => {
    if (!departments || !selectedClubId) return [];
    return departments.filter(d => d.clubId === selectedClubId).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [departments, selectedClubId]);

  const departmentTeams = useMemo(() => {
    if (!teams) return [];
    let result = selectedClubId
      ? teams.filter(t => {
          const dept = (departments || []).find(d => d.id === t.departmentId);
          return dept?.clubId === selectedClubId;
        })
      : teams;
    if (selectedDeptId) result = result.filter(t => t.departmentId === selectedDeptId);
    return result.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [teams, departments, selectedClubId, selectedDeptId]);

  const handleClubChange = (v: string) => { setSelectedClubId(v); setSelectedDeptId(''); };

  const todayISO = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const teamDataMap = useMemo(() => {
    const map: Record<string, { trainings: Booking[]; nextEvent: Booking | null }> = {};
    departmentTeams.forEach(t => { map[t.id] = { trainings: [], nextEvent: null }; });
    const teamIds = new Set(departmentTeams.map(t => t.id));
    const relevant = (bookings || []).filter(b => b.teamId && teamIds.has(b.teamId) && b.status === 'approved' && !b.parentBooking);
    relevant.forEach(b => {
      const tid = b.teamId!;
      if (!map[tid]) return;
      if (b.bookingType === 'training') map[tid].trainings.push(b);
      if ((b.bookingType === 'match' || b.bookingType === 'event') && b.date >= todayISO) {
        if (!map[tid].nextEvent || b.date < map[tid].nextEvent!.date ||
            (b.date === map[tid].nextEvent!.date && b.startTime < map[tid].nextEvent!.startTime)) {
          map[tid].nextEvent = b;
        }
      }
    });
    return map;
  }, [departmentTeams, bookings, todayISO]);

  const selectedDept = (departments || []).find(d => d.id === selectedDeptId);

  return (
    <div>
      <PageHeader icon={Users2} title="Teamübersicht" subtitle="Mannschaften, Trainer und Trainingszeiten" />
      <div className={sectionCls}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Verein</label>
            <select value={selectedClubId} onChange={e => handleClubChange(e.target.value)} className={inputCls}>
              <option value="">Alle Vereine</option>
              {(clubs || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Abteilung</label>
            <select value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)} className={inputCls} disabled={!selectedClubId}>
              <option value="">Alle Abteilungen</option>
              {clubDepartments.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
            </select>
          </div>
        </div>
      </div>
      {departmentTeams.length === 0 ? (
        <EmptyState icon={Users2} title="Keine Mannschaften" subtitle={selectedDeptId ? `In der Abteilung „${selectedDept?.icon} ${selectedDept?.name}" sind noch keine Mannschaften angelegt.` : 'Es sind noch keine Mannschaften angelegt.'} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departmentTeams.map(team => (
            <TeamOverviewCard key={team.id} team={team} trainerAssignments={trainerAssignments} users={users} resources={resources}
              trainings={teamDataMap[team.id]?.trainings || []} nextEvent={teamDataMap[team.id]?.nextEvent || null} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamOverview;
