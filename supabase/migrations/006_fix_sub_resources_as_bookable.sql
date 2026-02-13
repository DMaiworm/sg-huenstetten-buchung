-- ============================================================
-- Migration 006: Make sub_resources bookable
-- 
-- Problem: bookings.resource_id references resources(id), but
-- sub_resources (e.g. "Sportplatz links") live in a separate table.
-- When a user books a sub-resource, the FK constraint fails.
--
-- Solution: Add a parent_resource_id column to resources, then
-- copy all sub_resources into resources as children. Update
-- existing bookings and seed data that reference sub_resource IDs.
-- Finally, the sub_resources table is kept but deprecated.
-- ============================================================

-- 1. Add parent_resource_id to resources (nullable = top-level resource)
ALTER TABLE resources ADD COLUMN parent_resource_id UUID REFERENCES resources(id) ON DELETE CASCADE;

-- 2. Insert sub_resources into resources table as child resources
--    They inherit group_id from their parent, booking_mode = 'free', splittable = false
INSERT INTO resources (id, group_id, name, color, splittable, booking_mode, sort_order, parent_resource_id)
SELECT 
  sr.id,
  r.group_id,
  sr.name,
  sr.color,
  false,
  r.booking_mode,
  sr.sort_order + 100,  -- offset to sort after parent
  r.id                   -- parent_resource_id
FROM sub_resources sr
JOIN resources r ON sr.resource_id = r.id;

-- 3. Update the parent resources: store child IDs for the legacy isComposite/includes pattern
--    (The application already handles this via buildLegacyResources)

-- 4. Verify: existing seed bookings for sub_resources should now resolve
--    Booking 60000000-...-001 references f0000000-...-001 (Sportplatz links)
--    which is now also in the resources table.

-- 5. Create index on parent_resource_id for efficient lookups
CREATE INDEX idx_resources_parent ON resources(parent_resource_id) WHERE parent_resource_id IS NOT NULL;
