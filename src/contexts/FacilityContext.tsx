import React, { createContext, useContext, useMemo } from 'react';
import { useFacilities as useFacilitiesHook } from '../hooks/useSupabase';
import { DEFAULT_FACILITIES, DEFAULT_RESOURCE_GROUPS, DEFAULT_RESOURCES, buildBookableResources } from '../config/facilityConfig';
import type {
  Facility, FacilityCreateData,
  ResourceGroup, ResourceGroupCreateData,
  Resource, ResourceCreateData, ResourceUpdateData,
  Slot, SlotCreateData,
  BookableResource,
  DbResult, DbDeleteResult,
} from '../types';

const DEMO_SLOTS: Slot[] = [
  { id: '1', resourceId: 'halle-gross', dayOfWeek: 1, startTime: '17:00', endTime: '21:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: '2', resourceId: 'halle-gross', dayOfWeek: 3, startTime: '18:00', endTime: '22:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: '3', resourceId: 'halle-gross', dayOfWeek: 6, startTime: '09:00', endTime: '14:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: '4', resourceId: 'halle-klein', dayOfWeek: 2, startTime: '16:00', endTime: '20:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
  { id: '5', resourceId: 'halle-klein', dayOfWeek: 4, startTime: '17:00', endTime: '21:00', validFrom: '2026-01-01', validUntil: '2026-06-30' },
];

interface FacilityContextValue {
  facilities: Facility[];
  resourceGroups: ResourceGroup[];
  configResources: Resource[];
  slots: Slot[];
  setFacilities: (v: Facility[]) => void;
  setResourceGroups: (v: ResourceGroup[]) => void;
  setConfigResources: (v: Resource[]) => void;
  setSlots: (v: Slot[]) => void;
  createFacility: (fac: FacilityCreateData) => Promise<DbResult<Facility>> | Promise<{ error: string }>;
  updateFacility: (fac: Facility) => Promise<DbResult<Facility>> | Promise<{ error: string }>;
  deleteFacility: (id: string) => Promise<DbDeleteResult> | Promise<{ error: string }>;
  createResourceGroup: (grp: ResourceGroupCreateData) => Promise<DbResult<ResourceGroup>> | Promise<{ error: string }>;
  updateResourceGroup: (grp: ResourceGroup) => Promise<DbResult<ResourceGroup>> | Promise<{ error: string }>;
  deleteResourceGroup: (id: string) => Promise<DbDeleteResult> | Promise<{ error: string }>;
  createResource: (res: ResourceCreateData) => Promise<DbResult<Record<string, unknown>>> | Promise<{ error: string }>;
  updateResource: (res: ResourceUpdateData) => Promise<DbResult<Record<string, unknown>>> | Promise<{ error: string }>;
  deleteResource: (id: string) => Promise<DbDeleteResult> | Promise<{ error: string }>;
  createSlot: (slot: SlotCreateData) => Promise<DbResult<Slot>> | Promise<{ error: string }>;
  updateSlot: (slot: Slot) => Promise<DbResult<Slot>> | Promise<{ error: string }>;
  deleteSlot: (id: string) => Promise<DbDeleteResult> | Promise<{ error: string }>;
  RESOURCES: BookableResource[];
  loading: boolean;
  isDemo: boolean;
}

const FacilityContext = createContext<FacilityContextValue | null>(null);

export function FacilityProvider({ children }: { children: React.ReactNode }) {
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
  const facilities      = isDemo ? DEFAULT_FACILITIES as unknown as Facility[]           : dbFacilities;
  const resourceGroups  = isDemo ? DEFAULT_RESOURCE_GROUPS as unknown as ResourceGroup[] : dbResourceGroups;
  const configResources = isDemo ? DEFAULT_RESOURCES as unknown as Resource[]            : dbResources;
  const slots           = isDemo ? DEMO_SLOTS                                            : dbSlots;

  const setFacilities      = isDemo ? (() => {}) as unknown as (v: Facility[]) => void      : setDbFacilities;
  const setResourceGroups  = isDemo ? (() => {}) as unknown as (v: ResourceGroup[]) => void : setDbResourceGroups;
  const setConfigResources = isDemo ? (() => {}) as unknown as (v: Resource[]) => void      : setDbResources;
  const setSlots           = isDemo ? (() => {}) as unknown as (v: Slot[]) => void          : setDbSlots;

  // Flaches Array buchbarer Ressourcen für Kalender/Buchung
  const RESOURCES = useMemo(
    () => buildBookableResources(resourceGroups, configResources),
    [resourceGroups, configResources]
  );

  const noop = async () => ({ error: 'Demo-Modus' });

  const value: FacilityContextValue = {
    facilities, resourceGroups, configResources, slots,
    setFacilities, setResourceGroups, setConfigResources, setSlots,
    createFacility: isDemo ? noop : createFacility,
    updateFacility: isDemo ? noop : updateFacility,
    deleteFacility: isDemo ? noop : deleteFacility,
    createResourceGroup: isDemo ? noop : createResourceGroup,
    updateResourceGroup: isDemo ? noop : updateResourceGroup,
    deleteResourceGroup: isDemo ? noop : deleteResourceGroup,
    createResource: isDemo ? noop : createResource,
    updateResource: isDemo ? noop : updateResource,
    deleteResource: isDemo ? noop : deleteResource,
    createSlot: isDemo ? noop : createSlot,
    updateSlot: isDemo ? noop : updateSlot,
    deleteSlot: isDemo ? noop : deleteSlot,
    RESOURCES,
    loading, isDemo,
  };

  return <FacilityContext.Provider value={value}>{children}</FacilityContext.Provider>;
}

export function useFacility(): FacilityContextValue {
  const ctx = useContext(FacilityContext);
  if (!ctx) throw new Error('useFacility muss innerhalb von <FacilityProvider> verwendet werden');
  return ctx;
}
