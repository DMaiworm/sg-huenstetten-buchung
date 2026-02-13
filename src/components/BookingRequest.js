/**
 * BookingRequest – Multi-step form for creating new booking requests.
 *
 * Steps (sections):
 *   1. Resource selection    (Facility → Group → Resource, via groupId)
 *   2. Organisation selection (Club → Department → Team → Trainer display)
 *   3. Event type selection   (derived from team’s allowed eventTypes)
 *   4. Schedule mode          (single date vs. recurring series)
 *   5. Title & description
 *   6. Preview with conflict analysis
 *   7. Summary
 *   8. Submit button
 *
 * On submit, the component resolves the primary trainer for the selected
 * team and passes the booking data up via onSubmit(). The actual DB
 * insertion happens in App.js → handleNewBooking().
 *
 * Props:
 *   slots              - Slot definitions (for limited resources)
 *   bookings           - Existing bookings (for conflict detection)
 *   onSubmit           - Callback receiving the booking payload
 *   users              - User objects
 *   resources          - Legacy flat resource array (with groupId)
 *   facilities         - Facility objects
 *   resourceGroups     - Resource group objects
 *   clubs              - Club objects
 *   departments        - Department objects
 *   teams              - Team objects
 *   trainerAssignments - Trainer↔Team mapping
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar, Clock, Users, Plus, Shield, Repeat, Maximize,
  Building2, Building, Star, CalendarDays, CalendarRange,
} from 'lucide-react';
import { DAYS_FULL } from '../config/constants';
import { EVENT_TYPES } from '../config/organizationConfig';
import { timeToMinutes, generateSeriesDates, checkBookingConflicts } from '../utils/helpers';
import { Badge } from './ui/Badge';

// ──────────────────────────────────────────────
//  Shared inline style objects
// ──────────────────────────────────────────────
const sectionStyle = { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '20px' };
const labelStyle   = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' };
const selectStyle  = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' };

/** Section header with blue icon + title. */
const SectionHeader = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
    <span style={{ color: '#2563eb' }}>{icon}</span>
    <span style={{ fontWeight: 600, fontSize: '15px', color: '#1f2937' }}>{title}</span>
  </div>
);

// ──────────────────────────────────────────────
//  Component
// ──────────────────────────────────────────────

