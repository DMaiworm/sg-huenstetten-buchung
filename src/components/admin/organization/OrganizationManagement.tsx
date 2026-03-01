import React, { useState } from 'react';
import { Building, Plus, Save, X } from 'lucide-react';
import { useConfirm } from '../../../hooks/useConfirm';
import { Button } from '../../ui/Button';
import PageHeader from '../../ui/PageHeader';
import EmptyState from '../../ui/EmptyState';
import ClubSection from './ClubSection';
import type { Club, Department, Team, TrainerAssignment, User } from '../../../types';

interface OrganizationManagementProps {
  clubs: Club[];
  departments: Department[];
  teams: Team[];
  trainerAssignments: TrainerAssignment[];
  users: User[];
  createClub?: (data: any) => Promise<any>;
  updateClub?: (data: any) => Promise<any>;
  deleteClub?: (id: string) => Promise<any>;
  createDepartment?: (data: any) => Promise<any>;
  updateDepartment?: (data: any) => Promise<any>;
  deleteDepartment?: (id: string) => Promise<any>;
  createTeam?: (data: any) => Promise<any>;
  updateTeam?: (data: any) => Promise<any>;
  deleteTeam?: (id: string) => Promise<any>;
  createTrainerAssignment?: (userId: string, teamId: string, isPrimary: boolean) => Promise<any>;
  updateTrainerAssignment?: (data: any) => Promise<any>;
  deleteTrainerAssignment?: (id: string) => Promise<any>;
  setClubs?: (clubs: Club[]) => void;
  setDepartments?: (departments: Department[]) => void;
  setTeams?: (teams: Team[]) => void;
  setTrainerAssignments?: (assignments: TrainerAssignment[]) => void;
}

const OrganizationManagement: React.FC<OrganizationManagementProps> = ({
  clubs, departments, teams, trainerAssignments, users,
  createClub, updateClub, deleteClub,
  createDepartment, updateDepartment, deleteDepartment,
  createTeam, updateTeam, deleteTeam,
  createTrainerAssignment, updateTrainerAssignment, deleteTrainerAssignment,
}) => {
  const [addingClub, setAddingClub] = useState(false);
  const [newClubForm, setNewClubForm] = useState({ name: '', shortName: '', color: '#6b7280', isHomeClub: false });
  const [confirm, confirmDialog] = useConfirm();

  const handleAddClub = async () => {
    if (createClub) await createClub(newClubForm);
    setNewClubForm({ name: '', shortName: '', color: '#6b7280', isHomeClub: false });
    setAddingClub(false);
  };

  const handleUpdateClub = async (updated: Club) => { if (updateClub) await updateClub(updated); };
  const handleDeleteClub = async (id: string) => {
    if (!await confirm({ title: 'Verein löschen?', message: 'Der Verein und alle zugehörigen Abteilungen und Mannschaften werden gelöscht.', confirmLabel: 'Löschen', variant: 'danger' })) return;
    if (deleteClub) await deleteClub(id);
  };

  const handleAddDept = async (clubId: string) => { if (createDepartment) await createDepartment({ clubId, name: 'Neue Abteilung', icon: '⚽', sortOrder: 0 }); };
  const handleUpdateDept = async (updated: Department) => { if (updateDepartment) await updateDepartment(updated); };
  const handleDeleteDept = async (id: string) => {
    if (!await confirm({ title: 'Abteilung löschen?', message: 'Alle Mannschaften dieser Abteilung werden ebenfalls gelöscht.', confirmLabel: 'Löschen', variant: 'danger' })) return;
    if (deleteDepartment) await deleteDepartment(id);
  };

  const handleAddTeam = async (departmentId: string) => { if (createTeam) await createTeam({ departmentId, name: 'Neue Mannschaft', shortName: '', color: '#3b82f6', sortOrder: 0, eventTypes: ['training'] }); };
  const handleUpdateTeam = async (updated: Team) => { if (updateTeam) await updateTeam(updated); };
  const handleDeleteTeam = async (id: string) => {
    if (!await confirm({ title: 'Mannschaft löschen?', message: 'Die Mannschaft und alle Trainer-Zuordnungen werden gelöscht.', confirmLabel: 'Löschen', variant: 'danger' })) return;
    if (deleteTeam) await deleteTeam(id);
  };

  const handleAddTrainer = async (teamId: string, userId: string) => {
    const isPrimary = !trainerAssignments.some(ta => ta.teamId === teamId);
    if (createTrainerAssignment) await createTrainerAssignment(userId, teamId, isPrimary);
  };
  const handleUpdateAssignment = async (updated: TrainerAssignment) => { if (updateTrainerAssignment) await updateTrainerAssignment(updated); };
  const handleRemoveTrainer = async (id: string) => { if (deleteTrainerAssignment) await deleteTrainerAssignment(id); };

  const subtitle = [
    `${clubs.length} Verein${clubs.length !== 1 ? 'e' : ''}`,
    `${departments.length} Abteilung${departments.length !== 1 ? 'en' : ''}`,
    `${teams.length} Mannschaft${teams.length !== 1 ? 'en' : ''}`,
    `${trainerAssignments.length} Trainer-Zuordnung${trainerAssignments.length !== 1 ? 'en' : ''}`,
  ].join(' · ');

  return (
    <div>
      <PageHeader
        icon={Building} title="Organisationsverwaltung" subtitle={subtitle}
        actions={<Button variant="primary" size="sm" onClick={() => setAddingClub(true)}><Plus className="w-4 h-4 mr-1" /> Neuer Verein</Button>}
      />

      {addingClub && (
        <div className="mb-6 border-2 border-blue-300 rounded-lg p-4 bg-blue-50/30">
          <h4 className="font-bold text-gray-900 mb-3">Neuen Verein anlegen</h4>
          <div className="grid grid-cols-3 gap-3">
            <input type="text" value={newClubForm.name} onChange={e => setNewClubForm({ ...newClubForm, name: e.target.value })}
              className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="Vereinsname" />
            <input type="text" value={newClubForm.shortName} onChange={e => setNewClubForm({ ...newClubForm, shortName: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="Kürzel" />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <input type="color" value={newClubForm.color} onChange={e => setNewClubForm({ ...newClubForm, color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
            <Button variant="primary" size="sm" onClick={handleAddClub} disabled={!newClubForm.name}>
              <Save className="w-4 h-4 mr-1" />Anlegen
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAddingClub(false)}><X className="w-4 h-4 mr-1" />Abbrechen</Button>
          </div>
        </div>
      )}

      {clubs.length === 0 ? (
        <EmptyState icon={Building} title="Keine Vereine vorhanden" action="Ersten Verein erstellen" onAction={() => setAddingClub(true)} />
      ) : (
        clubs.map(club => (
          <ClubSection key={club.id} club={club}
            departments={departments} teams={teams} users={users} trainerAssignments={trainerAssignments}
            onUpdateClub={handleUpdateClub} onDeleteClub={handleDeleteClub}
            onAddDept={handleAddDept} onUpdateDept={handleUpdateDept} onDeleteDept={handleDeleteDept}
            onAddTeam={handleAddTeam} onUpdateTeam={handleUpdateTeam} onDeleteTeam={handleDeleteTeam}
            onAddTrainer={handleAddTrainer} onUpdateAssignment={handleUpdateAssignment} onRemoveTrainer={handleRemoveTrainer} />
        ))
      )}

      {confirmDialog}
    </div>
  );
};

export default OrganizationManagement;
