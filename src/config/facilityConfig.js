// Facility & Resource Configuration
// Hierarchical multi-facility model:
//   Verein -> Facility[] -> ResourceGroup[] -> Resource[] -> SubResource[]

const UMLAUT_A = String.fromCharCode(228);
const UMLAUT_O = String.fromCharCode(246);
const UMLAUT_U = String.fromCharCode(252);
const UMLAUT_SS = String.fromCharCode(223);

// ---- Default Demo Data ----
export const DEFAULT_CLUB = {
  name: 'SG H' + UMLAUT_U + 'nstetten',
  primaryColor: '#2563eb',
};

export const DEFAULT_FACILITIES = [
  {
    id: 'facility-biogrund',
    name: 'Biogrund Sportpark',
    street: 'Am Sportpark',
    houseNumber: '1',
    zip: '65510',
    city: 'H' + UMLAUT_U + 'nstetten-G' + UMLAUT_O + 'rsroth',
    sortOrder: 1,
  },
  {
    id: 'facility-dgh',
    name: 'Dorfgemeinschaftshaus G' + UMLAUT_O + 'rsroth',
    street: 'Hauptstra' + UMLAUT_SS + 'e',
    houseNumber: '',
    zip: '65510',
    city: 'H' + UMLAUT_U + 'nstetten-G' + UMLAUT_O + 'rsroth',
    sortOrder: 2,
  },
];

export const DEFAULT_RESOURCE_GROUPS = [
  // --- Biogrund Sportpark ---
  {
    id: 'group-outdoor',
    facilityId: 'facility-biogrund',
    name: 'Au' + UMLAUT_SS + 'enanlagen',
    icon: 'outdoor',
    sortOrder: 1,
    sharedScheduling: false,
  },
  {
    id: 'group-indoor',
    facilityId: 'facility-biogrund',
    name: 'Innenr' + UMLAUT_A + 'ume',
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

export const DEFAULT_RESOURCES = [
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
    name: 'Fu' + UMLAUT_SS + 'ball-Kleinfeld',
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
    name: 'Gro' + UMLAUT_SS + 'e Mehrzweckhalle',
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
      legacy.push({
        id: res.id,
        name: res.name,
        type,
        category,
        color: res.color,
        isComposite: true,
        includes: res.subResources.map(sr => sr.id),
      });
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
