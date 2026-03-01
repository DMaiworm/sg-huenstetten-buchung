import React from 'react';
import { Building2, MapPin, Edit2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import type { Facility } from '../../../types';

interface FacilityCardProps {
  facility: Facility;
  onEdit: () => void;
}

const FacilityCard: React.FC<FacilityCardProps> = ({ facility, onEdit }) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50">
      <Building2 className="w-5 h-5 text-blue-600" />
    </div>
    <div className="flex-1">
      <h3 className="text-lg font-bold text-gray-900">{facility.name}</h3>
      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
        <MapPin className="w-3 h-3" />
        {facility.street} {facility.houseNumber}{facility.street ? ', ' : ''}{facility.zip} {facility.city}
      </p>
    </div>
    <Button variant="ghost" size="sm" onClick={onEdit}>
      <Edit2 className="w-4 h-4" />
    </Button>
  </div>
);

export default FacilityCard;
