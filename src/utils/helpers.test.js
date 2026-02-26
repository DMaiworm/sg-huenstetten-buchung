import {
  formatDate,
  formatDateISO,
  getWeekStart,
  getWeekDates,
  timeToMinutes,
  generateSeriesDates,
  getDateHolidayInfo,
  hasTimeOverlap,
  findConflicts,
  checkBookingConflicts,
} from './helpers';

// ── formatDate ──────────────────────────────────

describe('formatDate', () => {
  it('formatiert Datum im deutschen Format dd.MM.yyyy', () => {
    const date = new Date(2025, 2, 5); // 5. März 2025
    expect(formatDate(date)).toBe('05.03.2025');
  });

  it('behandelt einstellige Tage/Monate mit führender Null', () => {
    const date = new Date(2025, 0, 1); // 1. Januar 2025
    expect(formatDate(date)).toBe('01.01.2025');
  });
});

// ── formatDateISO ───────────────────────────────

describe('formatDateISO', () => {
  it('formatiert als YYYY-MM-DD', () => {
    const date = new Date(2025, 2, 5);
    expect(formatDateISO(date)).toBe('2025-03-05');
  });

  it('padded Monat und Tag korrekt', () => {
    const date = new Date(2025, 0, 9);
    expect(formatDateISO(date)).toBe('2025-01-09');
  });
});

// ── getWeekStart ────────────────────────────────

