import React from 'react';
import { Calendar, Users, Check, Plus, Settings, Home, List, UserPlus, Mail, FileDown } from 'lucide-react';

const Sidebar = ({ currentView, setCurrentView, isAdmin, onExportPDF, emailService }) => {
  const navItems = [
    { id: 'calendar', label: 'Kalender', icon: Calendar },
    { id: 'bookings', label: 'Meine Buchungen', icon: List },
    { id: 'request', label: 'Neue Anfrage', icon: Plus },
  ];

  const adminItems = [
    { id: 'approvals', label: 'Genehmigungen', icon: Check },
    { id: 'slots', label: 'Slot-Verwaltung', icon: Settings },
    { id: 'users', label: 'Benutzerverwaltung', icon: UserPlus },
    { id: 'emails', label: 'E-Mail-Log', icon: Mail, badge: emailService?.getSentEmails().length || 0 },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Home className="w-6 h-6 text-blue-600" />
          SG Hünstetten
        </h1>
        <p className="text-sm text-gray-500 mt-1">Ressourcen-Buchung</p>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${currentView === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <item.icon className="w-5 h-5" />{item.label}
            </button>
          ))}
        </div>

        <div className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-400 uppercase">Export</div>
        <button onClick={onExportPDF} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-600 hover:bg-green-50 hover:text-green-700">
          <FileDown className="w-5 h-5" />Monatsplan PDF
        </button>

        {isAdmin && (
          <>
            <div className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-400 uppercase">Administration</div>
            <div className="space-y-1">
              {adminItems.map(item => (
                <button key={item.id} onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors ${currentView === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3"><item.icon className="w-5 h-5" />{item.label}</div>
                  {item.badge > 0 && (<span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">{item.badge}</span>)}
                </button>
              ))}
            </div>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-sm font-medium text-gray-800">Demo User</p><p className="text-xs text-gray-500">{isAdmin ? 'Administrator' : 'Trainer'}</p></div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
