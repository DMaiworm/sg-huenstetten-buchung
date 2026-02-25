import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { EVENT_TYPES } from '../config/organizationConfig';

const PDFExportPage = ({ bookings, users, resources, resourceGroups, clubs, departments, teams, trainerAssignments }) => {
  const navigate = useNavigate();
  const RESOURCES = resources;

  // Lookup org info for a booking (team → department → club)
  const getBookingOrgInfo = (booking) => {
    if (!teams || !departments || !clubs) return null;
    if (booking.teamId) {
      const team = teams.find(t => t.id === booking.teamId);
      if (team) {
        const dept = departments.find(d => d.id === team.departmentId);
        const club = dept ? clubs.find(c => c.id === dept.clubId) : null;
        return { team, dept, club };
      }
    }
    if (!trainerAssignments) return null;
    const assignment = trainerAssignments.find(ta => ta.userId === booking.userId);
    if (!assignment) return null;
    const team = teams.find(t => t.id === assignment.teamId);
    if (!team) return null;
    const dept = departments.find(d => d.id === team.departmentId);
    const club = dept ? clubs.find(c => c.id === dept.clubId) : null;
    return { team, dept, club };
  };
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);

  // Build categories dynamically from actual resource groups
  const categories = (resourceGroups || [])
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(g => ({
      id: g.id,
      label: g.name,
      resources: RESOURCES.filter(r => r.groupId === g.id && !r.isComposite),
    }))
    .filter(c => c.resources.length > 0);

  const [selectedCategory, setSelectedCategory] = useState('');
  // Fall back to first category if current selection is invalid
  const effectiveCategory = categories.find(c => c.id === selectedCategory)
    ? selectedCategory
    : categories[0]?.id || '';

  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const years = [2025, 2026, 2027];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script);
        await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; });
      }
      const { jsPDF } = window.jspdf;
      const category = categories.find(c => c.id === effectiveCategory);
      const catResources = category.resources;
      const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
      const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 10;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SG Hünstetten - ' + category.label, margin, 15);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(months[selectedMonth] + ' ' + selectedYear, margin, 22);

      const gridTop = 30;
      const dayWidth = (pageWidth - 2 * margin) / 7;
      const numWeeks = Math.ceil((firstDay + daysInMonth) / 7);
      const weekHeight = (pageHeight - gridTop - margin) / numWeeks;
      const resourceColWidth = catResources.length > 0 ? dayWidth / catResources.length : dayWidth;

      const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      weekDays.forEach((day, i) => {
        const x = margin + i * dayWidth;
        doc.setFillColor(240, 240, 240);
        doc.rect(x, gridTop, dayWidth, 8, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, gridTop, dayWidth, 8, 'S');
        doc.text(day, x + dayWidth / 2, gridTop + 5.5, { align: 'center' });
      });

      doc.setFontSize(5);
      let currentDay = 1;
      for (let week = 0; week < numWeeks; week++) {
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
          const cellX = margin + dayOfWeek * dayWidth;
          const cellY = gridTop + 8 + week * weekHeight;
          const cellIndex = week * 7 + dayOfWeek;
          if (cellIndex >= firstDay && currentDay <= daysInMonth) {
            doc.setFillColor(255, 255, 255);
            doc.rect(cellX, cellY, dayWidth, weekHeight, 'F');
            doc.setDrawColor(200, 200, 200);
            doc.rect(cellX, cellY, dayWidth, weekHeight, 'S');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(String(currentDay), cellX + 2, cellY + 4);
            catResources.forEach((res, i) => {
              if (i > 0) { doc.setDrawColor(230, 230, 230); doc.line(cellX + i * resourceColWidth, cellY + 5, cellX + i * resourceColWidth, cellY + weekHeight); }
              doc.setFontSize(4);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(128, 128, 128);
              const shortName = res.name.replace('Sportplatz - ', '').replace('Fussball-', '').substring(0, 6);
              doc.text(shortName, cellX + i * resourceColWidth + 1, cellY + 8);
            });
            const dateStr = selectedYear + '-' + String(selectedMonth + 1).padStart(2, '0') + '-' + String(currentDay).padStart(2, '0');
            catResources.forEach((res, resIndex) => {
              const dayBookings = bookings
                .filter(b => b.date === dateStr && b.resourceId === res.id && b.status === 'approved' && !b.parentBooking)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              let yOffset = 10;
              const blockHeight = 10;
              const colX = cellX + resIndex * resourceColWidth;
              dayBookings.forEach(booking => {
                if (yOffset + blockHeight <= weekHeight - 1) {
                  const org = getBookingOrgInfo(booking);
                  const clubLabel = org?.club?.shortName || '';
                  // Prefer full team name, fall back to shortName if too wide
                  const teamFull = org?.team?.name || '';
                  const teamShort = org?.team?.shortName || teamFull;
                  doc.setFontSize(4);
                  doc.setFont('helvetica', 'bold');
                  const maxTextWidth = resourceColWidth - 2;
                  const teamLabel = doc.getTextWidth(teamFull) <= maxTextWidth ? teamFull : teamShort;
                  const typeLabel = EVENT_TYPES.find(t => t.id === booking.bookingType)?.label || '';
                  const timeLabel = booking.startTime.substring(0, 5) + '–' + booking.endTime.substring(0, 5);

                  const rgb = hexToRgb(org?.team?.color || res.color);
                  doc.setFillColor(rgb.r, rgb.g, rgb.b);
                  doc.roundedRect(colX + 0.5, cellY + yOffset, resourceColWidth - 1, blockHeight, 0.5, 0.5, 'F');
                  doc.setTextColor(255, 255, 255);

                  // Line 1: Club (normal)
                  doc.setFontSize(3.5);
                  doc.setFont('helvetica', 'normal');
                  doc.text(clubLabel, colX + 1, cellY + yOffset + 2.5);

                  // Line 2: Team (bold)
                  doc.setFontSize(4);
                  doc.setFont('helvetica', 'bold');
                  doc.text(teamLabel, colX + 1, cellY + yOffset + 5);

                  // Line 3: Event type (normal)
                  doc.setFontSize(3.5);
                  doc.setFont('helvetica', 'normal');
                  doc.text(typeLabel, colX + 1, cellY + yOffset + 7);

                  // Line 4: Start–End time (bold)
                  doc.setFontSize(3.5);
                  doc.setFont('helvetica', 'bold');
                  doc.text(timeLabel, colX + 1, cellY + yOffset + 9.5);

                  yOffset += blockHeight + 1;
                }
              });
            });
            currentDay++;
          } else {
            doc.setFillColor(245, 245, 245);
            doc.rect(cellX, cellY, dayWidth, weekHeight, 'F');
            doc.setDrawColor(200, 200, 200);
            doc.rect(cellX, cellY, dayWidth, weekHeight, 'S');
          }
        }
      }
      const legendY = pageHeight - 8;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Legende:', margin, legendY);
      let legendX = margin + 15;
      catResources.forEach(res => {
        const rgb = hexToRgb(res.color);
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.rect(legendX, legendY - 3, 4, 4, 'F');
        doc.setFont('helvetica', 'normal');
        doc.text(res.name, legendX + 6, legendY);
        legendX += doc.getTextWidth(res.name) + 12;
      });
      doc.save('SG-Huenstetten-' + category.label + '-' + months[selectedMonth] + '-' + selectedYear + '.pdf');
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF-Erstellung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
    setIsGenerating(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileDown className="w-6 h-6 text-blue-600" />
          Monatsplan als PDF exportieren
        </h2>
      </div>

      <div className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie</label>
          <select value={effectiveCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.label} ({cat.resources.length} Anlagen)</option>))}
          </select>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Enthaltene Anlagen:</p>
          <div className="flex flex-wrap gap-2">
            {categories.find(c => c.id === effectiveCategory)?.resources.map(res => (
              <span key={res.id} className="px-2 py-1 text-xs text-white rounded" style={{ backgroundColor: res.color }}>{res.name}</span>
            ))}
            {categories.find(c => c.id === effectiveCategory)?.resources.length === 0 && (
              <span className="text-sm text-gray-400">Keine Anlagen in dieser Kategorie</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monat</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              {months.map((month, i) => (<option key={i} value={i}>{month}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jahr</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              {years.map(year => (<option key={year} value={year}>{year}</option>))}
            </select>
          </div>
        </div>
        <div className="pt-4">
          <Button variant="primary" onClick={generatePDF} disabled={isGenerating}>
            <FileDown className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generiere PDF...' : 'PDF erstellen und herunterladen'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PDFExportPage;
