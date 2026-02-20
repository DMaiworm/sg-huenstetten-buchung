import React, { useState, useCallback } from 'react';
import { Download, Check, AlertCircle, Loader2 } from 'lucide-react';
import Modal from '../../ui/Modal';
import { Button } from '../../ui/Button';

/**
 * Import-Modal für Ferien & Feiertage aus öffentlichen APIs.
 *
 * Quellen:
 *   - Feiertage:   date.nager.at   (kostenlos, kein API-Key)
 *   - Schulferien: ferien-api.de   (kostenlos, kein API-Key)
 */

const HESSEN_FEIERTAGE_NAMES = {
  'New Year\'s Day':              'Neujahr',
  'Good Friday':                  'Karfreitag',
  'Easter Monday':                'Ostermontag',
  'Labour Day':                   'Tag der Arbeit',
  'Ascension Day':                'Christi Himmelfahrt',
  'Whit Monday':                  'Pfingstmontag',
  'Corpus Christi':               'Fronleichnam',
  'German Unity Day':             'Tag der Deutschen Einheit',
  'Christmas Day':                'Erster Weihnachtstag',
  'St. Stephen\'s Day':           'Zweiter Weihnachtstag',
};

const FERIEN_NAMES = {
  'winterferien':    'Winterferien',
  'osterferien':     'Osterferien',
  'pfingstferien':   'Pfingstferien',
  'sommerferien':    'Sommerferien',
  'herbstferien':    'Herbstferien',
  'weihnachtsferien':'Weihnachtsferien',
};

async function fetchFeiertage(year) {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/DE`);
  if (!res.ok) throw new Error(`Feiertage-API: HTTP ${res.status}`);
  const data = await res.json();
  // Filter: nur Feiertage die in Hessen gelten (counties null = bundesweit, oder HE enthalten)
  return data
    .filter(h => !h.counties || h.counties.includes('DE-HE'))
    .map(h => ({
      name: HESSEN_FEIERTAGE_NAMES[h.name] || h.localName || h.name,
      type: 'feiertag',
      startDate: h.date,
      endDate: h.date,
      year,
    }));
}

async function fetchSchulferien(year) {
  const res = await fetch(`https://ferien-api.de/api/v1/holidays/HE/${year}`);
  if (!res.ok) throw new Error(`Ferien-API: HTTP ${res.status}`);
  const data = await res.json();
  return data.map(f => {
    // start/end come as ISO timestamps
    const startDate = f.start.split('T')[0];
    const endDate   = f.end.split('T')[0];
    // Adjust end date: API returns the day after the last vacation day
    const endAdj = new Date(endDate);
    endAdj.setDate(endAdj.getDate() - 1);
    const adjustedEnd = endAdj.toISOString().split('T')[0];
    const slug = f.slug || '';
    const ferienName = FERIEN_NAMES[slug] || f.name || slug;
    return {
      name: ferienName,
      type: 'schulferien',
      startDate,
      endDate: adjustedEnd,
      year,
    };
  });
}

