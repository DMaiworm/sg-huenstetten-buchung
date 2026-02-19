import React, { createContext, useContext, useMemo } from 'react';
import { useFacilities as useFacilitiesHook } from '../hooks/useSupabase';
import { DEFAULT_FACILITIES, DEFAULT_RESOURCE_GROUPS, DEFAULT_RESOURCES, buildLegacyResources } from '../config/facilityConfig';

const DEMO_SLOTS = [
  { id: 1, resourceId: 'halle-gross', dayOfWeek: 1, startTime: '17:00', endTime: '21:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 2, resourceId: 'halle-gross', dayOfWeek: 3, startTime: '18:00', endTime: '22:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 3, resourceId: 'halle-gross', dayOfWeek: 6, startTime: '09:00', endTime: '14:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 4, resourceId: 'halle-klein', dayOfWeek: 2, startTime: '16:00', endTime: '20:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 5, resourceId: 'halle-klein', dayOfWeek: 4, startTime: '17:00', endTime: '21:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
];

const FacilityContext = createContext(null);

export function FacilityProvider({ children }) {
  const {
    facilities: dbFacilities, setFacilities: setDbFacilities,
    resourceGroups: dbResourceGroups, setResourceGroups: setDbResourceGroups,
    resources: dbResources, setResources: setDbResources,
    slots: dbSlots, setSlots: setDbSlots,
    loading, isDemo,
  } = useFacilitiesHook();

  // Demo-Fallback
  const facilities      = isDemo ? DEFAULT_FACILITIES      : dbFacilities;
  const resourceGroups  = isDemo ? DEFAULT_RESOURCE_GROUPS  : dbResourceGroups;
  const configResources = isDemo ? DEFAULT_RESOURCES        : dbResources;
  const slots           = isDemo ? DEMO_SLOTS               : dbSlots;

  const setFacilities      = isDemo ? () => {} : setDbFacilities;
  const setResourceGroups  = isDemo ? () => {} : setDbResourceGroups;
  const setConfigResources = isDemo ? () => {} : setDbResources;
  const setSlots           = isDemo ? () => {} : setDbSlots;

  // Flaches Legacy-Resource-Array für Kalender/Buchung
  const RESOURCES = useMemo(
    () => buildLegacyResources(resourceGroups, configResources),
    [resourceGroups, configResources]
  );

  const value = {
    // Roh-Daten
    facilities, resourceGroups, configResources, slots,
    // Setter
    setFacilities, setResourceGroups, setConfigResources, setSlots,
    // Abgeleitete Daten
    RESOURCES,
    // Meta
    loading, isDemo,
  };

  return <FacilityContext.Provider value={value}>{children}</FacilityContext.Provider>;
}

export function useFacility() {
  const ctx = useContext(FacilityContext);
  if (!ctx) throw new Error('useFacility muss innerhalb von <FacilityProvider> verwendet werden');
  return ctx;
}
