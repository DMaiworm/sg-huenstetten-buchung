import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, ClipboardList, Settings, Building2, Users, FileText, Shield } from 'lucide-react';
import UserMenu from './UserMenu';

const Sidebar = ({ pendingCount, kannBuchen, kannGenehmigen, kannAdministrieren }) => {
  const navItem = (to, icon, label, badge) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
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

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">SG</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">SG Hünstetten</p>
            <p className="text-xs text-gray-400">Buchungssystem</p>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Allgemein</p>
        {navItem('/', <Calendar className="w-5 h-5" />, 'Kalender')}
        {navItem('/meine-buchungen', <ClipboardList className="w-5 h-5" />, 'Meine Buchungen')}
        {kannBuchen && navItem('/buchen', <FileText className="w-5 h-5" />, 'Neue Anfrage')}

        {kannGenehmigen && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mt-4 mb-2">Genehmigungen</p>
            {navItem('/genehmigungen', <Shield className="w-5 h-5" />, 'Genehmigungen', pendingCount)}
          </>
        )}

        {kannAdministrieren && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mt-4 mb-2">Administration</p>
            {navItem('/admin/benutzer', <Users className="w-5 h-5" />, 'Benutzerverwaltung')}
            {navItem('/admin/anlagen', <Building2 className="w-5 h-5" />, 'Anlagenverwaltung')}
            {navItem('/admin/organisation', <Settings className="w-5 h-5" />, 'Organisation')}
          </>
        )}
      </nav>

      {/* User Menu */}
      <div className="p-3 border-t border-gray-100">
        <UserMenu />
      </div>
    </div>
  );
};

export default Sidebar;
