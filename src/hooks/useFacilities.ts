/**
 * useFacilities – Anlagen, Ressourcengruppen, Ressourcen & Slots (CRUD)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type {
  Facility, FacilityCreateData,
  ResourceGroup, ResourceGroupCreateData,
  Resource, ResourceCreateData, ResourceUpdateData, SubResource,
  Slot, SlotCreateData,
  DbResult, DbDeleteResult, ResourceGroupIcon, ResourceBookingMode,
} from '../types';

function mapFacility(f: Record<string, unknown>): Facility {
  return { id: f.id as string, name: f.name as string, street: (f.street as string) || '', houseNumber: (f.house_number as string) || '', zip: (f.zip as string) || '', city: (f.city as string) || '', sortOrder: f.sort_order as number };
}
function mapResourceGroup(g: Record<string, unknown>): ResourceGroup {
  return { id: g.id as string, facilityId: g.facility_id as string, name: g.name as string, icon: g.icon as ResourceGroupIcon, sortOrder: g.sort_order as number, sharedScheduling: g.shared_scheduling as boolean };
}
function buildConfigResources(allDbResources: Record<string, unknown>[]): Resource[] {
  const parents  = allDbResources.filter(r => !r.parent_resource_id);
  const children = allDbResources.filter(r =>  r.parent_resource_id);
  return parents.map(r => ({
    id: r.id as string, groupId: r.group_id as string, name: r.name as string, color: r.color as string,
    splittable: r.splittable as boolean, bookingMode: r.booking_mode as ResourceBookingMode,
    subResources: children
      .filter(c => c.parent_resource_id === r.id)
      .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
      .map(c => ({ id: c.id as string, name: c.name as string, color: c.color as string })),
  }));
}
function mapSlot(s: Record<string, unknown>): Slot {
  return {
    id: s.id as string, resourceId: s.resource_id as string, dayOfWeek: s.day_of_week as number,
    startTime: ((s.start_time as string)?.substring(0, 5) || s.start_time) as string,
    endTime:   ((s.end_time as string)?.substring(0, 5)   || s.end_time) as string,
    validFrom: (s.valid_from as string) || null, validUntil: (s.valid_until as string) || null,
  };
}

export function useFacilities() {
  const { user } = useAuth();
  const [facilities,     setFacilitiesState]     = useState<Facility[]>([]);
  const [resourceGroups, setResourceGroupsState] = useState<ResourceGroup[]>([]);
  const [resources,      setResourcesState]      = useState<Resource[]>([]);
  const [slots,          setSlotsState]          = useState<Slot[]>([]);
  const [loading,        setLoading]             = useState(true);
  const [isDemo,         setIsDemo]              = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [facR, grpR, resR, slotR] = await Promise.all([
        supabase.from('facilities').select('*').order('sort_order'),
        supabase.from('resource_groups').select('*').order('sort_order'),
        supabase.from('resources').select('*').order('sort_order'),
        supabase.from('slots').select('*').order('day_of_week'),
      ]);
      if (facR.error) throw facR.error;
      if (grpR.error) throw grpR.error;
      if (resR.error) throw resR.error;
      if (slotR.error) throw slotR.error;
      if ((facR.data || []).length > 0) {
        setFacilitiesState(facR.data.map(mapFacility));
        setResourceGroupsState(grpR.data.map(mapResourceGroup));
        setResourcesState(buildConfigResources(resR.data || []));
        setSlotsState(slotR.data.map(mapSlot));
        setIsDemo(false);
      } else { setIsDemo(true); }
    } catch (err) { console.warn('Facilities nicht geladen:', (err as Error).message); setIsDemo(true); }
    setLoading(false);
  }, [user]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Legacy setters (kept for demo mode compatibility)
  const setFacilities     = useCallback((v: Facility[]) => setFacilitiesState(v),     []);
  const setResourceGroups = useCallback((v: ResourceGroup[]) => setResourceGroupsState(v), []);
  const setResources      = useCallback((v: Resource[]) => setResourcesState(v),      []);
  const setSlots          = useCallback((v: Slot[]) => setSlotsState(v),          []);

  // --- Facilities CRUD ---
  const createFacility = useCallback(async (fac: FacilityCreateData): Promise<DbResult<Facility>> => {
    try {
      let operatorId = fac.operatorId;
      if (!operatorId) {
        const { data: ops } = await supabase.from('operators').select('id').limit(1).single();
        operatorId = (ops as Record<string, unknown>)?.id as string | undefined;
      }
      if (!operatorId) throw new Error('Kein Betreiber gefunden.');
      const { data, error } = await supabase.from('facilities').insert({
        name: fac.name, street: fac.street || '', house_number: fac.houseNumber || '',
        zip: fac.zip || '', city: fac.city || '', sort_order: fac.sortOrder || 0,
        operator_id: operatorId,
      }).select().single();
      if (error) throw error;
      const f = mapFacility(data);
      setFacilitiesState(p => [...p, f]);
      return { data: f, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const updateFacility = useCallback(async (fac: Facility): Promise<DbResult<Facility>> => {
    try {
      const { data, error } = await supabase.from('facilities').update({
        name: fac.name, street: fac.street || '', house_number: fac.houseNumber || '',
        zip: fac.zip || '', city: fac.city || '', sort_order: fac.sortOrder || 0,
      }).eq('id', fac.id).select().single();
      if (error) throw error;
      const f = mapFacility(data);
      setFacilitiesState(p => p.map(x => x.id === f.id ? f : x));
      return { data: f, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const deleteFacility = useCallback(async (id: string): Promise<DbDeleteResult> => {
    try {
      const { error } = await supabase.from('facilities').delete().eq('id', id);
      if (error) throw error;
      setFacilitiesState(p => p.filter(f => f.id !== id));
      setResourceGroupsState(prev => {
        const removedGroupIds = prev.filter(g => g.facilityId === id).map(g => g.id);
        setResourcesState(rp => rp.filter(r => !removedGroupIds.includes(r.groupId)));
        return prev.filter(g => g.facilityId !== id);
      });
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  // --- ResourceGroups CRUD ---
  const createResourceGroup = useCallback(async (grp: ResourceGroupCreateData): Promise<DbResult<ResourceGroup>> => {
    try {
      const { data, error } = await supabase.from('resource_groups').insert({
        facility_id: grp.facilityId, name: grp.name,
        icon: grp.icon || 'outdoor', sort_order: grp.sortOrder || 0,
        shared_scheduling: grp.sharedScheduling || false,
      }).select().single();
      if (error) throw error;
      const g = mapResourceGroup(data);
      setResourceGroupsState(p => [...p, g]);
      return { data: g, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const updateResourceGroup = useCallback(async (grp: ResourceGroup): Promise<DbResult<ResourceGroup>> => {
    try {
      const { data, error } = await supabase.from('resource_groups').update({
        name: grp.name, icon: grp.icon || 'outdoor',
        sort_order: grp.sortOrder || 0, shared_scheduling: grp.sharedScheduling || false,
      }).eq('id', grp.id).select().single();
      if (error) throw error;
      const g = mapResourceGroup(data);
      setResourceGroupsState(p => p.map(x => x.id === g.id ? g : x));
      return { data: g, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const deleteResourceGroup = useCallback(async (id: string): Promise<DbDeleteResult> => {
    try {
      const { error } = await supabase.from('resource_groups').delete().eq('id', id);
      if (error) throw error;
      setResourceGroupsState(p => p.filter(g => g.id !== id));
      setResourcesState(p => p.filter(r => r.groupId !== id));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  // --- Resources CRUD ---
  const createResource = useCallback(async (res: ResourceCreateData): Promise<DbResult<Record<string, unknown>>> => {
    try {
      const { data, error } = await supabase.from('resources').insert({
        group_id: res.groupId, name: res.name, color: res.color || '#3b82f6',
        splittable: res.splittable || false, booking_mode: res.bookingMode || 'free',
        parent_resource_id: res.parentResourceId || null, sort_order: res.sortOrder || 0,
      }).select().single();
      if (error) throw error;
      const allRes = await supabase.from('resources').select('*').order('sort_order');
      if (allRes.error) throw allRes.error;
      setResourcesState(buildConfigResources(allRes.data || []));
      return { data: data, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const updateResource = useCallback(async (res: ResourceUpdateData): Promise<DbResult<Record<string, unknown>>> => {
    try {
      const { data, error } = await supabase.from('resources').update({
        name: res.name, color: res.color || '#3b82f6',
        splittable: res.splittable || false, booking_mode: res.bookingMode || 'free',
        sort_order: res.sortOrder || 0,
      }).eq('id', res.id).select().single();
      if (error) throw error;

      // Sync sub-resources if provided
      if (res.subResources !== undefined) {
        const { data: currentSubs } = await supabase
          .from('resources').select('id').eq('parent_resource_id', res.id);
        const currentSubIds = new Set((currentSubs || []).map((s: Record<string, unknown>) => s.id as string));
        const newSubIds     = new Set((res.subResources as SubResource[]).filter(s => !s.id.startsWith('sub-')).map(s => s.id));

        // Delete removed sub-resources
        const toDelete = Array.from(currentSubIds).filter(id => !newSubIds.has(id));
        if (toDelete.length > 0) {
          await supabase.from('resources').delete().in('id', toDelete);
        }

        // Create or update sub-resources
        for (let i = 0; i < (res.subResources as SubResource[]).length; i++) {
          const sub = (res.subResources as SubResource[])[i];
          if (sub.id.startsWith('sub-')) {
            // New → insert
            await supabase.from('resources').insert({
              group_id: res.groupId, name: sub.name, color: sub.color || '#3b82f6',
              splittable: false, booking_mode: 'free',
              parent_resource_id: res.id, sort_order: i,
            });
          } else if (currentSubIds.has(sub.id)) {
            // Existing → update
            await supabase.from('resources').update({
              name: sub.name, color: sub.color || '#3b82f6', sort_order: i,
            }).eq('id', sub.id);
          }
        }
      }

      const allRes = await supabase.from('resources').select('*').order('sort_order');
      if (allRes.error) throw allRes.error;
      setResourcesState(buildConfigResources(allRes.data || []));
      return { data: data, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const deleteResource = useCallback(async (id: string): Promise<DbDeleteResult> => {
    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      const allRes = await supabase.from('resources').select('*').order('sort_order');
      if (!allRes.error) setResourcesState(buildConfigResources(allRes.data || []));
      setSlotsState(p => p.filter(s => s.resourceId !== id));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  // --- Slots CRUD ---
  const createSlot = useCallback(async (slot: SlotCreateData): Promise<DbResult<Slot>> => {
    try {
      const { data, error } = await supabase.from('slots').insert({
        resource_id: slot.resourceId, day_of_week: slot.dayOfWeek,
        start_time: slot.startTime, end_time: slot.endTime,
        valid_from: slot.validFrom || null, valid_until: slot.validUntil || null,
      }).select().single();
      if (error) throw error;
      const s = mapSlot(data);
      setSlotsState(p => [...p, s]);
      return { data: s, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const updateSlot = useCallback(async (slot: Slot): Promise<DbResult<Slot>> => {
    try {
      const { data, error } = await supabase.from('slots').update({
        day_of_week: slot.dayOfWeek, start_time: slot.startTime, end_time: slot.endTime,
        valid_from: slot.validFrom || null, valid_until: slot.validUntil || null,
      }).eq('id', slot.id).select().single();
      if (error) throw error;
      const s = mapSlot(data);
      setSlotsState(p => p.map(x => x.id === s.id ? s : x));
      return { data: s, error: null };
    } catch (err) { return { data: null, error: (err as Error).message }; }
  }, []);

  const deleteSlot = useCallback(async (id: string): Promise<DbDeleteResult> => {
    try {
      const { error } = await supabase.from('slots').delete().eq('id', id);
      if (error) throw error;
      setSlotsState(p => p.filter(s => s.id !== id));
      return { error: null };
    } catch (err) { return { error: (err as Error).message }; }
  }, []);

  return {
    facilities, resourceGroups, resources, slots,
    setFacilities, setResourceGroups, setResources, setSlots,
    createFacility, updateFacility, deleteFacility,
    createResourceGroup, updateResourceGroup, deleteResourceGroup,
    createResource, updateResource, deleteResource,
    createSlot, updateSlot, deleteSlot,
    loading, isDemo, refreshFacilities: fetchAll,
  };
}