const HolidayImportModal = ({ open, onClose, onImport, existingHolidays }) => {
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear]   = useState(currentYear);
  const [importFeiertage, setImportFeiertage]     = useState(true);
  const [importSchulferien, setImportSchulferien] = useState(true);
  const [loading, setLoading]     = useState(false);
  const [preview, setPreview]     = useState(null);
  const [error, setError]         = useState(null);
  const [imported, setImported]   = useState(false);

  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  // Check what already exists for selected year
  const existingForYear = existingHolidays.filter(h => h.year === selectedYear);
  const hasFeiertage    = existingForYear.some(h => h.type === 'feiertag');
  const hasFerien       = existingForYear.some(h => h.type === 'schulferien');

  const handlePreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPreview(null);
    setImported(false);
    try {
      const results = [];
      if (importFeiertage) {
        const ft = await fetchFeiertage(selectedYear);
        results.push(...ft);
      }
      if (importSchulferien) {
        const sf = await fetchSchulferien(selectedYear);
        results.push(...sf);
      }
      // Filter out duplicates (same name + same start_date already exists)
      const filtered = results.filter(r =>
        !existingHolidays.some(e =>
          e.name === r.name && e.startDate === r.startDate && e.year === r.year
        )
      );
      setPreview({ all: results, filtered, duplicates: results.length - filtered.length });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [selectedYear, importFeiertage, importSchulferien, existingHolidays]);

  const handleImport = async () => {
    if (!preview || preview.filtered.length === 0) return;
    setLoading(true);
    try {
      await onImport(preview.filtered);
      setImported(true);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setPreview(null);
    setError(null);
    setImported(false);
    onClose();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  };

  return (
    <Modal open={open} onClose={handleClose} title="Ferien & Feiertage importieren" maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            {imported ? 'Schließen' : 'Abbrechen'}
          </Button>
          {!imported && !preview && (
            <Button variant="primary" onClick={handlePreview}
              disabled={loading || (!importFeiertage && !importSchulferien)}>
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
              Vorschau laden
            </Button>
          )}
          {preview && preview.filtered.length > 0 && !imported && (
            <Button variant="primary" onClick={handleImport} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              {preview.filtered.length} Einträge importieren
            </Button>
          )}
        </>
      }
    >
      {imported ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-lg font-medium text-gray-900">Import erfolgreich!</p>
          <p className="text-sm text-gray-500 mt-1">Die Ferien und Feiertage wurden gespeichert.</p>
        </div>
      ) : (
        <>
          {/* Year Selection */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Jahr auswählen</label>
            <div className="flex gap-2">
              {years.map(y => (
                <button key={y} onClick={() => { setSelectedYear(y); setPreview(null); setError(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedYear === y
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Existing Data Warning */}
          {(hasFeiertage || hasFerien) && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <strong>Hinweis:</strong> Für {selectedYear} existieren bereits{' '}
              {hasFeiertage && 'Feiertage'}
              {hasFeiertage && hasFerien && ' und '}
              {hasFerien && 'Schulferien'}
              . Duplikate werden beim Import automatisch übersprungen.
            </div>
          )}

          {/* What to import */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Was importieren?</label>
            <div className="flex gap-3">
              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                importFeiertage ? 'bg-red-50 border-red-300' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input type="checkbox" checked={importFeiertage} onChange={(e) => { setImportFeiertage(e.target.checked); setPreview(null); }}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                <span className="text-sm font-medium text-gray-700">Gesetzliche Feiertage</span>
              </label>
              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                importSchulferien ? 'bg-amber-50 border-amber-300' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input type="checkbox" checked={importSchulferien} onChange={(e) => { setImportSchulferien(e.target.checked); setPreview(null); }}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                <span className="text-sm font-medium text-gray-700">Schulferien Hessen</span>
              </label>
            </div>
          </div>

          {/* Data Sources */}
          <div className="mb-5 text-xs text-gray-400">
            Datenquellen: date.nager.at (Feiertage) · ferien-api.de (Schulferien)
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Fehler beim Laden:</strong> {error}
                <p className="mt-1 text-xs">Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.</p>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div>
              {preview.duplicates > 0 && (
                <p className="text-sm text-amber-600 mb-3">
                  {preview.duplicates} bereits vorhandene Einträge werden übersprungen.
                </p>
              )}
              {preview.filtered.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Alle Einträge sind bereits vorhanden.</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Datum</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Bezeichnung</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Typ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preview.filtered.map((h, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5 text-gray-600 font-mono text-xs whitespace-nowrap">
                            {h.startDate === h.endDate
                              ? formatDate(h.startDate)
                              : `${formatDate(h.startDate)} – ${formatDate(h.endDate)}`}
                          </td>
                          <td className="px-3 py-1.5 text-gray-900">{h.name}</td>
                          <td className="px-3 py-1.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              h.type === 'feiertag' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {h.type === 'feiertag' ? 'Feiertag' : 'Ferien'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default HolidayImportModal;
