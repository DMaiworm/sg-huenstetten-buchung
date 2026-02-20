import React, { useState, useMemo } from 'react';
import { CalendarDays, Plus, Download, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useConfirm } from '../../../hooks/useConfirm';
import { Button } from '../../ui/Button';
import PageHeader from '../../ui/PageHeader';
import EmptyState from '../../ui/EmptyState';
import HolidayRow from './HolidayRow';
import HolidayFormModal from './HolidayFormModal';
import HolidayImportModal from './HolidayImportModal';

const TYPE_LABELS = { feiertag: 'Feiertage', schulferien: 'Schulferien' };
const TYPE_COLORS = {
  feiertag:     'bg-red-50 text-red-700 border-red-200',
  schulferien:  'bg-amber-50 text-amber-700 border-amber-200',
};

const HolidayManagement = ({
  holidays, createHoliday, createHolidaysBulk, updateHoliday,
  deleteHoliday, deleteHolidaysByYear,
}) => {
  const [showImport, setShowImport]     = useState(false);
  const [showAddForm, setShowAddForm]   = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [collapsedYears, setCollapsedYears] = useState({});
  const [confirm, confirmDialog]        = useConfirm();

  // Group holidays by year
  const years = useMemo(() => {
    const grouped = {};
    holidays.forEach(h => {
      if (!grouped[h.year]) grouped[h.year] = [];
      grouped[h.year].push(h);
    });
    return Object.keys(grouped)
      .sort((a, b) => Number(b) - Number(a))
      .map(year => ({ year: Number(year), items: grouped[year] }));
  }, [holidays]);

  const currentYear = new Date().getFullYear();

  const subtitle = [
    `${holidays.filter(h => h.type === 'feiertag').length} Feiertag${holidays.filter(h => h.type === 'feiertag').length !== 1 ? 'e' : ''}`,
    `${holidays.filter(h => h.type === 'schulferien').length} Ferienperiode${holidays.filter(h => h.type === 'schulferien').length !== 1 ? 'n' : ''}`,
  ].join(' · ');

  const toggleYear = (year) => setCollapsedYears(p => ({ ...p, [year]: !p[year] }));

  const handleDeleteHoliday = async (id) => {
    if (!await confirm({
      title: 'Eintrag löschen?',
      message: 'Dieser Ferien-/Feiertagseintrag wird unwiderruflich gelöscht.',
      confirmLabel: 'Löschen', variant: 'danger',
    })) return;
    if (deleteHoliday) await deleteHoliday(id);
  };

  const handleDeleteYear = async (year, type) => {
    const label = type ? TYPE_LABELS[type] : 'Ferien & Feiertage';
    if (!await confirm({
      title: `${label} ${year} löschen?`,
      message: `Alle ${label}-Einträge für ${year} werden unwiderruflich gelöscht.`,
      confirmLabel: 'Alle löschen', variant: 'danger',
    })) return;
    if (deleteHolidaysByYear) await deleteHolidaysByYear(year, type);
  };

  const handleSaveHoliday = async (data) => {
    if (editingHoliday) {
      if (updateHoliday) await updateHoliday({ ...data, id: editingHoliday.id });
    } else {
      if (createHoliday) await createHoliday(data);
    }
    setEditingHoliday(null);
    setShowAddForm(false);
  };

  const handleImportDone = async (importedHolidays) => {
    if (createHolidaysBulk && importedHolidays.length > 0) {
      await createHolidaysBulk(importedHolidays);
    }
    setShowImport(false);
  };

  return (
    <div>
      <PageHeader
        icon={CalendarDays} title="Ferien & Feiertage" subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Download className="w-4 h-4 mr-1" /> Importieren
            </Button>
            <Button variant="primary" size="sm" onClick={() => { setEditingHoliday(null); setShowAddForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Neuer Eintrag
            </Button>
          </div>
        }
      />

      {/* Hint for missing years */}
      {(!years.some(y => y.year === currentYear) || !years.some(y => y.year === currentYear + 1)) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <strong>Tipp:</strong> Nutzen Sie die Import-Funktion, um Feiertage und Schulferien für{' '}
          {!years.some(y => y.year === currentYear) && currentYear}
          {!years.some(y => y.year === currentYear) && !years.some(y => y.year === currentYear + 1) && ' und '}
          {!years.some(y => y.year === currentYear + 1) && (currentYear + 1)}
          {' '}automatisch zu laden.
        </div>
      )}

      {years.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Keine Ferien & Feiertage vorhanden"
          subtitle="Importieren Sie Feiertage und Schulferien oder erstellen Sie Einträge manuell."
          action="Jetzt importieren"
          onAction={() => setShowImport(true)}
        />
      ) : (
        years.map(({ year, items }) => {
          const isCollapsed = collapsedYears[year];
          const feiertage   = items.filter(h => h.type === 'feiertag');
          const ferien      = items.filter(h => h.type === 'schulferien');
          return (
            <div key={year} className="mb-6 border border-gray-200 rounded-xl overflow-hidden bg-white">
              {/* Year Header */}
              <div
                className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer select-none"
                onClick={() => toggleYear(year)}
              >
                <div className="flex items-center gap-3">
                  {isCollapsed
                    ? <ChevronRight className="w-5 h-5 text-gray-400" />
                    : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  <h3 className="text-lg font-bold text-gray-900">{year}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_COLORS.feiertag}`}>
                    {feiertage.length} Feiertag{feiertage.length !== 1 ? 'e' : ''}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_COLORS.schulferien}`}>
                    {ferien.length} Ferienperiode{ferien.length !== 1 ? 'n' : ''}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteYear(year); }}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>

              {!isCollapsed && (
                <div className="divide-y divide-gray-100">
                  {/* Feiertage */}
                  {feiertage.length > 0 && (
                    <div className="p-4">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gesetzliche Feiertage</h4>
                      <div className="space-y-1">
                        {feiertage.map(h => (
                          <HolidayRow key={h.id} holiday={h}
                            onEdit={() => { setEditingHoliday(h); setShowAddForm(true); }}
                            onDelete={() => handleDeleteHoliday(h.id)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schulferien */}
                  {ferien.length > 0 && (
                    <div className="p-4">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Schulferien Hessen</h4>
                      <div className="space-y-1">
                        {ferien.map(h => (
                          <HolidayRow key={h.id} holiday={h}
                            onEdit={() => { setEditingHoliday(h); setShowAddForm(true); }}
                            onDelete={() => handleDeleteHoliday(h.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Modals */}
      <HolidayFormModal
        open={showAddForm}
        onClose={() => { setShowAddForm(false); setEditingHoliday(null); }}
        onSave={handleSaveHoliday}
        holiday={editingHoliday}
      />

      <HolidayImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImportDone}
        existingHolidays={holidays}
      />

      {confirmDialog}
    </div>
  );
};

export default HolidayManagement;
