import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, CalendarDays, ClipboardList, Settings, Building2, Users, Users2, FileText, FileDown, Shield, Mail, X, UserCircle, ClipboardCheck } from 'lucide-react';
import UserMenu from './UserMenu';

/**
 * Sidebar – Haupt-Navigation.
 *
 * Struktur:
 *   ÜBERSICHTEN       – alle eingeloggten User
 *   MEINE AUFGABEN    – kontextuell (kannBuchen, kannGenehmigen, istTrainer)
 *   TAGESBETRIEB      – kannAdministrieren (regelmäßige Verwaltung)
 *   SYSTEM-SETUP      – kannAdministrieren (seltenes Grundlagen-Setup)
 *
 * Mobile (< md): fixed, per Hamburger-Button in AppLayout öffenbar.
 * Desktop (md+): immer sichtbar.
 */
const Sidebar = ({ pendingCount, kannBuchen, kannGenehmigen, kannVerwalten, kannAdministrieren, istTrainer, open, onClose }) => {
  const navItem = (to, icon, label, badge) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      onClick={onClose}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-blue-600' : 'text-gray-400'}>{icon}</span>
          <span className="flex-1 text-left">{label}</span>
          {badge > 0 && (
            <span className="min-w-5 h-5 px-1 flex items-center justify-center bg-yellow-400 text-gray-800 text-xs font-bold rounded-full">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  const section = (label, first = false) => (
    <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 ${first ? '' : 'mt-5'}`}>
      {label}
    </p>
  );

  return (
    <>
      {/* Backdrop – nur Mobile, wenn Sidebar geöffnet */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col h-full
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:transition-none
        `}
      >
        {/* Logo + Mobile-Schließen-Button */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">SG</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">SG Hünstetten</p>
              <p className="text-xs text-gray-400">Buchungssystem</p>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Menü schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">

          {/* ── Übersichten ── */}
          {section('Übersichten', true)}
          {navItem('/', <Calendar className="w-5 h-5" />, 'Kalender')}
          {navItem('/teams', <Users2 className="w-5 h-5" />, 'Mannschaften')}
          {navItem('/trainer', <Users className="w-5 h-5" />, 'Trainer')}

          {/* ── Meine Aufgaben ── */}
          {section('Meine Aufgaben')}
          {kannBuchen && navItem('/buchen', <FileText className="w-5 h-5" />, 'Buchungsanfrage')}
          {navItem('/meine-buchungen', <ClipboardList className="w-5 h-5" />, 'Buchungsübersicht')}
          {kannGenehmigen && navItem('/genehmigungen', <Shield className="w-5 h-5" />, 'Genehmigungen', pendingCount)}
          {istTrainer && navItem('/trainer/profil', <UserCircle className="w-5 h-5" />, 'Mein Trainer-Profil')}

          {/* ── Tagesbetrieb ── */}
          {kannVerwalten && (
            <>
              {section('Tagesbetrieb')}
              {navItem('/admin/trainer', <ClipboardCheck className="w-5 h-5" />, 'Trainerverwaltung')}
              {navItem('/admin/emails', <Mail className="w-5 h-5" />, 'E-Mail-Log')}
              {navItem('/export', <FileDown className="w-5 h-5" />, 'PDF-Export')}
            </>
          )}

          {/* ── System-Setup ── */}
          {kannAdministrieren && (
            <>
              {section('System-Setup')}
              {navItem('/admin/benutzer', <Users className="w-5 h-5" />, 'Benutzerverwaltung')}
              {navItem('/admin/anlagen', <Building2 className="w-5 h-5" />, 'Anlagen & Ressourcen')}
              {navItem('/admin/organisation', <Settings className="w-5 h-5" />, 'Organisation')}
              {navItem('/admin/ferien-feiertage', <CalendarDays className="w-5 h-5" />, 'Ferien & Feiertage')}
            </>
          )}

        </nav>

        {/* User Menu */}
        <div className="p-3 border-t border-gray-100">
          <UserMenu />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