describe('getWeekStart', () => {
  it('gibt Montag zurück wenn Mittwoch übergeben wird', () => {
    const wed = new Date(2025, 2, 5); // Mi, 5. März
    const monday = getWeekStart(wed);
    expect(monday.getDay()).toBe(1); // Montag
    expect(formatDateISO(monday)).toBe('2025-03-03');
  });

  it('gibt denselben Tag zurück wenn Montag übergeben wird', () => {
    const mon = new Date(2025, 2, 3);
    const result = getWeekStart(mon);
    expect(formatDateISO(result)).toBe('2025-03-03');
  });

  it('geht zur vorherigen Woche wenn Sonntag übergeben wird', () => {
    const sun = new Date(2025, 2, 9); // Sonntag
    const result = getWeekStart(sun);
    expect(formatDateISO(result)).toBe('2025-03-03');
  });

  it('setzt Uhrzeit auf Mitternacht', () => {
    const date = new Date(2025, 2, 5, 14, 30);
    const result = getWeekStart(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });
});

// ── getWeekDates ────────────────────────────────

describe('getWeekDates', () => {
  it('gibt Array mit 7 Tagen zurück (Mo–So)', () => {
    const date = new Date(2025, 2, 5);
    const week = getWeekDates(date);
    expect(week).toHaveLength(7);
  });

  it('startet mit Montag und endet mit Sonntag', () => {
    const date = new Date(2025, 2, 5);
    const week = getWeekDates(date);
    expect(week[0].getDay()).toBe(1); // Mo
    expect(week[6].getDay()).toBe(0); // So
  });

  it('enthält aufeinanderfolgende Tage', () => {
    const week = getWeekDates(new Date(2025, 2, 5));
    for (let i = 1; i < 7; i++) {
      expect(week[i].getDate() - week[i - 1].getDate()).toBe(1);
    }
  });
});

// ── timeToMinutes ───────────────────────────────

describe('timeToMinutes', () => {
  it('konvertiert "08:30" zu 510', () => {
    expect(timeToMinutes('08:30')).toBe(510);
  });

  it('konvertiert "00:00" zu 0', () => {
    expect(timeToMinutes('00:00')).toBe(0);
  });

  it('konvertiert "23:59" zu 1439', () => {
    expect(timeToMinutes('23:59')).toBe(1439);
  });
});

// ── generateSeriesDates ─────────────────────────

describe('generateSeriesDates', () => {
  it('generiert wöchentliche Termine für einen Monat', () => {
    // Jeden Montag im März 2025
    const dates = generateSeriesDates(1, '2025-03-01', '2025-03-31');
    expect(dates).toEqual(['2025-03-03', '2025-03-10', '2025-03-17', '2025-03-24', '2025-03-31']);
  });

  it('gibt leeres Array wenn Zeitraum zu kurz', () => {
    // Montag gesucht, aber Zeitraum ist nur Di-Mi
    const dates = generateSeriesDates(1, '2025-03-04', '2025-03-05');
    expect(dates).toEqual([]);
  });

  it('inkludiert Start- und Enddatum wenn sie auf den Wochentag fallen', () => {
    const dates = generateSeriesDates(3, '2025-03-05', '2025-03-05'); // Mi
    expect(dates).toEqual(['2025-03-05']);
  });
});

// ── getDateHolidayInfo ──────────────────────────

describe('getDateHolidayInfo', () => {
  const holidays = [
    { name: 'Weihnachten', type: 'feiertag', start_date: '2025-12-25', end_date: '2025-12-25' },
    { name: 'Winterferien', type: 'schulferien', start_date: '2025-12-23', end_date: '2026-01-03' },
  ];

  it('erkennt Feiertag', () => {
    const result = getDateHolidayInfo('2025-12-25', holidays);
    expect(result.feiertag).toBe('Weihnachten');
  });

  it('erkennt Schulferien', () => {
    const result = getDateHolidayInfo('2025-12-28', holidays);
    expect(result.schulferien).toBe('Winterferien');
  });

  it('erkennt beides gleichzeitig', () => {
    const result = getDateHolidayInfo('2025-12-25', holidays);
    expect(result.feiertag).toBe('Weihnachten');
    expect(result.schulferien).toBe('Winterferien');
  });

  it('gibt null zurück wenn kein Feiertag', () => {
    const result = getDateHolidayInfo('2025-06-15', holidays);
    expect(result.feiertag).toBeNull();
    expect(result.schulferien).toBeNull();
  });

  it('behandelt leeres Holiday-Array', () => {
    const result = getDateHolidayInfo('2025-12-25', []);
    expect(result.feiertag).toBeNull();
  });

  it('funktioniert mit camelCase-Feldern', () => {
    const camelHolidays = [
      { name: 'Tag X', type: 'feiertag', startDate: '2025-06-01', endDate: '2025-06-01' },
    ];
    const result = getDateHolidayInfo('2025-06-01', camelHolidays);
    expect(result.feiertag).toBe('Tag X');
  });
});

// ── hasTimeOverlap ──────────────────────────────

describe('hasTimeOverlap', () => {
  it('erkennt vollständige Überlappung', () => {
    expect(hasTimeOverlap('08:00', '10:00', '09:00', '11:00')).toBe(true);
  });

  it('erkennt Enthaltensein', () => {
    expect(hasTimeOverlap('08:00', '12:00', '09:00', '10:00')).toBe(true);
  });

  it('erkennt keine Überlappung bei angrenzenden Zeiten', () => {
    // 08:00-10:00 und 10:00-12:00 → kein Overlap (s1 < e2 && s2 < e1)
    expect(hasTimeOverlap('08:00', '10:00', '10:00', '12:00')).toBe(false);
  });

  it('erkennt keine Überlappung bei getrennten Zeiten', () => {
    expect(hasTimeOverlap('08:00', '09:00', '14:00', '16:00')).toBe(false);
  });

  it('erkennt identische Zeiten als Überlappung', () => {
    expect(hasTimeOverlap('08:00', '10:00', '08:00', '10:00')).toBe(true);
  });
});

// ── findConflicts ───────────────────────────────

describe('findConflicts', () => {
  const baseBooking = {
    id: 'b1',
    resourceId: 'r1',
    date: '2025-03-05',
    startTime: '08:00',
    endTime: '10:00',
    status: 'approved',
    seriesId: null,
  };

  it('findet Konflikt bei gleicher Ressource und überlappender Zeit', () => {
    const booking = { ...baseBooking, seriesId: 's1' };
    const other = { ...baseBooking, id: 'b2', seriesId: 's2', startTime: '09:00', endTime: '11:00' };
    const conflicts = findConflicts(booking, [booking, other]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe('b2');
  });

  it('erkennt Konflikt zwischen zwei Einzelbuchungen (seriesId: null)', () => {
    const other = { ...baseBooking, id: 'b2', startTime: '09:00', endTime: '11:00' };
    const conflicts = findConflicts(baseBooking, [baseBooking, other]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe('b2');
  });

  it('ignoriert eigene Buchung', () => {
    const conflicts = findConflicts(baseBooking, [baseBooking]);
    expect(conflicts).toHaveLength(0);
  });

  it('ignoriert abgelehnte Buchungen', () => {
    const rejected = { ...baseBooking, id: 'b2', status: 'rejected', startTime: '09:00', endTime: '11:00' };
    const conflicts = findConflicts(baseBooking, [baseBooking, rejected]);
    expect(conflicts).toHaveLength(0);
  });

  it('ignoriert andere Ressourcen', () => {
    const other = { ...baseBooking, id: 'b2', resourceId: 'r2', startTime: '09:00', endTime: '11:00' };
    const conflicts = findConflicts(baseBooking, [baseBooking, other]);
    expect(conflicts).toHaveLength(0);
  });

  it('ignoriert andere Daten', () => {
    const other = { ...baseBooking, id: 'b2', date: '2025-03-06', startTime: '09:00', endTime: '11:00' };
    const conflicts = findConflicts(baseBooking, [baseBooking, other]);
    expect(conflicts).toHaveLength(0);
  });

  it('ignoriert Buchungen derselben Serie', () => {
    const booking = { ...baseBooking, seriesId: 's1' };
    const sameSeries = { ...baseBooking, id: 'b2', seriesId: 's1', startTime: '09:00', endTime: '11:00' };
    const conflicts = findConflicts(booking, [booking, sameSeries]);
    expect(conflicts).toHaveLength(0);
  });

  it('findet pending Buchungen als Konflikte', () => {
    const booking = { ...baseBooking, seriesId: 's1' };
    const pending = { ...baseBooking, id: 'b2', seriesId: 's2', status: 'pending', startTime: '09:00', endTime: '11:00' };
    const conflicts = findConflicts(booking, [booking, pending]);
    expect(conflicts).toHaveLength(1);
  });
});

// ── checkBookingConflicts ───────────────────────

describe('checkBookingConflicts', () => {
  // Einfache Ressource (Standard)
  const resources = [
    { id: 'r1', type: 'standard' },
    { id: 'r-parent', type: 'standard', isComposite: true, includes: ['r-sub1', 'r-sub2'] },
    { id: 'r-sub1', type: 'standard', partOf: 'r-parent' },
    { id: 'r-sub2', type: 'standard', partOf: 'r-parent' },
    { id: 'r-limited', type: 'limited' },
  ];

  const noSlots = [];
  const noBookings = [];

  it('gibt leeres Array wenn keine Konflikte', () => {
    const result = checkBookingConflicts('r1', ['2025-03-05'], '08:00', '10:00', 'training', noBookings, noSlots, resources);
    expect(result).toHaveLength(0);
  });

  it('erkennt Zeitüberlappung auf gleicher Ressource', () => {
    const existingBooking = {
      id: 'b1', resourceId: 'r1', date: '2025-03-05',
      startTime: '09:00', endTime: '11:00', status: 'approved', bookingType: 'training',
    };
    const result = checkBookingConflicts('r1', ['2025-03-05'], '08:00', '10:00', 'training', [existingBooking], noSlots, resources);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2025-03-05');
    expect(result[0].conflicts[0].type).toBe('time_overlap');
  });

  it('ignoriert abgelehnte Buchungen', () => {
    const rejected = {
      id: 'b1', resourceId: 'r1', date: '2025-03-05',
      startTime: '09:00', endTime: '11:00', status: 'rejected', bookingType: 'training',
    };
    const result = checkBookingConflicts('r1', ['2025-03-05'], '08:00', '10:00', 'training', [rejected], noSlots, resources);
    expect(result).toHaveLength(0);
  });

  it('erkennt Composite-Konflikt: Teilfeld belegt → Ganzes Feld anfragen', () => {
    const subBooking = {
      id: 'b1', resourceId: 'r-sub1', date: '2025-03-05',
      startTime: '09:00', endTime: '11:00', status: 'approved', bookingType: 'training',
    };
    const result = checkBookingConflicts('r-parent', ['2025-03-05'], '08:00', '10:00', 'training', [subBooking], noSlots, resources);
    expect(result).toHaveLength(1);
    expect(result[0].conflicts[0].type).toBe('composite_blocked');
  });

  it('erkennt Parent-Konflikt: Ganzes Feld belegt → Teilfeld anfragen', () => {
    const parentBooking = {
      id: 'b1', resourceId: 'r-parent', date: '2025-03-05',
      startTime: '09:00', endTime: '11:00', status: 'approved', bookingType: 'training',
    };
    const result = checkBookingConflicts('r-sub1', ['2025-03-05'], '08:00', '10:00', 'training', [parentBooking], noSlots, resources);
    expect(result).toHaveLength(1);
    expect(result[0].conflicts[0].type).toBe('parent_blocked');
  });

  it('erkennt fehlenden Slot bei limitierter Ressource', () => {
    const result = checkBookingConflicts('r-limited', ['2025-03-05'], '08:00', '10:00', 'training', noBookings, noSlots, resources);
    expect(result).toHaveLength(1);
    expect(result[0].conflicts[0].type).toBe('no_slot');
  });

  it('erkennt Buchung außerhalb des Slots', () => {
    const slots = [{
      resourceId: 'r-limited',
      dayOfWeek: 3, // Mittwoch
      startTime: '10:00',
      endTime: '12:00',
      validFrom: '2025-01-01',
      validUntil: '2025-12-31',
    }];
    const result = checkBookingConflicts('r-limited', ['2025-03-05'], '08:00', '10:00', 'training', noBookings, slots, resources);
    expect(result).toHaveLength(1);
    expect(result[0].conflicts[0].type).toBe('outside_slot');
  });

  it('akzeptiert Buchung innerhalb des Slots', () => {
    const slots = [{
      resourceId: 'r-limited',
      dayOfWeek: 3,
      startTime: '08:00',
      endTime: '12:00',
      validFrom: '2025-01-01',
      validUntil: '2025-12-31',
    }];
    const result = checkBookingConflicts('r-limited', ['2025-03-05'], '09:00', '11:00', 'training', noBookings, slots, resources);
    expect(result).toHaveLength(0);
  });

  it('Severity: error wenn allowOverlap=false, warning wenn beide allowOverlap=true', () => {
    // training hat allowOverlap: false → error
    const booking1 = {
      id: 'b1', resourceId: 'r1', date: '2025-03-05',
      startTime: '09:00', endTime: '11:00', status: 'approved', bookingType: 'training',
    };
    const result1 = checkBookingConflicts('r1', ['2025-03-05'], '08:00', '10:00', 'training', [booking1], noSlots, resources);
    expect(result1[0].conflicts[0].severity).toBe('error');

    // other hat allowOverlap: true → warning wenn beide "other"
    const booking2 = {
      id: 'b2', resourceId: 'r1', date: '2025-03-05',
      startTime: '09:00', endTime: '11:00', status: 'approved', bookingType: 'other',
    };
    const result2 = checkBookingConflicts('r1', ['2025-03-05'], '08:00', '10:00', 'other', [booking2], noSlots, resources);
    expect(result2[0].conflicts[0].severity).toBe('warning');
  });

  it('prüft mehrere Daten gleichzeitig', () => {
    const booking = {
      id: 'b1', resourceId: 'r1', date: '2025-03-05',
      startTime: '09:00', endTime: '11:00', status: 'approved', bookingType: 'training',
    };
    const result = checkBookingConflicts('r1', ['2025-03-05', '2025-03-06'], '08:00', '10:00', 'training', [booking], noSlots, resources);
    // Nur 2025-03-05 hat Konflikt, 2025-03-06 nicht
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2025-03-05');
  });
});
