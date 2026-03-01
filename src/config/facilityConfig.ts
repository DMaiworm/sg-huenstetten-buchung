/**
 * Facility & Resource Configuration
 *
 * Hierarchical multi-facility model:
 *   Operator → Facility[] → ResourceGroup[] → Resource[] → SubResource[]
 *
 * buildBookableResources() flattens this hierarchy into a flat array
 * of individually bookable resources for calendar/booking components.
 */

import type {
  BookableResource,
  ResourceGroup,
  Resource,
  ResourceGroupIcon,
  ResourceType,
} from '../types';

// ---- Default Demo Data Types ----
interface DefaultFacility {
  id: string;
  name: string;
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  sortOrder: number;
}

interface DefaultResourceGroup {
  id: string;
  facilityId: string;
  name: string;
  icon: ResourceGroupIcon;
  sortOrder: number;
  sharedScheduling: boolean;
}

interface DefaultResource {
  id: string;
  groupId: string;
  name: string;
  color: string;
  splittable: boolean;
  bookingMode: string;
  subResources: Array<{ id: string; name: string; color: string }>;
}

// ---- Default Demo Data ----
export const DEFAULT_CLUB = {
  name: 'SG Hünstetten',
  primaryColor: '#2563eb',
};

export const DEFAULT_FACILITIES: DefaultFacility[] = [
  {
    id: 'facility-biogrund',
    name: 'Biogrund Sportpark',
    street: 'Am Sportpark',
    houseNumber: '1',
    zip: '65510',
    city: 'Hünstetten-Görsroth',
    sortOrder: 1,
  },
  {
    id: 'facility-dgh',
    name: 'Dorfgemeinschaftshaus Görsroth',
    street: 'Hauptstraße',
    houseNumber: '',
    zip: '65510',
    city: 'Hünstetten-Görsroth',
    sortOrder: 2,
  },
];

export const DEFAULT_RESOURCE_GROUPS: DefaultResourceGroup[] = [
  // --- Biogrund Sportpark ---
  {
    id: 'group-outdoor',
    facilityId: 'facility-biogrund',
    name: 'Außenanlagen',
    icon: 'outdoor',
    sortOrder: 1,
    sharedScheduling: false,
  },
  {
    id: 'group-indoor',
    facilityId: 'facility-biogrund',
    name: 'Innenräume',
    icon: 'indoor',
    sortOrder: 2,
    sharedScheduling: false,
  },
  // --- DGH Görsroth ---
  {
    id: 'group-shared',
    facilityId: 'facility-dgh',
    name: 'Mehrzweckhallen',
    icon: 'shared',
    sortOrder: 1,
    sharedScheduling: true,
  },
];

export const DEFAULT_RESOURCES: DefaultResource[] = [
  // --- Biogrund: Außenanlagen ---
  {
    id: 'sportplatz-ganz',
    groupId: 'group-outdoor',
    name: 'Sportplatz - komplett',
    color: '#15803d',
    splittable: true,
    bookingMode: 'free',
    subResources: [
      { id: 'sportplatz-links', name: 'Sportplatz - links', color: '#22c55e' },
      { id: 'sportplatz-rechts', name: 'Sportplatz - rechts', color: '#16a34a' },
    ],
  },
  {
    id: 'kleinfeld',
    groupId: 'group-outdoor',
    name: 'Fußball-Kleinfeld',
    color: '#84cc16',
    splittable: false,
    bookingMode: 'free',
    subResources: [],
  },
  // --- Biogrund: Innenräume ---
  {
    id: 'gymnastik',
    groupId: 'group-indoor',
    name: 'Gymnastikraum',
    color: '#8b5cf6',
    splittable: false,
    bookingMode: 'free',
    subResources: [],
  },
  {
    id: 'fitness',
    groupId: 'group-indoor',
    name: 'Fitnessraum',
    color: '#a855f7',
    splittable: false,
    bookingMode: 'free',
    subResources: [],
  },
  {
    id: 'gastronomie',
    groupId: 'group-indoor',
    name: 'Vereinsgastronomie',
    color: '#f59e0b',
    splittable: false,
    bookingMode: 'free',
    subResources: [],
  },
  // --- DGH: Mehrzweckhallen ---
  {
    id: 'halle-gross',
    groupId: 'group-shared',
    name: 'Große Mehrzweckhalle',
    color: '#ef4444',
    splittable: false,
    bookingMode: 'slotOnly',
    subResources: [],
  },
  {
    id: 'halle-klein',
    groupId: 'group-shared',
    name: 'Kleine Mehrzweckhalle',
    color: '#f97316',
    splittable: false,
    bookingMode: 'slotOnly',
    subResources: [],
  },
];

/**
 * Flatten the hierarchical resource model into a bookable-resource array.
 */
export function buildBookableResources(resourceGroups: ResourceGroup[], resources: Resource[]): BookableResource[] {
  const result: BookableResource[] = [];
  const groupMap: Record<string, ResourceGroup> = {};
  resourceGroups.forEach(g => {
    groupMap[g.id] = g;
  });

  resources.forEach(res => {
    const group = groupMap[res.groupId];
    const category: ResourceGroupIcon = group?.icon || 'outdoor';
    const type: ResourceType = res.bookingMode === 'slotOnly' ? 'limited' : 'regular';

    if (res.splittable && res.subResources && res.subResources.length > 0) {
      // Composite parent (e.g. "Sportplatz komplett")
      result.push({
        id: res.id,
        name: res.name,
        type,
        category,
        groupId: res.groupId,
        color: res.color,
        isComposite: true,
        includes: res.subResources.map(sr => sr.id),
      });
      // Sub-resources (e.g. "Sportplatz links / rechts")
      res.subResources.forEach(sr => {
        result.push({
          id: sr.id,
          name: sr.name,
          type,
          category,
          groupId: res.groupId,
          color: sr.color,
          partOf: res.id,
        });
      });
    } else {
      result.push({
        id: res.id,
        name: res.name,
        type,
        category,
        groupId: res.groupId,
        color: res.color,
      });
    }
  });

  return result;
}

/** Generate a unique ID with a human-readable prefix. */
export function generateId(prefix: string): string {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
}
