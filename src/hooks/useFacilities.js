/**
 * useFacilities – Anlagen, Ressourcengruppen, Ressourcen & Slots (CRUD)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function mapFacility(f) {
  return { id: f.id, name: f.name, street: f.street || '', houseNumber: f.house_number || '', zip: f.zip || '', city: f.city || '', sortOrder: f.sort_order };
}
function mapResourceGroup(g) {
  return { id: g.id, facilityId: g.facility_id, name: g.name, icon: g.icon, sortOrder: g.sort_order, sharedScheduling: g.shared_scheduling };
}
function buildConfigResources(allDbResources) {
  const parents  = allDbResources.filter(r => !r.parent_resource_id);
  const children = allDbResources.filter(r =>  r.parent_resource_id);
  return parents.map(r => ({
    id: r.id, groupId: r.group_id, name: r.name, color: r.color,
    splittable: r.splittable, bookingMode: r.booking_mode,
    subResources: children
      .filter(c => c.parent_resource_id === r.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(c => ({ id: c.id, name: c.name, color: c.color })),
  }));
}
function mapSlot(s) {
  return {
    id: s.id, resourceId: s.resource_id, dayOfWeek: s.day_of_week,
    startTime: s.start_time?.substring(0, 5) || s.start_time,
    endTime:   s.end_time?.substring(0, 5)   || s.end_time,
    validFrom: s.valid_from, validUntil: s.valid_until,
  };
}

export function useFacilities() {
  const [facilities,     setFacilitiesState]     = useState([]);
  const [resourceGroups, setResourceGroupsState] = useState([]);
  const [resources,      setResourcesState]      = useState([]);
  const [slots,          setSlotsState]          = useState([]);
  const [loading,        setLoading]             = useState(true);
  const [isDemo,         setIsDemo]              = useState(false);

  const fetchAll = useCallback(async () => {
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
    } catch (err) { console.warn('Facilities nicht geladen:', err.message); setIsDemo(true); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Legacy setters (kept for demo mode compatibility)
  const setFacilities     = useCallback((v) => setFacilitiesState(v),     []);
  const setResourceGroups = useCallback((v) => setResourceGroupsState(v), []);
  const setResources      = useCallback((v) => setResourcesState(v),      []);
  const setSlots          = useCallback((v) => setSlotsState(v),          []);

  // --- Facilities CRUD ---
  const createFacility = useCallback(async (fac) => {
    try {
      let operatorId = fac.operatorId;
      if (!operatorId) {
        const { data: ops } = await supabase.from('operators').select('id').limit(1).single();
        operatorId = ops?.id;
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
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateFacility = useCallback(async (fac) => {
    try {
      const { data, error } = await supabase.from('facilities').update({
        name: fac.name, street: fac.street || '', house_number: fac.houseNumber || '',
        zip: fac.zip || '', city: fac.city || '', sort_order: fac.sortOrder || 0,
      }).eq('id', fac.id).select().single();
      if (error) throw error;
      const f = mapFacility(data);
      setFacilitiesState(p => p.map(x => x.id === f.id ? f : x));
      return { data: f, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const deleteFacility = useCallback(async (id) => {
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
    } catch (err) { return { error: err.message }; }
  }, []);

  // --- ResourceGroups CRUD ---
  const createResourceGroup = useCallback(async (grp) => {
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
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateResourceGroup = useCallback(async (grp) => {
    try {
      const { data, error } = await supabase.from('resource_groups').update({
        name: grp.name, icon: grp.icon || 'outdoor',
        sort_order: grp.sortOrder || 0, shared_scheduling: grp.sharedScheduling || false,
      }).eq('id', grp.id).select().single();
      if (error) throw error;
      const g = mapResourceGroup(data);
      setResourceGroupsState(p => p.map(x => x.id === g.id ? g : x));
      return { data: g, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const deleteResourceGroup = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('resource_groups').delete().eq('id', id);
      if (error) throw error;
      setResourceGroupsState(p => p.filter(g => g.id !== id));
      setResourcesState(p => p.filter(r => r.groupId !== id));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  // --- Resources CRUD ---
  const createResource = useCallback(async (res) => {
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
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateResource = useCallback(async (res) => {
    try {
      const { data, error } = await supabase.from('resources').update({
        name: res.name, color: res.color || '#3b82f6',
        splittable: res.splittable || false, booking_mode: res.bookingMode || 'free',
        sort_order: res.sortOrder || 0,
      }).eq('id', res.id).select().single();
      if (error) throw error;
      const allRes = await supabase.from('resources').select('*').order('sort_order');
      if (allRes.error) throw allRes.error;
      setResourcesState(buildConfigResources(allRes.data || []));
      return { data: data, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const deleteResource = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      const allRes = await supabase.from('resources').select('*').order('sort_order');
      if (!allRes.error) setResourcesState(buildConfigResources(allRes.data || []));
      setSlotsState(p => p.filter(s => s.resourceId !== id));
      return { error: null };
    } catch (err) { return { error: err.message }; }
  }, []);

  // --- Slots CRUD ---
  const createSlot = useCallback(async (slot) => {
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
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const updateSlot = useCallback(async (slot) => {
    try {
      const { data, error } = await supabase.from('slots').update({
        day_of_week: slot.dayOfWeek, start_time: slot.startTime, end_time: slot.endTime,
        valid_from: slot.validFrom || null, valid_until: slot.validUntil || null,
      }).eq('id', slot.id).select().single();
      if (error) throw error;
      const s = mapSlot(data);
      setSlotsState(p => p.map(x => x.id === s.id ? s : x));
      return { data: s, error: null };
    } catch (err) { return { data: null, error: err.message }; }
  }, []);

  const deleteSlot = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('slots').delete().eq('id', id);
      if (error) throw error;
      setSlotsState(p => p.filter(s => s.id !== id));
      return { error: null };
    } catch (err) { return { error: err.message }; }
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
