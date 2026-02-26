/**
 * TrainerUebersichtCard – Intranet-Karte für einen Trainer.
 *
 * Zeigt: Foto, Name, Bio, aktive Vereine, Mannschaften, Lizenzen, Erfolge.
 */

import React from 'react';
import { Award, Trophy, Star } from 'lucide-react';

function formatYear(dateStr) {
  if (!dateStr) return null;
  return dateStr.split('-')[0];
}

function AblaufBadge({ ablaufdatum }) {
  if (!ablaufdatum) return null;
  const today = new Date();
  const exp   = new Date(ablaufdatum);
  const diff  = (exp - today) / (1000 * 60 * 60 * 24);
  if (diff < 0)   return <span className="ml-1 text-[10px] text-red-500 font-medium">abgelaufen</span>;
  if (diff < 180) return <span className="ml-1 text-[10px] text-yellow-600 font-medium">läuft bald ab</span>;
  return null;
}

const TrainerUebersichtCard = ({
  trainer,
  trainerAssignments,
  teams,
  departments,
  clubs,
}) => {
  const fullName = `${trainer.firstName} ${trainer.lastName}`;
  const initials = `${trainer.firstName?.[0] || ''}${trainer.lastName?.[0] || ''}`.toUpperCase();

  // Mannschaften die dieser Trainer betreut
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

  // Aktiv-für Club-Namen
  const aktivFuerNames = (trainer.aktivFuer || [])
    .map(id => (clubs || []).find(c => c.id === id)?.name)
    .filter(Boolean);

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
            <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-3">{trainer.bio}</p>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 space-y-4 flex-1">

        {/* Mannschaften */}
        {teamGroups.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Mannschaften</p>
            <div className="space-y-1">
              {teamGroups.map(({ team, club, isPrimary }, i) => (
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
            </div>
          </div>
        )}

        {/* Lizenzen */}
        {trainer.lizenzen.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
              <Award className="w-3 h-3" /> Lizenzen & Zertifikate
            </p>
            <div className="space-y-1">
              {trainer.lizenzen.map(l => (
                <div key={l.id} className="text-[13px] text-gray-700">
                  <span className="font-medium">{l.bezeichnung}</span>
                  <AblaufBadge ablaufdatum={l.ablaufdatum} />
                  {l.ausstellendeOrg && (
                    <span className="text-gray-400 text-[11px] block">{l.ausstellendeOrg}
                      {l.ausstellungsdatum && ` · ${formatYear(l.ausstellungsdatum)}`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Erfolge */}
        {trainer.erfolge.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Erfolge
            </p>
            <div className="space-y-1">
              {trainer.erfolge.map(e => (
                <div key={e.id} className="text-[13px] text-gray-700">
                  <span className="font-medium">{e.titel}</span>
                  <span className="text-gray-400 text-[11px] block">{e.mannschaft} · {e.jahr}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TrainerUebersichtCard;
