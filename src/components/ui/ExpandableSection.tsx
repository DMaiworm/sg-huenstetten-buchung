import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ExpandableSectionProps {
  title: React.ReactNode;
  defaultOpen?: boolean;
  headerRight?: React.ReactNode;
  headerClassName?: string;
  children: React.ReactNode;
  onToggle?: (isExpanded: boolean) => void;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  defaultOpen = true,
  headerRight,
  headerClassName = '',
  children,
  onToggle,
}) => {
  const [expanded, setExpanded] = useState(defaultOpen);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    onToggle?.(next);
  };

  return (
    <div>
      <div className={`flex items-center gap-2 ${headerClassName}`}>
        <button
          onClick={toggle}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />
          }
        </button>
        <div className="flex-1 flex items-center gap-2">
          {typeof title === 'string' ? (
            <h4 className="font-semibold text-sm text-gray-800">{title}</h4>
          ) : title}
        </div>
        {headerRight}
      </div>
      {expanded && children}
    </div>
  );
};

export default ExpandableSection;
