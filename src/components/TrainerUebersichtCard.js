/**
 * TrainerUebersichtCard – kompakte Intranet-Karte für einen Trainer.
 *
 * Zeigt max. 3 Mannschaften, 2 Lizenzen, 2 Erfolge mit "+N mehr"-Hinweis.
 * "Details"-Button öffnet TrainerDetailModal.
 */

import React from 'react';
import { Award, Trophy, Star } from 'lucide-react';

function AblaufBadge({ ablaufdatum }) {
  if (!ablaufdatum) return null;
  const diff = (new Date(ablaufdatum) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff < 0)   return <span className="ml-1 text-[10px] text-red-500 font-medium">abgelaufen</span>;
  if (diff < 180) return <span className="ml-1 text-[10px] text-yellow-600 font-medium">läuft bald ab</span>;
  return null;
}

function formatYear(str) {
  return str ? str.split('-')[0] : null;
}

function MehrHinweis({ count }) {
  if (count <= 0) return null;
  return <p className="text-[11px] text-gray-400 italic mt-0.5">+{count} weitere</p>;
}

const MAX_TEAMS   = 3;
const MAX_LIZENZ  = 2;
const MAX_ERFOLGE = 2;

const TrainerUebersichtCard = ({ trainer, trainerAssignments, teams, departments, clubs, onDetail }) => {
  const fullName = `${trainer.firstName} ${trainer.lastName}`;
  const initials = `${trainer.firstName?.[0] || ''}${trainer.lastName?.[0] || ''}`.toUpperCase();

  // Mannschaften aufbereiten
  const assignments = (trainerAssignments || []).filter(ta => ta.userId === trainer.id);
  const teamGroups = [];
  for (const ta of assignments) {
    const team = (teams || []).find(t => t.id === ta.teamId);
    if (!team) continue;
    const dept = (departments || []).find(d => d.id === team.departmentId);
    const club = dept ? (clubs || []).find(c => c.id === dept.clubId) : null;
    teamGroups.push({ team, dept, club, isPrimary: ta.isPrimary });
  }
  teamGroups.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return (a.club?.name || '').localeCompare(b.club?.name || '', 'de');
  });

  const aktivFuerClubIds = new Set();
  for (const ta of assignments) {
    const team = (teams || []).find(t => t.id === ta.teamId);
    if (!team) continue;
    const dept = (departments || []).find(d => d.id === team.departmentId);
    if (dept) aktivFuerClubIds.add(dept.clubId);
  }
  const aktivFuerNames = [...aktivFuerClubIds]
    .map(id => (clubs || []).find(c => c.id === id)?.name)
    .filter(Boolean);

  const visibleTeams   = teamGroups.slice(0, MAX_TEAMS);
  const visibleLizenzen = trainer.lizenzen.slice(0, MAX_LIZENZ);
  const visibleErfolge  = trainer.erfolge.slice(0, MAX_ERFOLGE);

  const hasExtra = teamGroups.length > MAX_TEAMS
    || trainer.lizenzen.length > MAX_LIZENZ
    || trainer.erfolge.length > MAX_ERFOLGE;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">

      {/* Header: Foto + Name + Vereine */}
      <div className="p-5 pb-4 flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {trainer.photoUrl
            ? <img src={trainer.photoUrl} alt={fullName} className="w-full h-full object-cover" />
            : <span className="text-xl font-bold text-blue-600">{initials}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base leading-tight">{fullName}</h3>
          {aktivFuerNames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {aktivFuerNames.map(name => (
                <span key={name} className="bg-blue-50 text-blue-700 text-[11px] font-medium px-2 py-0.5 rounded-full">
                  {name}
                </span>
              ))}
            </div>
          )}
          {trainer.bio && (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">{trainer.bio}</p>
          )}
        </div>
      </div>

      <div className="px-5 space-y-3.5 flex-1">

        {/* Mannschaften */}
        {visibleTeams.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Mannschaften</p>
            <div className="space-y-0.5">
              {visibleTeams.map(({ team, club, isPrimary }, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[13px] text-gray-700">
                  {isPrimary
                    ? <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    : <span className="w-3 h-3 flex-shrink-0" />
                  }
                  <span className="font-medium">{team.name}</span>
                  {club && <span className="text-gray-400 text-[11px]">· {club.name}</span>}
                  {!isPrimary && <span className="text-gray-400 text-[11px]">(Co)</span>}
                </div>
              ))}
              <MehrHinweis count={teamGroups.length - MAX_TEAMS} />
            </div>
          </div>
        )}

        {/* Lizenzen */}
        {visibleLizenzen.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
              <Award className="w-3 h-3" /> Lizenzen
            </p>
            <div className="space-y-0.5">
              {visibleLizenzen.map(l => (
                <div key={l.id} className="text-[13px] text-gray-700">
                  <span className="font-medium">{l.bezeichnung}</span>
                  <AblaufBadge ablaufdatum={l.ablaufdatum} />
                  {l.ausstellendeOrg && (
                    <span className="text-gray-400 text-[11px] block">
                      {l.ausstellendeOrg}{l.ausstellungsdatum && ` · ${formatYear(l.ausstellungsdatum)}`}
                    </span>
                  )}
                </div>
              ))}
              <MehrHinweis count={trainer.lizenzen.length - MAX_LIZENZ} />
            </div>
          </div>
        )}

        {/* Erfolge */}
        {visibleErfolge.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Erfolge
            </p>
            <div className="space-y-0.5">
              {visibleErfolge.map(e => (
                <div key={e.id} className="text-[13px] text-gray-700">
                  <span className="font-medium">{e.titel}</span>
                  <span className="text-gray-400 text-[11px] block">{e.mannschaft} · {e.jahr}</span>
                </div>
              ))}
              <MehrHinweis count={trainer.erfolge.length - MAX_ERFOLGE} />
            </div>
          </div>
        )}

      </div>

      {/* Footer: Detail-Button */}
      <div className="px-5 py-4 mt-4 border-t border-gray-100 flex justify-end">
        <button
          onClick={() => onDetail(trainer)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          Vollprofil ansehen
        </button>
      </div>
    </div>
  );
};

export default TrainerUebersichtCard;
