/**
 * BookingRequest – Multi-step form for creating new booking requests.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar, Clock, Users, Plus, Shield, Repeat, Maximize,
  Building2, Building, Star, CalendarDays, CalendarRange, AlertCircle, X,
  CheckSquare, Square, Sun, Palmtree, CalendarPlus,
} from 'lucide-react';
import PageHeader from './ui/PageHeader';
import { DAYS_FULL } from '../config/constants';
import { EVENT_TYPES } from '../config/organizationConfig';
import { timeToMinutes, generateSeriesDates, checkBookingConflicts, getDateHolidayInfo } from '../utils/helpers';
import { Badge } from './ui/Badge';
import { useFacility } from '../contexts/FacilityContext';
import { useBookingContext } from '../contexts/BookingContext';
import { useUserContext } from '../contexts/UserContext';
import { useOrg } from '../contexts/OrganizationContext';
import { useHolidayContext } from '../contexts/HolidayContext';

const sectionCls = 'bg-white border border-gray-200 rounded-lg p-4 mb-5';
const labelCls = 'block text-[13px] font-semibold text-gray-700 mb-1.5';
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-blue-600">{icon}</span>
    <span className="font-semibold text-sm text-gray-800">{title}</span>
  </div>
);

const BookingRequest = ({ onSubmit }) => {
  const { RESOURCES: resources, slots, facilities, resourceGroups } = useFacility();
  const { bookings } = useBookingContext();
  const { users } = useUserContext();
  const { clubs, departments, teams, trainerAssignments } = useOrg();
  const { holidays } = useHolidayContext();

  const [formData, setFormData] = useState({
    facilityId: facilities?.[0]?.id || '', groupId: '', resourceId: '',
    clubId: '', departmentId: '', teamId: '',
    eventType: 'training', scheduleMode: 'series',
    singleDate: '', dayOfWeek: 1, startDate: '', endDate: '',
    startTime: '16:00', endTime: '18:00',
    title: '', description: '',
  });
  const [submitError, setSubmitError] = useState(null);
  const [includeHolidays, setIncludeHolidays] = useState(false);
  const [includeVacations, setIncludeVacations] = useState(false);
  const [manualOverrides, setManualOverrides] = useState({});

  useEffect(() => { setSubmitError(null); }, [
    formData.resourceId, formData.teamId, formData.startTime, formData.endTime,
    formData.singleDate, formData.startDate, formData.endDate, formData.dayOfWeek,
  ]);

  const facilityGroupsList = useMemo(() => {
    if (!resourceGroups || !formData.facilityId) return [];
    return resourceGroups.filter(g => g.facilityId === formData.facilityId).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [resourceGroups, formData.facilityId]);

  const groupResourcesList = useMemo(() => {
    if (!formData.groupId) return [];
    return resources.filter(r => r.groupId === formData.groupId);
  }, [formData.groupId, resources]);

  const resource = resources.find(r => r.id === formData.resourceId);
  const isLimited = resource?.type === 'limited';
  const isComposite = resource?.isComposite;

  const clubDepartments = useMemo(() => {
    if (!departments || !formData.clubId) return [];
    return departments.filter(d => d.clubId === formData.clubId).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [departments, formData.clubId]);

  const departmentTeams = useMemo(() => {
    if (!teams || !formData.departmentId) return [];
    return teams.filter(t => t.departmentId === formData.departmentId).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [teams, formData.departmentId]);

  const selectedTeam = (teams || []).find(t => t.id === formData.teamId);
  const selectedClub = (clubs || []).find(c => c.id === formData.clubId);
  const selectedDept = (departments || []).find(d => d.id === formData.departmentId);

  const teamTrainers = useMemo(() => {
    if (!trainerAssignments || !users || !formData.teamId) return [];
    return trainerAssignments
      .filter(ta => ta.teamId === formData.teamId)
      .map(ta => { const u = users.find(x => x.id === ta.userId); return u ? { ...u, isPrimary: ta.isPrimary } : null; })
      .filter(Boolean)
      .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  }, [trainerAssignments, users, formData.teamId]);

  const allowedEventTypes = useMemo(() => {
    if (!selectedTeam?.eventTypes) return EVENT_TYPES;
    return EVENT_TYPES.filter(et => selectedTeam.eventTypes.includes(et.id));
  }, [selectedTeam]);

  const availableSlots = useMemo(() => {
    if (!isLimited) return [];
    return slots.filter(s => s.resourceId === formData.resourceId && s.dayOfWeek === formData.dayOfWeek);
  }, [isLimited, formData.dayOfWeek, formData.resourceId, slots]);

  const previewDates = useMemo(() => {
    if (formData.scheduleMode === 'single') return formData.singleDate ? [formData.singleDate] : [];
    if (!formData.startDate || !formData.endDate) return [];
    return generateSeriesDates(formData.dayOfWeek, formData.startDate, formData.endDate);
  }, [formData.scheduleMode, formData.singleDate, formData.dayOfWeek, formData.startDate, formData.endDate]);

  const conflictAnalysis = useMemo(() => {
    if (previewDates.length === 0 || !formData.startTime || !formData.endTime || !formData.resourceId) {
      return { conflicts: [], hasErrors: false, hasWarnings: false };
    }
    const conflicts = checkBookingConflicts(
      formData.resourceId, previewDates, formData.startTime, formData.endTime,
      formData.eventType, bookings, slots, resources,
    );
    return {
      conflicts,
      hasErrors: conflicts.some(c => c.conflicts.some(cf => cf.severity === 'error')),
      hasWarnings: conflicts.some(c => c.conflicts.some(cf => cf.severity === 'warning')),
    };
  }, [formData, previewDates, bookings, slots, resources]);

  // Holiday/vacation info per date
  const dateHolidayMap = useMemo(() => {
    const map = {};
    previewDates.forEach(date => {
      map[date] = getDateHolidayInfo(date, holidays);
    });
    return map;
  }, [previewDates, holidays]);

  // Determine which dates are excluded (holiday/vacation) vs included
  const getDateStatus = (date) => {
    const info = dateHolidayMap[date] || { feiertag: null, schulferien: null };
    // Manual override takes priority
    if (manualOverrides[date] !== undefined) {
      return { excluded: !manualOverrides[date], ...info, manuallySet: true };
    }
    // Auto-exclude based on checkboxes
    const excludedByFeiertag = info.feiertag && !includeHolidays;
    const excludedByFerien = info.schulferien && !includeVacations;
    return { excluded: excludedByFeiertag || excludedByFerien, ...info, manuallySet: false };
  };

  // Dates that will actually be booked (not excluded)
  const effectiveDates = useMemo(() => {
    return previewDates.filter(date => !getDateStatus(date).excluded);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDates, dateHolidayMap, includeHolidays, includeVacations, manualOverrides]);

  // Reset manual overrides when checkboxes change
  useEffect(() => {
    setManualOverrides({});
  }, [includeHolidays, includeVacations]);

  // Toggle individual date inclusion
  const toggleDateOverride = (date) => {
    setManualOverrides(prev => {
      const currentStatus = getDateStatus(date);
      const copy = { ...prev };
      if (prev[date] !== undefined) {
        // Already overridden -> remove override (back to auto)
        delete copy[date];
      } else {
        // Set manual override: if currently excluded, include it (and vice versa)
        copy[date] = currentStatus.excluded;
      }
      return copy;
    });
  };

  const suggestedTitle = useMemo(() => {
    if (!selectedTeam) return '';
    const et = EVENT_TYPES.find(e => e.id === formData.eventType);
    return `${selectedTeam.name} ${et?.label || ''}`;
  }, [selectedTeam, formData.eventType]);

  // Handlers
  const handleFacilityChange = (v) => setFormData(p => ({ ...p, facilityId: v, groupId: '', resourceId: '' }));
  const handleGroupChange = (v) => setFormData(p => ({ ...p, groupId: v, resourceId: '' }));
  const handleClubChange = (v) => setFormData(p => ({ ...p, clubId: v, departmentId: '', teamId: '', eventType: 'training' }));
  const handleDeptChange = (v) => setFormData(p => ({ ...p, departmentId: v, teamId: '', eventType: 'training' }));
  const handleTeamChange = (v) => {
    const t = (teams || []).find(x => x.id === v);
    setFormData(p => ({ ...p, teamId: v, eventType: t?.eventTypes?.[0] || 'training' }));
  };
  const handleEventTypeChange = (v) => {
    const isSingle = v === 'match' || v === 'event';
    setFormData(p => ({ ...p, eventType: v, scheduleMode: isSingle ? 'single' : p.scheduleMode }));
  };

  const selectedFacility = (facilities || []).find(f => f.id === formData.facilityId);
  const selectedEventType = EVENT_TYPES.find(e => e.id === formData.eventType);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (conflictAnalysis.hasErrors) { setSubmitError('Es gibt Konflikte, die eine Buchung unmöglich machen.'); return; }
    if (!formData.resourceId) { setSubmitError('Bitte Ressource auswählen.'); return; }
    if (formData.startTime && formData.endTime && timeToMinutes(formData.startTime) >= timeToMinutes(formData.endTime)) {
      setSubmitError('Endzeit muss nach der Startzeit liegen.'); return;
    }
    if (effectiveDates.length === 0) { setSubmitError('Keine Termine zum Buchen vorhanden (alle ausgeschlossen oder keine Termine angegeben).'); return; }
    if (isLimited && availableSlots.length === 0) { setSubmitError(`Am ${DAYS_FULL[formData.dayOfWeek]} ist kein Slot verfügbar!`); return; }
    if (isLimited && availableSlots.length > 0) {
      const slot = availableSlots[0];
      if (timeToMinutes(formData.startTime) < timeToMinutes(slot.startTime) || timeToMinutes(formData.endTime) > timeToMinutes(slot.endTime)) {
        setSubmitError(`Zeit außerhalb des Slots (${slot.startTime} – ${slot.endTime})!`); return;
      }
    }
    const primaryTrainer = teamTrainers.find(t => t.isPrimary) || teamTrainers[0];
    if (!primaryTrainer?.id) { setSubmitError('Kein Trainer für die ausgewählte Mannschaft gefunden.'); return; }

    setSubmitError(null);
    onSubmit({
      resourceId: formData.resourceId, dates: effectiveDates,
      startTime: formData.startTime, endTime: formData.endTime,
      title: formData.title || suggestedTitle, description: formData.description,
      bookingType: formData.eventType, userId: primaryTrainer.id,
      teamId: formData.teamId,
      isComposite, includedResources: isComposite ? resource.includes : null,
    });
    setFormData(p => ({ ...p, title: '', description: '', singleDate: '', startDate: '', endDate: '' }));
  };

  return (
    <div className="max-w-[720px]">
      <PageHeader icon={CalendarPlus} title="Neue Buchungsanfrage" subtitle="Ressource und Mannschaft auswählen, Termin festlegen" />

      <form onSubmit={handleSubmit}>

        {/* 1. Resource selection */}
        <div className={sectionCls}>
          <SectionHeader icon={<Building2 className="w-5 h-5" />} title="Ressource auswählen" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Anlage</label>
              <select value={formData.facilityId} onChange={e => handleFacilityChange(e.target.value)} className={inputCls}>
                <option value="">-- Anlage --</option>
                {(facilities || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Bereich</label>
              <select value={formData.groupId} onChange={e => handleGroupChange(e.target.value)} className={inputCls} disabled={!formData.facilityId}>
                <option value="">-- Bereich --</option>
                {facilityGroupsList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ressource</label>
              <select value={formData.resourceId} onChange={e => setFormData(p => ({ ...p, resourceId: e.target.value }))} className={inputCls} disabled={!formData.groupId}>
                <option value="">-- Ressource --</option>
                {groupResourcesList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          {isComposite && (
            <div className="mt-3 px-3 py-2.5 bg-blue-50 rounded-lg flex items-center gap-2 text-[13px] text-blue-800">
              <Maximize className="w-4 h-4 flex-shrink-0" />
              <span><strong>Reserviert automatisch:</strong>{' '}
                {resources.filter(r => (resource.includes || []).includes(r.id)).map(r => r.name).join(', ')}
              </span>
            </div>
          )}
          {isLimited && (
            <div className="mt-3 px-3 py-2.5 bg-yellow-50 rounded-lg flex items-center gap-2 text-[13px] text-yellow-800">
              <Shield className="w-4 h-4" /><strong>Limitierte Ressource:</strong> Nur in zugewiesenen Zeitfenstern buchbar.
            </div>
          )}
        </div>

        {/* 2. Organisation selection */}
        <div className={sectionCls}>
          <SectionHeader icon={<Building className="w-5 h-5" />} title="Mannschaft auswählen" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Verein</label>
              <select value={formData.clubId} onChange={e => handleClubChange(e.target.value)} className={inputCls}>
                <option value="">-- Verein --</option>
                {(clubs || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Abteilung</label>
              <select value={formData.departmentId} onChange={e => handleDeptChange(e.target.value)} className={inputCls} disabled={!formData.clubId}>
                <option value="">-- Abteilung --</option>
                {clubDepartments.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Mannschaft</label>
              <select value={formData.teamId} onChange={e => handleTeamChange(e.target.value)} className={inputCls} disabled={!formData.departmentId}>
                <option value="">-- Mannschaft --</option>
                {departmentTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          {teamTrainers.length > 0 && (
            <div className="mt-3 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Trainer / Übungsleiter</div>
              <div className="flex gap-4 flex-wrap">
                {teamTrainers.map(t => (
                  <span key={t.id} className="text-[13px] text-gray-700 flex items-center gap-1">
                    {t.isPrimary && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                    {t.firstName} {t.lastName}
                    {!t.isPrimary && <span className="text-[11px] text-gray-400">(Co)</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          {formData.teamId && teamTrainers.length === 0 && (
            <div className="mt-3 px-3 py-2.5 bg-red-50 rounded-lg border border-red-200 text-[13px] text-red-800">
              <strong>Achtung:</strong> Kein Trainer für diese Mannschaft zugeordnet. Buchung nicht möglich.
            </div>
          )}
        </div>

        {/* 3. Event type */}
        <div className={sectionCls}>
          <SectionHeader icon={<Calendar className="w-5 h-5" />} title="Terminart" />
          <div className="flex gap-3 flex-wrap">
            {allowedEventTypes.map(et => (
              <button key={et.id} type="button" onClick={() => handleEventTypeChange(et.id)}
                className={`flex-1 min-w-[120px] p-3 rounded-lg text-center cursor-pointer border-2 transition-colors ${
                  formData.eventType === et.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                <div className="text-2xl mb-1">{et.icon}</div>
                <div className={`text-[13px] font-semibold ${formData.eventType === et.id ? 'text-blue-800' : 'text-gray-700'}`}>{et.label}</div>
              </button>
            ))}
          </div>
          {selectedEventType && (
            <div className="mt-2.5 px-3 py-2 rounded-lg text-[13px] border-l-4"
              style={{ backgroundColor: selectedEventType.color + '15', borderLeftColor: selectedEventType.color, color: selectedEventType.color }}>
              <strong>{selectedEventType.icon} {selectedEventType.label}:</strong> {selectedEventType.description}
            </div>
          )}
        </div>

        {/* 4. Schedule mode */}
        <div className={sectionCls}>
          <SectionHeader icon={<Repeat className="w-5 h-5" />} title="Terminplanung" />
          <div className="flex gap-2 mb-4">
            {[{ mode: 'single', label: 'Einzeltermin', Icon: CalendarDays }, { mode: 'series', label: 'Terminserie', Icon: CalendarRange }].map(({ mode, label, Icon }) => (
              <button key={mode} type="button" onClick={() => setFormData(p => ({ ...p, scheduleMode: mode }))}
                className={`flex-1 py-2.5 px-3 rounded-lg cursor-pointer flex items-center justify-center gap-2 border-2 font-semibold text-sm transition-colors ${
                  formData.scheduleMode === mode ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}>
                <Icon className="w-[18px] h-[18px]" /> {label}
              </button>
            ))}
          </div>

          {formData.scheduleMode === 'single' && (
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelCls}>Datum</label><input type="date" value={formData.singleDate} onChange={e => setFormData(p => ({ ...p, singleDate: e.target.value }))} className={inputCls} required /></div>
              <div><label className={labelCls}>Startzeit</label><input type="time" value={formData.startTime} onChange={e => setFormData(p => ({ ...p, startTime: e.target.value }))} className={inputCls} required /></div>
              <div><label className={labelCls}>Endzeit</label><input type="time" value={formData.endTime} onChange={e => setFormData(p => ({ ...p, endTime: e.target.value }))} className={inputCls} required /></div>
            </div>
          )}

          {formData.scheduleMode === 'series' && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className={labelCls}>Wochentag</label>
                  <select value={formData.dayOfWeek} onChange={e => setFormData(p => ({ ...p, dayOfWeek: Number(e.target.value) }))} className={inputCls}>
                    {DAYS_FULL.map((day, i) => <option key={i} value={i}>{day}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Startzeit</label><input type="time" value={formData.startTime} onChange={e => setFormData(p => ({ ...p, startTime: e.target.value }))} className={inputCls} required /></div>
                <div><label className={labelCls}>Endzeit</label><input type="time" value={formData.endTime} onChange={e => setFormData(p => ({ ...p, endTime: e.target.value }))} className={inputCls} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Startdatum</label><input type="date" value={formData.startDate} onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} className={inputCls} required /></div>
                <div><label className={labelCls}>Enddatum</label><input type="date" value={formData.endDate} onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))} className={inputCls} required /></div>
              </div>

              {/* Ferien/Feiertage Optionen */}
              <div className="mt-3 px-3 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Ferien & Feiertage</div>
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => setIncludeHolidays(v => !v)}
                    className="flex items-center gap-2 text-[13px] text-gray-700 hover:text-gray-900 cursor-pointer bg-transparent border-none p-0 text-left">
                    {includeHolidays
                      ? <CheckSquare className="w-4 h-4 text-blue-600" />
                      : <Square className="w-4 h-4 text-gray-400" />}
                    <Sun className="w-3.5 h-3.5 text-orange-500" />
                    <span>Auch an <strong>Feiertagen</strong> buchen</span>
                  </button>
                  <button type="button" onClick={() => setIncludeVacations(v => !v)}
                    className="flex items-center gap-2 text-[13px] text-gray-700 hover:text-gray-900 cursor-pointer bg-transparent border-none p-0 text-left">
                    {includeVacations
                      ? <CheckSquare className="w-4 h-4 text-blue-600" />
                      : <Square className="w-4 h-4 text-gray-400" />}
                    <Palmtree className="w-3.5 h-3.5 text-green-600" />
                    <span>Auch in den <strong>Ferien</strong> buchen</span>
                  </button>
                </div>
                {(!includeHolidays || !includeVacations) && (
                  <div className="mt-2 text-[11px] text-gray-400 italic">
                    Termine an {!includeHolidays && !includeVacations ? 'Feiertagen und in Ferien' : !includeHolidays ? 'Feiertagen' : 'in Ferien'} werden
                    in der Vorschau rot markiert und nicht gebucht. Einzelne Termine können per Klick wieder aktiviert werden.
                  </div>
                )}
              </div>
            </>
          )}

          {isLimited && formData.scheduleMode === 'series' && (
            <div className="mt-3 px-3 py-2.5 bg-blue-50 rounded-lg text-[13px]">
              <strong className="text-blue-800">Verfügbare Slots am {DAYS_FULL[formData.dayOfWeek]}:</strong>
              {availableSlots.length > 0 ? (
                <ul className="mt-1 space-y-0.5 list-none p-0 m-0">
                  {availableSlots.map(slot => (
                    <li key={slot.id} className="text-blue-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />{slot.startTime} – {slot.endTime} Uhr
                      <span className="text-[11px] text-blue-400">(bis {slot.validUntil})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-600 mt-1">Kein Slot an diesem Tag verfügbar.</p>
              )}
            </div>
          )}
        </div>

        {/* 5. Title & description */}
        <div className={sectionCls}>
          <SectionHeader icon={<Users className="w-5 h-5" />} title="Buchungsdetails" />
          <div className="mb-3">
            <label className={labelCls}>Titel *</label>
            <input type="text" value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder={suggestedTitle || 'z.B. A-Jugend Training'}
              className={`${inputCls} ${formData.title ? 'font-semibold' : ''}`} />
            {suggestedTitle && !formData.title && (
              <div className="text-[11px] text-gray-400 mt-1">Vorschlag: "{suggestedTitle}" (wird automatisch verwendet wenn leer)</div>
            )}
          </div>
          <div>
            <label className={labelCls}>Beschreibung (optional)</label>
            <textarea value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Zusätzliche Informationen..." rows={2}
              className={`${inputCls} resize-y`} />
          </div>
        </div>

        {/* 6. Preview + conflict analysis */}
        {previewDates.length > 0 && (
          <div className={sectionCls}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-[15px] text-gray-800">
                Vorschau: {effectiveDates.length} von {previewDates.length} Termin{previewDates.length !== 1 ? 'en' : ''}
              </span>
              <div className="flex gap-2">
                {previewDates.length !== effectiveDates.length && (
                  <Badge variant="default">{previewDates.length - effectiveDates.length} ausgeschlossen</Badge>
                )}
                {conflictAnalysis.hasErrors && (
                  <Badge variant="danger">{conflictAnalysis.conflicts.filter(c => c.conflicts.length > 0).length} Konflikte</Badge>
                )}
                {!conflictAnalysis.hasErrors && conflictAnalysis.conflicts.length === 0 && effectiveDates.length === previewDates.length && (
                  <Badge variant="success">Alle Termine verfügbar</Badge>
                )}
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto flex flex-col gap-1.5">
              {previewDates.map(date => {
                const status = getDateStatus(date);
                const dc = conflictAnalysis.conflicts.find(c => c.date === date);
                const hasError = dc?.conflicts.some(c => c.severity === 'error');
                const hasConflict = !!dc;
                const isExcluded = status.excluded;

                // Color logic: excluded (holiday/vacation) = red-dashed, conflict = red/yellow, ok = green
                let borderCls, bgCls;
                if (isExcluded) {
                  borderCls = 'border-red-300 border-dashed';
                  bgCls = 'bg-red-50 opacity-75';
                } else if (hasError) {
                  borderCls = 'border-red-300';
                  bgCls = 'bg-red-50';
                } else if (hasConflict) {
                  borderCls = 'border-yellow-300';
                  bgCls = 'bg-yellow-50';
                } else {
                  borderCls = 'border-green-300';
                  bgCls = 'bg-green-50';
                }

                return (
                  <div key={date} className={`px-3 py-2.5 rounded-lg border-2 ${borderCls} ${bgCls}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 flex-1">
                        {/* Toggle button for holiday/vacation dates */}
                        {(status.feiertag || status.schulferien) && (
                          <button type="button" onClick={() => toggleDateOverride(date)}
                            className="shrink-0 bg-transparent border-none p-0 cursor-pointer"
                            title={isExcluded ? 'Termin wieder aktivieren' : 'Termin ausschließen'}>
                            {isExcluded
                              ? <Square className="w-4 h-4 text-red-400 hover:text-red-600" />
                              : <CheckSquare className="w-4 h-4 text-green-600 hover:text-green-700" />}
                          </button>
                        )}
                        <div>
                          <span className={`font-semibold text-[13px] ${isExcluded ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {new Date(date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">{formData.startTime} – {formData.endTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Holiday/vacation badges */}
                        {status.feiertag && (
                          <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded font-medium ${
                            isExcluded ? 'bg-red-200 text-red-800' : 'bg-orange-100 text-orange-700'
                          }`}>
                            <Sun className="w-3 h-3" />{status.feiertag}
                          </span>
                        )}
                        {status.schulferien && (
                          <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded font-medium ${
                            isExcluded ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-700'
                          }`}>
                            <Palmtree className="w-3 h-3" />{status.schulferien}
                          </span>
                        )}
                        {!isExcluded && !hasConflict && !status.feiertag && !status.schulferien && (
                          <span className="text-xs text-green-600 font-semibold">Verfügbar</span>
                        )}
                        {!isExcluded && !hasConflict && (status.feiertag || status.schulferien) && (
                          <span className="text-xs text-green-600 font-semibold">Gebucht</span>
                        )}
                        {isExcluded && (
                          <span className="text-xs text-red-500 font-semibold">Ausgeschlossen</span>
                        )}
                      </div>
                    </div>
                    {/* Conflict details (only shown for non-excluded dates) */}
                    {!isExcluded && hasConflict && dc.conflicts.map((conflict, ci) => (
                      <div key={ci} className={`mt-1.5 px-2 py-1.5 rounded text-xs ${
                        conflict.severity === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        <div className="font-semibold">{conflict.message}</div>
                        {conflict.explanation && <div className="text-[11px] mt-0.5 opacity-70 italic">{conflict.explanation}</div>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
          <div className="font-semibold text-[15px] text-blue-800 mb-2">Zusammenfassung</div>
          <div className="text-[13px] text-blue-800 leading-[1.8]">
            <div><strong>Ressource:</strong> {selectedFacility?.name || '...'} › {resource?.name || '...'}</div>
            <div><strong>Mannschaft:</strong> {selectedClub?.name || '...'} › {selectedDept ? `${selectedDept.icon} ${selectedDept.name}` : '...'} › {selectedTeam?.name || '...'}</div>
            {teamTrainers.length > 0 && (
              <div><strong>Trainer:</strong> {teamTrainers.map(t => `${t.firstName} ${t.lastName}${t.isPrimary ? '' : ' (Co)'}`).join(', ')}</div>
            )}
            <div><strong>Terminart:</strong> {selectedEventType ? `${selectedEventType.icon} ${selectedEventType.label}` : '...'}</div>
            <div><strong>Modus:</strong> {formData.scheduleMode === 'single' ? 'Einzeltermin' : 'Terminserie'}</div>
            {formData.scheduleMode === 'series' && <div><strong>Wochentag:</strong> {DAYS_FULL[formData.dayOfWeek]}</div>}
            <div><strong>Uhrzeit:</strong> {formData.startTime || '--:--'} – {formData.endTime || '--:--'}</div>
            <div><strong>Termine:</strong> {effectiveDates.length}{effectiveDates.length !== previewDates.length && ` von ${previewDates.length} (${previewDates.length - effectiveDates.length} ausgeschlossen)`}</div>
            <div><strong>Titel:</strong> {formData.title || suggestedTitle || '...'}</div>
          </div>
        </div>

        {/* 8. Submit */}
        {submitError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span className="text-sm text-red-700 flex-1">{submitError}</span>
            <button type="button" onClick={() => setSubmitError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <button type="submit"
          disabled={effectiveDates.length === 0 || !formData.resourceId || conflictAnalysis.hasErrors}
          className={`w-full py-3 px-6 rounded-lg text-[15px] font-bold border-none flex items-center justify-center gap-2 transition-colors ${
            conflictAnalysis.hasErrors || effectiveDates.length === 0 || !formData.resourceId
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
          }`}>
          <Plus className="w-5 h-5" />
          {conflictAnalysis.hasErrors
            ? 'Buchung nicht möglich (Konflikte)'
            : effectiveDates.length === 0
              ? 'Keine buchbaren Termine'
              : `Anfrage einreichen (${effectiveDates.length} Termin${effectiveDates.length !== 1 ? 'e' : ''})`
          }
        </button>
      </form>
    </div>
  );
};

export default BookingRequest;