const BookingRequest = ({
  slots, onSubmit, users, bookings = [], resources,
  facilities, resourceGroups,
  clubs, departments, teams, trainerAssignments,
}) => {
  // ── Form state ─────────────────────────────
  const [formData, setFormData] = useState({
    // Resource selection (3-step)
    facilityId: facilities?.[0]?.id || '',
    groupId: '',
    resourceId: '',
    // Organisation selection (3-step)
    clubId: '',
    departmentId: '',
    teamId: '',
    // Event type
    eventType: 'training',
    // Schedule mode
    scheduleMode: 'series',   // 'single' | 'series'
    // Single event
    singleDate: '',
    // Series
    dayOfWeek: 1,
    startDate: '',
    endDate: '',
    // Time
    startTime: '16:00',
    endTime: '18:00',
    // Details
    title: '',
    description: '',
  });

  // ── Derived: resource groups for selected facility ──
  const facilityGroupsList = useMemo(() => {
    if (!resourceGroups || !formData.facilityId) return [];
    return resourceGroups
      .filter(g => g.facilityId === formData.facilityId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [resourceGroups, formData.facilityId]);

  // ── Derived: resources for selected group (via groupId, not category) ──
  const groupResourcesList = useMemo(() => {
    if (!formData.groupId) return [];
    return resources.filter(r => r.groupId === formData.groupId);
  }, [formData.groupId, resources]);

  // ── Current resource object ──
  const resource    = resources.find(r => r.id === formData.resourceId);
  const isLimited   = resource?.type === 'limited';
  const isComposite = resource?.isComposite;

  // ── Derived: organisation cascading dropdowns ──
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

  // ── Derived: trainers for selected team ──
  const teamTrainers = useMemo(() => {
    if (!trainerAssignments || !users || !formData.teamId) return [];
    return trainerAssignments
      .filter(ta => ta.teamId === formData.teamId)
      .map(ta => {
        const user = users.find(u => u.id === ta.userId);
        return user ? { ...user, isPrimary: ta.isPrimary } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  }, [trainerAssignments, users, formData.teamId]);

  // ── Derived: allowed event types for selected team ──
  const allowedEventTypes = useMemo(() => {
    if (!selectedTeam || !selectedTeam.eventTypes) return EVENT_TYPES;
    return EVENT_TYPES.filter(et => selectedTeam.eventTypes.includes(et.id));
  }, [selectedTeam]);

  // ── Derived: available slots for limited resources ──
  const availableSlots = useMemo(() => {
    if (!isLimited) return [];
    return slots.filter(s => s.resourceId === formData.resourceId && s.dayOfWeek === formData.dayOfWeek);
  }, [isLimited, formData.dayOfWeek, formData.resourceId, slots]);

  // ── Derived: preview dates from schedule config ──
  const previewDates = useMemo(() => {
    if (formData.scheduleMode === 'single') {
      return formData.singleDate ? [formData.singleDate] : [];
    }
    if (!formData.startDate || !formData.endDate) return [];
    return generateSeriesDates(formData.dayOfWeek, formData.startDate, formData.endDate);
  }, [formData.scheduleMode, formData.singleDate, formData.dayOfWeek, formData.startDate, formData.endDate]);

  // ── Derived: conflict analysis ──
  const conflictAnalysis = useMemo(() => {
    if (previewDates.length === 0 || !formData.startTime || !formData.endTime || !formData.resourceId) {
      return { conflicts: [], hasErrors: false, hasWarnings: false };
    }
    const conflicts = checkBookingConflicts(
      formData.resourceId, previewDates, formData.startTime, formData.endTime,
      formData.eventType, bookings, slots, resources,
    );
    const hasErrors   = conflicts.some(c => c.conflicts.some(cf => cf.severity === 'error'));
    const hasWarnings = conflicts.some(c => c.conflicts.some(cf => cf.severity === 'warning'));
    return { conflicts, hasErrors, hasWarnings };
  }, [formData, previewDates, bookings, slots, resources]);

  // ── Derived: auto-suggested title ──
  const suggestedTitle = useMemo(() => {
    if (!selectedTeam) return '';
    const eventType = EVENT_TYPES.find(e => e.id === formData.eventType);
    return selectedTeam.name + ' ' + (eventType?.label || '');
  }, [selectedTeam, formData.eventType]);

  // ── Handlers: resource cascade ────────────────
  const handleFacilityChange = (facId) => {
    setFormData(prev => ({ ...prev, facilityId: facId, groupId: '', resourceId: '' }));
  };
  const handleGroupChange = (gId) => {
    setFormData(prev => ({ ...prev, groupId: gId, resourceId: '' }));
  };

  // ── Handlers: organisation cascade ───────────
  const handleClubChange = (cId) => {
    setFormData(prev => ({ ...prev, clubId: cId, departmentId: '', teamId: '', eventType: 'training' }));
  };
  const handleDeptChange = (dId) => {
    setFormData(prev => ({ ...prev, departmentId: dId, teamId: '', eventType: 'training' }));
  };
  const handleTeamChange = (tId) => {
    const team = (teams || []).find(t => t.id === tId);
    const defaultType = team?.eventTypes?.[0] || 'training';
    setFormData(prev => ({ ...prev, teamId: tId, eventType: defaultType }));
  };

  // ── Handler: event type (auto-switch to single for match/event) ──
  const handleEventTypeChange = (etId) => {
    const isSingleType = etId === 'match' || etId === 'event';
    setFormData(prev => ({ ...prev, eventType: etId, scheduleMode: isSingleType ? 'single' : prev.scheduleMode }));
  };

  // ── Resolved display objects ──
  const selectedFacility  = (facilities || []).find(f => f.id === formData.facilityId);
  const selectedEventType = EVENT_TYPES.find(e => e.id === formData.eventType);

  // ── Submit handler ──────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (conflictAnalysis.hasErrors) {
      window.alert('Es gibt Konflikte, die eine Buchung unm\u00f6glich machen.');
      return;
    }
    if (!formData.resourceId) {
      window.alert('Bitte Ressource ausw\u00e4hlen.');
      return;
    }
    if (previewDates.length === 0) {
      window.alert('Bitte Termin(e) angeben.');
      return;
    }

    // Slot validation for limited resources
    if (isLimited && availableSlots.length === 0) {
      window.alert('Am ' + DAYS_FULL[formData.dayOfWeek] + ' ist kein Slot verf\u00fcgbar!');
      return;
    }
    if (isLimited && availableSlots.length > 0) {
      const slot = availableSlots[0];
      const rs = timeToMinutes(formData.startTime);
      const re = timeToMinutes(formData.endTime);
      const ss = timeToMinutes(slot.startTime);
      const se = timeToMinutes(slot.endTime);
      if (rs < ss || re > se) {
        window.alert('Zeit au\u00dferhalb des Slots (' + slot.startTime + ' \u2013 ' + slot.endTime + ')!');
        return;
      }
    }

    // Resolve userId from primary trainer
    const primaryTrainer = teamTrainers.find(t => t.isPrimary) || teamTrainers[0];
    const userId = primaryTrainer?.id || '';

    if (!userId) {
      console.warn('BookingRequest: Kein Trainer gefunden f\u00fcr Team', formData.teamId, '\u2013 teamTrainers:', teamTrainers);
      window.alert('Kein Trainer f\u00fcr die ausgew\u00e4hlte Mannschaft gefunden. Bitte Mannschaft mit zugewiesenem Trainer w\u00e4hlen.');
      return;
    }

    const title = formData.title || suggestedTitle;

    console.log('BookingRequest.handleSubmit:', {
      resourceId: formData.resourceId, dates: previewDates.length, userId, title,
    });

    onSubmit({
      resourceId: formData.resourceId,
      dates: previewDates,
      startTime: formData.startTime,
      endTime: formData.endTime,
      title,
      description: formData.description,
      bookingType: formData.eventType,
      userId,
      isComposite,
      includedResources: isComposite ? resource.includes : null,
    });

    window.alert('Buchungsanfrage f\u00fcr ' + previewDates.length + ' Termin(e) eingereicht!');
    setFormData(prev => ({ ...prev, title: '', description: '', singleDate: '', startDate: '', endDate: '' }));
  };

  // ══════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════

  return (
    <div style={{ maxWidth: '720px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '4px' }}>Neue Buchungsanfrage</h2>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>Ressource und Mannschaft ausw\u00e4hlen, Termin festlegen</p>

      <form onSubmit={handleSubmit}>

        {/* ── 1. Resource selection (Facility → Group → Resource) ── */}
        <div style={sectionStyle}>
          <SectionHeader icon={<Building2 style={{ width: '20px', height: '20px' }} />} title="Ressource ausw\u00e4hlen" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Anlage</label>
              <select value={formData.facilityId} onChange={e => handleFacilityChange(e.target.value)} style={selectStyle}>
                <option value="">-- Anlage --</option>
                {(facilities || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Bereich</label>
              <select value={formData.groupId} onChange={e => handleGroupChange(e.target.value)} style={selectStyle} disabled={!formData.facilityId}>
                <option value="">-- Bereich --</option>
                {facilityGroupsList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Ressource</label>
              <select value={formData.resourceId} onChange={e => setFormData(prev => ({ ...prev, resourceId: e.target.value }))} style={selectStyle} disabled={!formData.groupId}>
                <option value="">-- Ressource --</option>
                {groupResourcesList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          {isComposite && (
            <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e40af' }}>
              <Maximize style={{ width: '16px', height: '16px' }} /><strong>Ganzes Spielfeld:</strong> Reserviert automatisch beide H\u00e4lften.
            </div>
          )}
          {isLimited && (
            <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#fefce8', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#854d0e' }}>
              <Shield style={{ width: '16px', height: '16px' }} /><strong>Limitierte Ressource:</strong> Nur in zugewiesenen Zeitfenstern buchbar.
            </div>
          )}
        </div>

        {/* ── 2. Organisation selection (Club → Department → Team) ── */}
        <div style={sectionStyle}>
          <SectionHeader icon={<Building style={{ width: '20px', height: '20px' }} />} title="Mannschaft ausw\u00e4hlen" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Verein</label>
              <select value={formData.clubId} onChange={e => handleClubChange(e.target.value)} style={selectStyle}>
                <option value="">-- Verein --</option>
                {(clubs || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Abteilung</label>
              <select value={formData.departmentId} onChange={e => handleDeptChange(e.target.value)} style={selectStyle} disabled={!formData.clubId}>
                <option value="">-- Abteilung --</option>
                {clubDepartments.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mannschaft</label>
              <select value={formData.teamId} onChange={e => handleTeamChange(e.target.value)} style={selectStyle} disabled={!formData.departmentId}>
                <option value="">-- Mannschaft --</option>
                {departmentTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          {/* Trainer display when team is selected */}
          {teamTrainers.length > 0 && (
            <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '4px' }}>
                Trainer / \u00dcbungsleiter
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {teamTrainers.map(t => (
                  <span key={t.id} style={{ fontSize: '13px', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {t.isPrimary && <Star style={{ width: '12px', height: '12px', color: '#eab308', fill: '#eab308' }} />}
                    {t.firstName} {t.lastName}
                    {!t.isPrimary && <span style={{ fontSize: '11px', color: '#9ca3af' }}>(Co)</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Warning: team selected but no trainers found */}
          {formData.teamId && teamTrainers.length === 0 && (
            <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '13px', color: '#991b1b' }}>
              <strong>Achtung:</strong> Kein Trainer f\u00fcr diese Mannschaft zugeordnet. Buchung nicht m\u00f6glich.
            </div>
          )}
        </div>

        {/* ── 3. Event type ── */}
        <div style={sectionStyle}>
          <SectionHeader icon={<Calendar style={{ width: '20px', height: '20px' }} />} title="Terminart" />
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {allowedEventTypes.map(et => (
              <button key={et.id} type="button" onClick={() => handleEventTypeChange(et.id)}
                style={{
                  flex: '1 1 120px', padding: '12px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
                  border: formData.eventType === et.id ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  backgroundColor: formData.eventType === et.id ? '#eff6ff' : '#fff',
                }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>{et.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: formData.eventType === et.id ? '#1e40af' : '#374151' }}>{et.label}</div>
              </button>
            ))}
          </div>
          {selectedEventType && (
            <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '8px', backgroundColor: selectedEventType.color + '15', borderLeft: '4px solid ' + selectedEventType.color, fontSize: '13px', color: selectedEventType.color }}>
              <strong>{selectedEventType.icon} {selectedEventType.label}:</strong> {selectedEventType.description}
            </div>
          )}
        </div>

        {/* ── 4. Schedule mode (single / series) ── */}
        <div style={sectionStyle}>
          <SectionHeader icon={<Repeat style={{ width: '20px', height: '20px' }} />} title="Terminplanung" />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[{ mode: 'single', label: 'Einzeltermin', Icon: CalendarDays }, { mode: 'series', label: 'Terminserie', Icon: CalendarRange }].map(({ mode, label, Icon }) => (
              <button key={mode} type="button" onClick={() => setFormData(prev => ({ ...prev, scheduleMode: mode }))}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  border: formData.scheduleMode === mode ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  backgroundColor: formData.scheduleMode === mode ? '#eff6ff' : '#fff',
                  fontWeight: 600, fontSize: '14px', color: formData.scheduleMode === mode ? '#1e40af' : '#6b7280',
                }}>
                <Icon style={{ width: '18px', height: '18px' }} /> {label}
              </button>
            ))}
          </div>

          {/* Single event fields */}
          {formData.scheduleMode === 'single' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Datum</label>
                <input type="date" value={formData.singleDate} onChange={e => setFormData(prev => ({ ...prev, singleDate: e.target.value }))} style={selectStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Startzeit</label>
                <input type="time" value={formData.startTime} onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))} style={selectStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Endzeit</label>
                <input type="time" value={formData.endTime} onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))} style={selectStyle} required />
              </div>
            </div>
          )}

          {/* Series fields */}
          {formData.scheduleMode === 'series' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>Wochentag</label>
                  <select value={formData.dayOfWeek} onChange={e => setFormData(prev => ({ ...prev, dayOfWeek: Number(e.target.value) }))} style={selectStyle}>
                    {DAYS_FULL.map((day, i) => <option key={i} value={i}>{day}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Startzeit</label>
                  <input type="time" value={formData.startTime} onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))} style={selectStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Endzeit</label>
                  <input type="time" value={formData.endTime} onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))} style={selectStyle} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Startdatum</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))} style={selectStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Enddatum</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))} style={selectStyle} required />
                </div>
              </div>
            </>
          )}

          {/* Slot info for limited resources */}
          {isLimited && formData.scheduleMode === 'series' && (
            <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '13px' }}>
              <strong style={{ color: '#1e40af' }}>Verf\u00fcgbare Slots am {DAYS_FULL[formData.dayOfWeek]}:</strong>
              {availableSlots.length > 0 ? (
                <ul style={{ margin: '4px 0 0 0', padding: 0, listStyle: 'none' }}>
                  {availableSlots.map(slot => (
                    <li key={slot.id} style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <Clock style={{ width: '14px', height: '14px' }} />{slot.startTime} \u2013 {slot.endTime} Uhr
                      <span style={{ fontSize: '11px', color: '#60a5fa' }}>(bis {slot.validUntil})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#dc2626', marginTop: '4px' }}>Kein Slot an diesem Tag verf\u00fcgbar.</p>
              )}
            </div>
          )}
        </div>

        {/* ── 5. Title & description ── */}
        <div style={sectionStyle}>
          <SectionHeader icon={<Users style={{ width: '20px', height: '20px' }} />} title="Buchungsdetails" />
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Titel *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={suggestedTitle || 'z.B. A-Jugend Training'}
              style={{ ...selectStyle, fontWeight: formData.title ? 600 : 400 }}
            />
            {suggestedTitle && !formData.title && (
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                Vorschlag: "{suggestedTitle}" (wird automatisch verwendet wenn leer)
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Beschreibung (optional)</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Zus\u00e4tzliche Informationen..."
              rows={2}
              style={{ ...selectStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* ── 6. Preview + conflict analysis ── */}
        {previewDates.length > 0 && (
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, fontSize: '15px', color: '#1f2937' }}>
                Vorschau: {previewDates.length} Termin{previewDates.length !== 1 ? 'e' : ''}
              </span>
              {conflictAnalysis.hasErrors && (
                <Badge variant="danger">{conflictAnalysis.conflicts.filter(c => c.conflicts.length > 0).length} Konflikte</Badge>
              )}
              {!conflictAnalysis.hasErrors && conflictAnalysis.conflicts.length === 0 && (
                <Badge variant="success">Alle Termine verf\u00fcgbar</Badge>
              )}
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {previewDates.map((date, i) => {
                const dc = conflictAnalysis.conflicts.find(c => c.date === date);
                const hasError   = dc?.conflicts.some(c => c.severity === 'error');
                const hasConflict = !!dc;
                return (
                  <div key={date} style={{
                    padding: '10px 12px', borderRadius: '8px',
                    border: hasError ? '2px solid #fca5a5' : hasConflict ? '2px solid #fde68a' : '2px solid #86efac',
                    backgroundColor: hasError ? '#fef2f2' : hasConflict ? '#fefce8' : '#f0fdf4',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#1f2937' }}>
                          {new Date(date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>{formData.startTime} \u2013 {formData.endTime}</span>
                      </div>
                      {!hasConflict && <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>Verf\u00fcgbar</span>}
                    </div>
                    {hasConflict && dc.conflicts.map((conflict, ci) => (
                      <div key={ci} style={{
                        marginTop: '6px', padding: '6px 8px', borderRadius: '4px', fontSize: '12px',
                        backgroundColor: conflict.severity === 'error' ? '#fee2e2' : '#fef9c3',
                        color: conflict.severity === 'error' ? '#991b1b' : '#854d0e',
                      }}>
                        <div style={{ fontWeight: 600 }}>{conflict.message}</div>
                        {conflict.explanation && (
                          <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.7, fontStyle: 'italic' }}>{conflict.explanation}</div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 7. Summary ── */}
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: '15px', color: '#1e40af', marginBottom: '8px' }}>Zusammenfassung</div>
          <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: '1.8' }}>
            <div><strong>Ressource:</strong> {selectedFacility?.name || '...'} \u203a {resource?.name || '...'}</div>
            <div><strong>Mannschaft:</strong> {selectedClub?.name || '...'} \u203a {selectedDept ? (selectedDept.icon + ' ' + selectedDept.name) : '...'} \u203a {selectedTeam?.name || '...'}</div>
            {teamTrainers.length > 0 && (
              <div><strong>Trainer:</strong> {teamTrainers.map(t => t.firstName + ' ' + t.lastName + (t.isPrimary ? '' : ' (Co)')).join(', ')}</div>
            )}
            <div><strong>Terminart:</strong> {selectedEventType ? (selectedEventType.icon + ' ' + selectedEventType.label) : '...'}</div>
            <div><strong>Modus:</strong> {formData.scheduleMode === 'single' ? 'Einzeltermin' : 'Terminserie'}</div>
            {formData.scheduleMode === 'series' && <div><strong>Wochentag:</strong> {DAYS_FULL[formData.dayOfWeek]}</div>}
            <div><strong>Uhrzeit:</strong> {formData.startTime || '--:--'} \u2013 {formData.endTime || '--:--'}</div>
            <div><strong>Termine:</strong> {previewDates.length}</div>
            <div><strong>Titel:</strong> {formData.title || suggestedTitle || '...'}</div>
          </div>
        </div>

        {/* ── 8. Submit ── */}
        <button type="submit"
          disabled={previewDates.length === 0 || !formData.resourceId || conflictAnalysis.hasErrors}
          style={{
            width: '100%', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 700,
            border: 'none',
            cursor: (previewDates.length === 0 || conflictAnalysis.hasErrors) ? 'not-allowed' : 'pointer',
            backgroundColor: conflictAnalysis.hasErrors ? '#e5e7eb' : '#2563eb',
            color: conflictAnalysis.hasErrors ? '#6b7280' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
          <Plus style={{ width: '20px', height: '20px' }} />
          {conflictAnalysis.hasErrors
            ? 'Buchung nicht m\u00f6glich (Konflikte)'
            : 'Anfrage einreichen (' + previewDates.length + ' Termin' + (previewDates.length !== 1 ? 'e' : '') + ')'
          }
        </button>
      </form>
    </div>
  );
};

export default BookingRequest;
