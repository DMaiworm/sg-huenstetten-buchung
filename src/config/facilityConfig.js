// Facility & Resource Configuration
// This replaces the hardcoded RESOURCES array with a hierarchical, multi-tenant model

// ---- Helper: generate slug from name ----
const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ---- Default Demo Data ----
export const DEFAULT_FACILITY = {
  id: 'facility-1',
  name: 'Biogrund Sportpark',
  street: 'Am Sportpark',
  houseNumber: '1',
  zip: '65510',
  city: 'H' + String.fromCharCode(252) + 'nstetten-G' + String.fromCharCode(246) + 'rsroth',
  club: 'SG H' + String.fromCharCode(252) + 'nstetten',
  logo: null,
  primaryColor: '#2563eb',
};

export const DEFAULT_RESOURCE_GROUPS = [
  {
    id: 'group-outdoor',
    facilityId: 'facility-1',
    name: 'Au' + String.fromCharCode(223) + 'enanlagen',
    icon: 'outdoor',
    sortOrder: 1,
    sharedScheduling: false,
  },
  {
    id: 'group-indoor',
    facilityId: 'facility-1',
    name: 'Innenr' + String.fromCharCode(228) + 'ume',
    icon: 'indoor',
    sortOrder: 2,
    sharedScheduling: false,
  },
  {
    id: 'group-shared',
    facilityId: 'facility-1',
    name: 'Geteilte Hallen',
    icon: 'shared',
    sortOrder: 3,
    sharedScheduling: true,
  },
];

export const DEFAULT_RESOURCES = [
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
    name: 'Fu' + String.fromCharCode(223) + 'ball-Kleinfeld',
    color: '#84cc16',
    splittable: false,
    bookingMode: 'free',
    subResources: [],
  },
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
  {
    id: 'halle-gross',
    groupId: 'group-shared',
    name: 'Gro' + String.fromCharCode(223) + 'e Mehrzweckhalle',
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

// ---- Converter: new model -> legacy RESOURCES format ----
// This allows existing components to work without changes
export function buildLegacyResources(resourceGroups, resources) {
  const legacy = [];
  const groupCategoryMap = {};
  resourceGroups.forEach(g => {
    groupCategoryMap[g.id] = g.icon; // 'outdoor', 'indoor', 'shared'
  });

  resources.forEach(res => {
    const category = groupCategoryMap[res.groupId] || 'outdoor';
    const type = res.bookingMode === 'slotOnly' ? 'limited' : 'regular';

    if (res.splittable && res.subResources && res.subResources.length > 0) {
      // Composite (whole)
      legacy.push({
        id: res.id,
        name: res.name,
        type,
        category,
        color: res.color,
        isComposite: true,
        includes: res.subResources.map(sr => sr.id),
      });
      // Sub-resources
      res.subResources.forEach(sr => {
        legacy.push({
          id: sr.id,
          name: sr.name,
          type,
          category,
          color: sr.color,
          partOf: res.id,
        });
      });
    } else {
      legacy.push({
        id: res.id,
        name: res.name,
        type,
        category,
        color: res.color,
      });
    }
  });

  return legacy;
}

// ---- ID Generator ----
export function generateId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
}
