import React from 'react';
import { X, Award, Trophy, Star, Mail, Phone } from 'lucide-react';
import Modal from './ui/Modal';
import type { Club, Department, Team, TrainerAssignment, TrainerUebersichtEntry } from '../types';

function AblaufBadge({ ablaufdatum }: { ablaufdatum: string | null }) {
  if (!ablaufdatum) return null;
  const diff = (new Date(ablaufdatum).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0)   return <span className="ml-1.5 text-xs text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded">abgelaufen</span>;
  if (diff < 180) return <span className="ml-1.5 text-xs text-yellow-600 font-medium bg-yellow-50 px-1.5 py-0.5 rounded">läuft bald ab</span>;
  return null;
}

function formatDate(str: string | null): string | null {
  if (!str) return null;
  const [y, m, d] = str.split('-');
  return `${d}.${m}.${y}`;
}

interface SectionProps {
  icon?: React.FC<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ icon: Icon, title, children }) => (
  <div>
    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5" />}{title}
    </p>
    {children}
  </div>
);

interface TeamGroup {
  team: Team;
  dept: Department | undefined;
  club: Club | undefined;
  isPrimary: boolean;
}

interface TrainerDetailModalProps {
  trainer: TrainerUebersichtEntry;
  trainerAssignments: TrainerAssignment[];
  teams: Team[];
  departments: Department[];
  clubs: Club[];
  onClose: () => void;
}

const TrainerDetailModal: React.FC<TrainerDetailModalProps> = ({ trainer, trainerAssignments, teams, departments, clubs, onClose }) => {
  if (!trainer) return null;

  const fullName   = `${trainer.firstName} ${trainer.lastName}`;
  const initials   = `${trainer.firstName?.[0] || ''}${trainer.lastName?.[0] || ''}`.toUpperCase();

  // Mannschaften aufbereiten
  const assignments = (trainerAssignments || []).filter(ta => ta.userId === trainer.id);
  const teamGroups: TeamGroup[] = [];
  for (const ta of assignments) {
    const team = (teams || []).find(t => t.id === ta.teamId);
    if (!team) continue;
    const dept = (departments || []).find(d => d.id === team.departmentId);
    const club = dept ? (clubs || []).find(c => c.id === dept.clubId) : undefined;
    teamGroups.push({ team, dept, club, isPrimary: ta.isPrimary });
  }
  teamGroups.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return (a.club?.name || '').localeCompare(b.club?.name || '', 'de');
  });

  const aktivFuerClubIds = new Set<string>();
  for (const ta of assignments) {
    const team = (teams || []).find(t => t.id === ta.teamId);
    if (!team) continue;
    const dept = (departments || []).find(d => d.id === team.departmentId);
    if (dept) aktivFuerClubIds.add(dept.clubId);
  }
  const aktivFuerNames = Array.from(aktivFuerClubIds)
    .map(id => (clubs || []).find(c => c.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <Modal open={!!trainer} onClose={onClose}>
      {/* ── Custom Header: Foto + Name ── */}
      <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 p-6 flex items-end gap-5 -mx-6 -mt-5 mb-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Foto */}
        <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg ring-2 ring-white/30">
          {trainer.photoUrl
            ? <img src={trainer.photoUrl} alt={fullName} className="w-full h-full object-cover" />
            : <span className="text-3xl font-bold text-white">{initials}</span>
          }
        </div>

        {/* Name + Vereine */}
        <div className="flex-1 min-w-0 pb-1">
          <h2 className="text-2xl font-bold text-white leading-tight">{fullName}</h2>
          {aktivFuerNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {aktivFuerNames.map(name => (
                <span key={name} className="bg-white/20 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="space-y-6">

        {/* Kontakt */}
        {(trainer.email || trainer.phone) && (
          <div className="flex flex-wrap gap-4">
            {trainer.email && (
              <a href={`mailto:${trainer.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                <Mail className="w-4 h-4" />{trainer.email}
              </a>
            )}
            {trainer.phone && (
              <a href={`tel:${trainer.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <Phone className="w-4 h-4" />{trainer.phone}
              </a>
            )}
          </div>
        )}

        {/* Bio */}
        {trainer.bio && (
          <Section title="Über mich">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{trainer.bio}</p>
          </Section>
        )}

        {/* Mannschaften */}
        {teamGroups.length > 0 && (
          <Section title="Mannschaften">
            <div className="space-y-2">
              {teamGroups.map(({ team, dept, club, isPrimary }, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
                  {isPrimary
                    ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                    : <span className="w-4 h-4 flex-shrink-0" />
                  }
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {team.name}
                      {!isPrimary && <span className="ml-1.5 text-xs text-gray-400 font-normal">(Co-Trainer)</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {[club?.name, dept?.name].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Lizenzen */}
        {trainer.lizenzen.length > 0 && (
          <Section icon={Award} title="Lizenzen & Zertifikate">
            <div className="space-y-2.5">
              {trainer.lizenzen.map(l => (
                <div key={l.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Award className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {l.bezeichnung}
                      <AblaufBadge ablaufdatum={l.ablaufdatum} />
                    </p>
                    <p className="text-xs text-gray-500">
                      {[
                        l.ausstellendeOrg,
                        l.ausstellungsdatum && `ausgestellt ${formatDate(l.ausstellungsdatum)}`,
                        l.ablaufdatum       && `gültig bis ${formatDate(l.ablaufdatum)}`,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Erfolge */}
        {trainer.erfolge.length > 0 && (
          <Section icon={Trophy} title="Erfolge">
            <div className="space-y-2">
              {trainer.erfolge.map(e => (
                <div key={e.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                  <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{e.titel}</p>
                    <p className="text-xs text-gray-500">{e.mannschaft} · {e.jahr}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

      </div>
    </Modal>
  );
};

export default TrainerDetailModal;
