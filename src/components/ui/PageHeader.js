import React from 'react';

/**
 * Einheitlicher Seiten-Header für Admin-Seiten.
 *
 * Props:
 *   icon       - Lucide-Icon Komponente
 *   title      - Seitentitel
 *   subtitle   - optionale Untertitel-Zeile (String oder JSX)
 *   actions    - optionale Action-Buttons (JSX)
 */
const PageHeader = ({ icon: Icon, title, subtitle, actions }) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        {Icon && <Icon className="w-6 h-6 text-blue-600" />}
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
