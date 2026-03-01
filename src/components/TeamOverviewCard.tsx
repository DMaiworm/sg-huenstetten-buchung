import React, { useMemo } from 'react';
import { Clock, MapPin, Calendar, Star, Mail, Phone } from 'lucide-react';
import { DAYS_FULL } from '../config/constants';
import { EVENT_TYPES } from '../config/organizationConfig';
import type { Booking, BookableResource, User, Team, TrainerAssignment } from '../types';

interface TeamOverviewCardProps {
  team: Team;
  trainerAssignments: TrainerAssignment[];
  users: User[];
  resources: BookableResource[];
  trainings: Booking[];
  nextEvent: Booking | null;
}

interface TrainingSlot {
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  resourceName: string;
}

const TeamOverviewCard: React.FC<TeamOverviewCardProps> = ({ team, trainerAssignments, users, resources, trainings, nextEvent }) => {

  const teamTrainers = useMemo(() => {
    if (!trainerAssignments || !users) return [];
    return trainerAssignments
      .filter(ta => ta.teamId === team.id)
      .map(ta => { const u = users.find(x => x.id === ta.userId); return u ? { ...u, isPrimary: ta.isPrimary } : null; })
      .filter(Boolean) as (User & { isPrimary: boolean })[];
  }, [trainerAssignments, users, team.id]);

  const trainingSchedule = useMemo((): TrainingSlot[] => {
    if (!trainings || trainings.length === 0) return [];
    const seen = new Set<string>();
    const slots: TrainingSlot[] = [];
    trainings.forEach(b => {
      const dayOfWeek = new Date(b.date + 'T00:00:00').getDay();
      const key = `${dayOfWeek}-${b.startTime}-${b.endTime}-${b.resourceId}`;
      if (seen.has(key)) return;
      seen.add(key);
      slots.push({
        dayOfWeek,
        dayName: DAYS_FULL[dayOfWeek],
        startTime: b.startTime,
        endTime: b.endTime,
        resourceName: resources.find(r => r.id === b.resourceId)?.name || 'Unbekannt',
      });
    });
    return slots.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }, [trainings, resources]);

  const nextEventResource = nextEvent ? resources.find(r => r.id === nextEvent.resourceId) : null;
  const nextEventType = nextEvent ? EVENT_TYPES.find(t => t.id === nextEvent.bookingType) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="h-1.5" style={{ backgroundColor: team.color }} />
      <div className="p-4">
        <h3 className="font-bold text-[15px] text-gray-900 mb-3">{team.name}</h3>
        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Trainer / Übungsleiter</div>
          {teamTrainers.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {teamTrainers.map(t => (
                <div key={t.id} className="relative group inline-flex items-center gap-1 text-[13px] text-gray-700 cursor-default w-fit">
                  {t.isPrimary && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                  <span className="group-hover:underline">{t.firstName} {t.lastName}</span>
                  {!t.isPrimary && <span className="text-[11px] text-gray-400">(Co)</span>}
                  {(t.email || t.phone) && (
                    <div className="absolute left-0 top-full mt-1 z-20 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 whitespace-nowrap">
                      {t.email && (
                        <div className="flex items-center gap-1.5 text-[12px]">
                          <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                          <a href={`mailto:${t.email}`} className="text-blue-600 hover:underline">{t.email}</a>
                        </div>
                      )}
                      {t.phone && (
                        <div className="flex items-center gap-1.5 text-[12px] mt-1">
                          <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                          <a href={`tel:${t.phone}`} className="text-blue-600 hover:underline">{t.phone}</a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[13px] text-gray-400 italic">Kein Trainer zugewiesen</span>
          )}
        </div>
        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Trainingszeiten</div>
          {trainingSchedule.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {trainingSchedule.map((slot, i) => (
                <div key={i} className="text-[13px] text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-medium">{slot.dayName}</span>
                    <span>{slot.startTime} – {slot.endTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-5 text-gray-500">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{slot.resourceName}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[13px] text-gray-400 italic">Keine Trainingszeiten hinterlegt</span>
          )}
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Nächster Termin</div>
          {nextEvent ? (
            <div className="px-2.5 py-2 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-1.5 text-[13px]">
                <span>{nextEventType?.icon}</span>
                <span className="font-semibold text-gray-800 truncate">{nextEvent.title}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mt-0.5">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>
                  {new Date(nextEvent.date + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
                <Clock className="w-3 h-3 ml-1 shrink-0" />
                <span>{nextEvent.startTime} – {nextEvent.endTime}</span>
              </div>
              {nextEventResource && (
                <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{nextEventResource.name}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-[13px] text-gray-400 italic">Kein anstehender Termin</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamOverviewCard;
