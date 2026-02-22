import React, { createContext, useContext, useMemo } from 'react';
import { useFacilities as useFacilitiesHook } from '../hooks/useSupabase';
import { DEFAULT_FACILITIES, DEFAULT_RESOURCE_GROUPS, DEFAULT_RESOURCES, buildBookableResources } from '../config/facilityConfig';

const DEMO_SLOTS = [
  { id: 1, resourceId: 'halle-gross', dayOfWeek: 1, startTime: '17:00', endTime: '21:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 2, resourceId: 'halle-gross', dayOfWeek: 3, startTime: '18:00', endTime: '22:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 3, resourceId: 'halle-gross', dayOfWeek: 6, startTime: '09:00', endTime: '14:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 4, resourceId: 'halle-klein', dayOfWeek: 2, startTime: '16:00', endTime: '20:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: 5, resourceId: 'halle-klein', dayOfWeek: 4, startTime: '17:00', endTime: '21:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
];

const FacilityContext = createContext(null);

export function FacilityProvider({ children }) {
  const hook = useFacilitiesHook();
  const {
    facilities: dbFacilities, setFacilities: setDbFacilities,
    resourceGroups: dbResourceGroups, setResourceGroups: setDbResourceGroups,
    resources: dbResources, setResources: setDbResources,
    slots: dbSlots, setSlots: setDbSlots,
    createFacility, updateFacility, deleteFacility,
    createResourceGroup, updateResourceGroup, deleteResourceGroup,
    createResource, updateResource, deleteResource,
    createSlot, updateSlot, deleteSlot,
    loading, isDemo,
  } = hook;

  // Demo-Fallback
  const facilities      = isDemo ? DEFAULT_FACILITIES      : dbFacilities;
  const resourceGroups  = isDemo ? DEFAULT_RESOURCE_GROUPS  : dbResourceGroups;
  const configResources = isDemo ? DEFAULT_RESOURCES        : dbResources;
  const slots           = isDemo ? DEMO_SLOTS               : dbSlots;

  const setFacilities      = isDemo ? () => {} : setDbFacilities;
  const setResourceGroups  = isDemo ? () => {} : setDbResourceGroups;
  const setConfigResources = isDemo ? () => {} : setDbResources;
  const setSlots           = isDemo ? () => {} : setDbSlots;

  // Flaches Array buchbarer Ressourcen für Kalender/Buchung
  const RESOURCES = useMemo(
    () => buildBookableResources(resourceGroups, configResources),
    [resourceGroups, configResources]
  );

  const noop = async () => ({ error: 'Demo-Modus' });

  const value = {
    // Roh-Daten
    facilities, resourceGroups, configResources, slots,
    // Legacy Setter (demo mode)
    setFacilities, setResourceGroups, setConfigResources, setSlots,
    // Facility CRUD
    createFacility: isDemo ? noop : createFacility,
    updateFacility: isDemo ? noop : updateFacility,
    deleteFacility: isDemo ? noop : deleteFacility,
    // ResourceGroup CRUD
    createResourceGroup: isDemo ? noop : createResourceGroup,
    updateResourceGroup: isDemo ? noop : updateResourceGroup,
    deleteResourceGroup: isDemo ? noop : deleteResourceGroup,
    // Resource CRUD
    createResource: isDemo ? noop : createResource,
    updateResource: isDemo ? noop : updateResource,
    deleteResource: isDemo ? noop : deleteResource,
    // Slot CRUD
    createSlot: isDemo ? noop : createSlot,
    updateSlot: isDemo ? noop : updateSlot,
    deleteSlot: isDemo ? noop : deleteSlot,
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
