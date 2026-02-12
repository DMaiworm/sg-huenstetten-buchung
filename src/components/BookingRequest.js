import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users, Plus, Shield, Repeat, Maximize, Building2, Building, UserCheck, Star, CalendarDays, CalendarRange } from 'lucide-react';
import { DAYS_FULL } from '../config/constants';
import { EVENT_TYPES } from '../config/organizationConfig';
import { timeToMinutes, generateSeriesDates, checkBookingConflicts } from '../utils/helpers';
import { Badge } from './ui/Badge';
import { Button } from './ui/Badge';

const UMLAUT_A = String.fromCharCode(228);
const UMLAUT_U = String.fromCharCode(252);
const UMLAUT_O = String.fromCharCode(246);
const UMLAUT_SS = String.fromCharCode(223);

const BookingRequest = ({ slots, onSubmit, users, bookings = [], resources, facilities, resourceGroups, clubs, departments, teams, trainerAssignments }) => {
  const RESOURCES = resources;

  const [formData, setFormData] = useState({
    // Resource selection (3-step)
    facilityId: facilities?.[0]?.id || '',
    groupId: '',
    resourceId: '',
    // Organization selection (3-step)
    clubId: '',
    departmentId: '',
    teamId: '',
    // Event type
    eventType: 'training',
    // Schedule mode
    scheduleMode: 'series', // 'single' or 'series'
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

  // ---- Derived data: Resources ----
  const facilityGroupsList = useMemo(() => {
    if (!resourceGroups || !formData.facilityId) return [];
    return resourceGroups.filter(g => g.facilityId === formData.facilityId).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [resourceGroups, formData.facilityId]);

  const groupResourcesList = useMemo(() => {
    if (!formData.groupId) return [];
    const group = (resourceGroups || []).find(g => g.id === formData.groupId);
    if (!group) return [];
    return RESOURCES.filter(r => r.category === group.icon);
  }, [formData.groupId, resourceGroups, RESOURCES]);

  const resource = RESOURCES.find(r => r.id === formData.resourceId);
  const isLimited = resource?.type === 'limited';
  const isComposite = resource?.isComposite;

  // ---- Derived data: Organization ----
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

  // Trainers for selected team
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

  // Allowed event types for selected team
  const allowedEventTypes = useMemo(() => {
    if (!selectedTeam || !selectedTeam.eventTypes) return EVENT_TYPES;
    return EVENT_TYPES.filter(et => selectedTeam.eventTypes.includes(et.id));
  }, [selectedTeam]);

  // ---- Schedule ----
  const availableSlots = useMemo(() => {
    if (!isLimited) return [];
    return slots.filter(s => s.resourceId === formData.resourceId && s.dayOfWeek === formData.dayOfWeek);
  }, [isLimited, formData.dayOfWeek, formData.resourceId, slots]);

  const previewDates = useMemo(() => {
    if (formData.scheduleMode === 'single') {
      return formData.singleDate ? [formData.singleDate] : [];
    }
    if (!formData.startDate || !formData.endDate) return [];
    return generateSeriesDates(formData.dayOfWeek, formData.startDate, formData.endDate);
  }, [formData.scheduleMode, formData.singleDate, formData.dayOfWeek, formData.startDate, formData.endDate]);

  const conflictAnalysis = useMemo(() => {
    if (previewDates.length === 0 || !formData.startTime || !formData.endTime || !formData.resourceId) {
      return { conflicts: [], hasErrors: false, hasWarnings: false };
    }
    const conflicts = checkBookingConflicts(formData.resourceId, previewDates, formData.startTime, formData.endTime, formData.eventType, bookings, slots, RESOURCES);
    const hasErrors = conflicts.some(c => c.conflicts.some(cf => cf.severity === 'error'));
    const hasWarnings = conflicts.some(c => c.conflicts.some(cf => cf.severity === 'warning'));
    return { conflicts, hasErrors, hasWarnings };
  }, [formData, previewDates, bookings, slots, RESOURCES]);

  // ---- Auto-suggest title ----
  const suggestedTitle = useMemo(() => {
    if (!selectedTeam) return '';
    const eventType = EVENT_TYPES.find(e => e.id === formData.eventType);
    return selectedTeam.name + ' ' + (eventType?.label || '');
  }, [selectedTeam, formData.eventType]);

  // ---- Handlers ----
  const handleFacilityChange = (facId) => {
    setFormData({ ...formData, facilityId: facId, groupId: '', resourceId: '' });
  };

  const handleGroupChange = (gId) => {
    setFormData({ ...formData, groupId: gId, resourceId: '' });
  };

  const handleClubChange = (cId) => {
    setFormData({ ...formData, clubId: cId, departmentId: '', teamId: '', eventType: 'training' });
  };

  const handleDeptChange = (dId) => {
    setFormData({ ...formData, departmentId: dId, teamId: '', eventType: 'training' });
  };

  const handleTeamChange = (tId) => {
    const team = (teams || []).find(t => t.id === tId);
    const defaultType = team?.eventTypes?.[0] || 'training';
    setFormData({ ...formData, teamId: tId, eventType: defaultType });
  };

  const handleEventTypeChange = (etId) => {
    const isSingleType = etId === 'match' || etId === 'event';
    setFormData({ ...formData, eventType: etId, scheduleMode: isSingleType ? 'single' : formData.scheduleMode });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (conflictAnalysis.hasErrors) { window.alert('Es gibt Konflikte, die eine Buchung unm' + UMLAUT_U + 'glich machen.'); return; }
    if (!formData.resourceId) { window.alert('Bitte Ressource ausw' + UMLAUT_A + 'hlen.'); return; }
    if (previewDates.length === 0) { window.alert('Bitte Termin(e) angeben.'); return; }
    if (isLimited && availableSlots.length === 0) { window.alert('Am ' + DAYS_FULL[formData.dayOfWeek] + ' ist kein Slot verf' + UMLAUT_U + 'gbar!'); return; }
    if (isLimited && availableSlots.length > 0) {
      const slot = availableSlots[0];
      const rs = timeToMinutes(formData.startTime); const re = timeToMinutes(formData.endTime);
      const ss = timeToMinutes(slot.startTime); const se = timeToMinutes(slot.endTime);
      if (rs < ss || re > se) { window.alert('Zeit au' + UMLAUT_SS + 'erhalb des Slots (' + slot.startTime + ' - ' + slot.endTime + ')!'); return; }
    }
    // Find a userId from the team's primary trainer
    const primaryTrainer = teamTrainers.find(t => t.isPrimary) || teamTrainers[0];
    const userId = primaryTrainer?.id || '';
    const title = formData.title || suggestedTitle;

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
    window.alert('Buchungsanfrage f' + UMLAUT_U + 'r ' + previewDates.length + ' Termin(e) eingereicht!');
    setFormData({ ...formData, title: '', description: '', singleDate: '', startDate: '', endDate: '' });
  };

  // ---- Section style ----
  const sectionStyle = { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '20px' };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' };
  const selectStyle = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' };
  const sectionHeader = (icon, title) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      <span style={{ color: '#2563eb' }}>{icon}</span>
      <span style={{ fontWeight: 600, fontSize: '15px', color: '#1f2937' }}>{title}</span>
    </div>
  );

  const selectedFacility = (facilities || []).find(f => f.id === formData.facilityId);
  const selectedEventType = EVENT_TYPES.find(e => e.id === formData.eventType);

  return (
    <div style={{ maxWidth: '720px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '4px' }}>Neue Buchungsanfrage</h2>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>Ressource und Mannschaft ausw{UMLAUT_A}hlen, Termin festlegen</p>

      <form onSubmit={handleSubmit}>

        {/* 1. RESOURCE SELECTION (3-step) */}
        <div style={sectionStyle}>
          {sectionHeader(<Building2 style={{ width: '20px', height: '20px' }} />, 'Ressource ausw' + UMLAUT_A + 'hlen')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Anlage</label>
              <select value={formData.facilityId} onChange={e => handleFacilityChange(e.target.value)} style={selectStyle}>
                <option value="">-- Anlage --</option>
                {(facilities || []).map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Bereich</label>
              <select value={formData.groupId} onChange={e => handleGroupChange(e.target.value)} style={selectStyle} disabled={!formData.facilityId}>
                <option value="">-- Bereich --</option>
                {facilityGroupsList.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Ressource</label>
              <select value={formData.resourceId} onChange={e => setFormData({ ...formData, resourceId: e.target.value })} style={selectStyle} disabled={!formData.groupId}>
                <option value="">-- Ressource --</option>
                {groupResourcesList.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </select>
            </div>
          </div>
          {isComposite && (
            <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e40af' }}>
              <Maximize style={{ width: '16px', height: '16px' }} /><strong>Ganzes Spielfeld:</strong> Reserviert automatisch beide H{UMLAUT_A}lften.
            </div>
          )}
          {isLimited && (
            <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#fefce8', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#854d0e' }}>
              <Shield style={{ width: '16px', height: '16px' }} /><strong>Limitierte Ressource:</strong> Nur in zugewiesenen Zeitfenstern buchbar.
            </div>
          )}
        </div>

        {/* 2. ORGANIZATION SELECTION (3-step) */}
        <div style={sectionStyle}>
          {sectionHeader(<Building style={{ width: '20px', height: '20px' }} />, 'Mannschaft ausw' + UMLAUT_A + 'hlen')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Verein</label>
              <select value={formData.clubId} onChange={e => handleClubChange(e.target.value)} style={selectStyle}>
                <option value="">-- Verein --</option>
                {(clubs || []).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Abteilung</label>
              <select value={formData.departmentId} onChange={e => handleDeptChange(e.target.value)} style={selectStyle} disabled={!formData.clubId}>
                <option value="">-- Abteilung --</option>
                {clubDepartments.map(d => (<option key={d.id} value={d.id}>{d.icon} {d.name}</option>))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mannschaft</label>
              <select value={formData.teamId} onChange={e => handleTeamChange(e.target.value)} style={selectStyle} disabled={!formData.departmentId}>
                <option value="">-- Mannschaft --</option>
                {departmentTeams.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </div>
          </div>
          {/* Show trainers when team is selected */}
          {teamTrainers.length > 0 && (
            <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '4px' }}>Trainer / {String.fromCharCode(220)}bungsleiter</div>
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
        </div>

        {/* 3. EVENT TYPE */}
        <div style={sectionStyle}>
          {sectionHeader(<Calendar style={{ width: '20px', height: '20px' }} />, 'Terminart')}
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

        {/* 4. SCHEDULE MODE TOGGLE */}
        <div style={sectionStyle}>
          {sectionHeader(<Repeat style={{ width: '20px', height: '20px' }} />, 'Terminplanung')}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button type="button" onClick={() => setFormData({ ...formData, scheduleMode: 'single' })}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                border: formData.scheduleMode === 'single' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                backgroundColor: formData.scheduleMode === 'single' ? '#eff6ff' : '#fff',
                fontWeight: 600, fontSize: '14px', color: formData.scheduleMode === 'single' ? '#1e40af' : '#6b7280',
              }}>
              <CalendarDays style={{ width: '18px', height: '18px' }} /> Einzeltermin
            </button>
            <button type="button" onClick={() => setFormData({ ...formData, scheduleMode: 'series' })}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                border: formData.scheduleMode === 'series' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                backgroundColor: formData.scheduleMode === 'series' ? '#eff6ff' : '#fff',
                fontWeight: 600, fontSize: '14px', color: formData.scheduleMode === 'series' ? '#1e40af' : '#6b7280',
              }}>
              <CalendarRange style={{ width: '18px', height: '18px' }} /> Terminserie
            </button>
          </div>

          {/* Single event fields */}
          {formData.scheduleMode === 'single' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Datum</label>
                <input type="date" value={formData.singleDate} onChange={e => setFormData({ ...formData, singleDate: e.target.value })} style={selectStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Startzeit</label>
                <input type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} style={selectStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Endzeit</label>
                <input type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} style={selectStyle} required />
              </div>
            </div>
          )}

          {/* Series fields */}
          {formData.scheduleMode === 'series' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>Wochentag</label>
                  <select value={formData.dayOfWeek} onChange={e => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })} style={selectStyle}>
                    {DAYS_FULL.map((day, i) => (<option key={i} value={i}>{day}</option>))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Startzeit</label>
                  <input type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} style={selectStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Endzeit</label>
                  <input type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} style={selectStyle} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Startdatum</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} style={selectStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Enddatum</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} style={selectStyle} required />
                </div>
              </div>
            </>
          )}

          {/* Slot info for limited resources */}
          {isLimited && formData.scheduleMode === 'series' && (
            <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '13px' }}>
              <strong style={{ color: '#1e40af' }}>Verf{UMLAUT_U}gbare Slots am {DAYS_FULL[formData.dayOfWeek]}:</strong>
              {availableSlots.length > 0 ? (
                <ul style={{ margin: '4px 0 0 0', padding: 0, listStyle: 'none' }}>
                  {availableSlots.map(slot => (
                    <li key={slot.id} style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <Clock style={{ width: '14px', height: '14px' }} />{slot.startTime} - {slot.endTime} Uhr
                      <span style={{ fontSize: '11px', color: '#60a5fa' }}>(bis {slot.validUntil})</span>
                    </li>
                  ))}
                </ul>
              ) : (<p style={{ color: '#dc2626', marginTop: '4px' }}>Kein Slot an diesem Tag verf{UMLAUT_U}gbar.</p>)}
            </div>
          )}
        </div>

        {/* 5. TITLE + DESCRIPTION */}
        <div style={sectionStyle}>
          {sectionHeader(<Users style={{ width: '20px', height: '20px' }} />, 'Buchungsdetails')}
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Titel *</label>
            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder={suggestedTitle || 'z.B. A-Jugend Training'}
              style={{ ...selectStyle, fontWeight: formData.title ? 600 : 400 }} />
            {suggestedTitle && !formData.title && (
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Vorschlag: "{suggestedTitle}" (wird automatisch verwendet wenn leer)</div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Beschreibung (optional)</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder={'Zus' + UMLAUT_A + 'tzliche Informationen...'} rows={2}
              style={{ ...selectStyle, resize: 'vertical' }} />
          </div>
        </div>

        {/* 6. PREVIEW + CONFLICTS */}
        {previewDates.length > 0 && (
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, fontSize: '15px', color: '#1f2937' }}>Vorschau: {previewDates.length} Termin{previewDates.length !== 1 ? 'e' : ''}</span>
              {conflictAnalysis.hasErrors && <Badge variant="danger">{conflictAnalysis.conflicts.filter(c => c.conflicts.length > 0).length} Konflikte</Badge>}
              {!conflictAnalysis.hasErrors && conflictAnalysis.conflicts.length === 0 && <Badge variant="success">Alle Termine verf{UMLAUT_U}gbar</Badge>}
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {previewDates.map((date, i) => {
                const dc = conflictAnalysis.conflicts.find(c => c.date === date);
                const hasError = dc?.conflicts.some(c => c.severity === 'error');
                const hasConflict = !!dc;
                return (
                  <div key={i} style={{
                    padding: '10px 12px', borderRadius: '8px',
                    border: hasError ? '2px solid #fca5a5' : hasConflict ? '2px solid #fde68a' : '2px solid #86efac',
                    backgroundColor: hasError ? '#fef2f2' : hasConflict ? '#fefce8' : '#f0fdf4',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#1f2937' }}>
                          {new Date(date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>{formData.startTime} - {formData.endTime}</span>
                      </div>
                      {!hasConflict && <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>Verf{UMLAUT_U}gbar</span>}
                    </div>
                    {hasConflict && dc.conflicts.map((conflict, ci) => (
                      <div key={ci} style={{ marginTop: '6px', padding: '6px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: conflict.severity === 'error' ? '#fee2e2' : '#fef9c3', color: conflict.severity === 'error' ? '#991b1b' : '#854d0e' }}>
                        <div style={{ fontWeight: 600 }}>{conflict.message}</div>
                        {conflict.explanation && <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.7, fontStyle: 'italic' }}>{conflict.explanation}</div>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. SUMMARY */}
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: '15px', color: '#1e40af', marginBottom: '8px' }}>Zusammenfassung</div>
          <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: '1.8' }}>
            <div><strong>Ressource:</strong> {selectedFacility?.name || '...'} {String.fromCharCode(8250)} {resource?.name || '...'}</div>
            <div><strong>Mannschaft:</strong> {selectedClub?.name || '...'} {String.fromCharCode(8250)} {selectedDept ? (selectedDept.icon + ' ' + selectedDept.name) : '...'} {String.fromCharCode(8250)} {selectedTeam?.name || '...'}</div>
            {teamTrainers.length > 0 && <div><strong>Trainer:</strong> {teamTrainers.map(t => t.firstName + ' ' + t.lastName + (t.isPrimary ? '' : ' (Co)')).join(', ')}</div>}
            <div><strong>Terminart:</strong> {selectedEventType ? (selectedEventType.icon + ' ' + selectedEventType.label) : '...'}</div>
            <div><strong>Modus:</strong> {formData.scheduleMode === 'single' ? 'Einzeltermin' : 'Terminserie'}</div>
            {formData.scheduleMode === 'series' && <div><strong>Wochentag:</strong> {DAYS_FULL[formData.dayOfWeek]}</div>}
            <div><strong>Uhrzeit:</strong> {formData.startTime || '--:--'} - {formData.endTime || '--:--'}</div>
            <div><strong>Termine:</strong> {previewDates.length}</div>
            <div><strong>Titel:</strong> {formData.title || suggestedTitle || '...'}</div>
          </div>
        </div>

        {/* 8. SUBMIT */}
        <button type="submit"
          disabled={previewDates.length === 0 || !formData.resourceId || conflictAnalysis.hasErrors}
          style={{
            width: '100%', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 700,
            border: 'none', cursor: previewDates.length === 0 || conflictAnalysis.hasErrors ? 'not-allowed' : 'pointer',
            backgroundColor: conflictAnalysis.hasErrors ? '#e5e7eb' : '#2563eb', color: conflictAnalysis.hasErrors ? '#6b7280' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
          <Plus style={{ width: '20px', height: '20px' }} />
          {conflictAnalysis.hasErrors
            ? 'Buchung nicht m' + UMLAUT_O + 'glich (Konflikte)'
            : 'Anfrage einreichen (' + previewDates.length + ' Termin' + (previewDates.length !== 1 ? 'e' : '') + ')'
          }
        </button>
      </form>
    </div>
  );
};

export default BookingRequest;
