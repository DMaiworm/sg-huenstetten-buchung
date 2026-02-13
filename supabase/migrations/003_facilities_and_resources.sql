-- ============================================================
-- Migration 003: Facilities, ResourceGroups, Resources, SubResources, Slots
-- SG Hünstetten Buchungssystem – Schritt 2
-- ============================================================

-- 1. ENUM: Buchungsmodus
CREATE TYPE booking_mode AS ENUM ('free', 'slotOnly');

-- 2. ENUM: Ressourcengruppen-Icon
CREATE TYPE resource_group_icon AS ENUM ('outdoor', 'indoor', 'shared');

-- 3. Tabelle: facilities (Anlagen/Standorte)
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  street TEXT,
  house_number TEXT,
  zip TEXT,
  city TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabelle: resource_groups (Ressourcengruppen)
CREATE TABLE resource_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon resource_group_icon NOT NULL DEFAULT 'outdoor',
  sort_order INTEGER NOT NULL DEFAULT 0,
  shared_scheduling BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabelle: resources (Einzelressourcen)
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES resource_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  splittable BOOLEAN NOT NULL DEFAULT false,
  booking_mode booking_mode NOT NULL DEFAULT 'free',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tabelle: sub_resources (Teilressourcen, z.B. Sportplatz links/rechts)
CREATE TABLE sub_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#22c55e',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Tabelle: slots (Zeitfenster für slotOnly-Ressourcen)
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- 8. Indexes
CREATE INDEX idx_facilities_operator ON facilities(operator_id);
CREATE INDEX idx_resource_groups_facility ON resource_groups(facility_id);
CREATE INDEX idx_resources_group ON resources(group_id);
CREATE INDEX idx_sub_resources_resource ON sub_resources(resource_id);
CREATE INDEX idx_slots_resource ON slots(resource_id);
CREATE INDEX idx_slots_day ON slots(day_of_week);

-- 9. Updated_at Trigger (Funktion existiert bereits aus Migration 001)
CREATE TRIGGER set_facilities_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_resource_groups_updated_at
  BEFORE UPDATE ON resource_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_sub_resources_updated_at
  BEFORE UPDATE ON sub_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_slots_updated_at
  BEFORE UPDATE ON slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 10. Row Level Security (Prototyp: alles offen)
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;

-- SELECT: alle dürfen lesen
CREATE POLICY "facilities_select" ON facilities FOR SELECT USING (true);
CREATE POLICY "resource_groups_select" ON resource_groups FOR SELECT USING (true);
CREATE POLICY "resources_select" ON resources FOR SELECT USING (true);
CREATE POLICY "sub_resources_select" ON sub_resources FOR SELECT USING (true);
CREATE POLICY "slots_select" ON slots FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE: Prototyp offen (wird später auf Admin beschränkt)
CREATE POLICY "facilities_insert" ON facilities FOR INSERT WITH CHECK (true);
CREATE POLICY "facilities_update" ON facilities FOR UPDATE USING (true);
CREATE POLICY "facilities_delete" ON facilities FOR DELETE USING (true);

CREATE POLICY "resource_groups_insert" ON resource_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "resource_groups_update" ON resource_groups FOR UPDATE USING (true);
CREATE POLICY "resource_groups_delete" ON resource_groups FOR DELETE USING (true);

CREATE POLICY "resources_insert" ON resources FOR INSERT WITH CHECK (true);
CREATE POLICY "resources_update" ON resources FOR UPDATE USING (true);
CREATE POLICY "resources_delete" ON resources FOR DELETE USING (true);

CREATE POLICY "sub_resources_insert" ON sub_resources FOR INSERT WITH CHECK (true);
CREATE POLICY "sub_resources_update" ON sub_resources FOR UPDATE USING (true);
CREATE POLICY "sub_resources_delete" ON sub_resources FOR DELETE USING (true);

CREATE POLICY "slots_insert" ON slots FOR INSERT WITH CHECK (true);
CREATE POLICY "slots_update" ON slots FOR UPDATE USING (true);
CREATE POLICY "slots_delete" ON slots FOR DELETE USING (true);

-- ============================================================
-- 11. SEED DATA
-- ============================================================

-- Operator-ID: a0000000-0000-0000-0000-000000000001 (SG Hünstetten, aus Migration 001)

-- Facilities
INSERT INTO facilities (id, operator_id, name, street, house_number, zip, city, sort_order) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Biogrund Sportpark', 'Am Sportpark', '1', '65510', 'Hünstetten-Görsroth', 1),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Dorfgemeinschaftshaus Görsroth', 'Hauptstraße', '', '65510', 'Hünstetten-Görsroth', 2);

-- Resource Groups
INSERT INTO resource_groups (id, facility_id, name, icon, sort_order, shared_scheduling) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Außenanlagen', 'outdoor', 1, false),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Innenräume', 'indoor', 2, false),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Mehrzweckhallen', 'shared', 1, true);

-- Resources
INSERT INTO resources (id, group_id, name, color, splittable, booking_mode, sort_order) VALUES
  -- Biogrund: Außenanlagen
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Sportplatz - komplett', '#15803d', true, 'free', 1),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Fußball-Kleinfeld', '#84cc16', false, 'free', 2),
  -- Biogrund: Innenräume
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'Gymnastikraum', '#8b5cf6', false, 'free', 1),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'Fitnessraum', '#a855f7', false, 'free', 2),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'Vereinsgastronomie', '#f59e0b', false, 'free', 3),
  -- DGH: Mehrzweckhallen
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', 'Große Mehrzweckhalle', '#ef4444', false, 'slotOnly', 1),
  ('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000003', 'Kleine Mehrzweckhalle', '#f97316', false, 'slotOnly', 2);

-- Sub-Resources (Sportplatz links/rechts)
INSERT INTO sub_resources (id, resource_id, name, color, sort_order) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Sportplatz - links', '#22c55e', 1),
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Sportplatz - rechts', '#16a34a', 2);

-- Slots (Zeitfenster für slotOnly-Ressourcen)
INSERT INTO slots (id, resource_id, day_of_week, start_time, end_time, valid_from, valid_until) VALUES
  -- Große Mehrzweckhalle
  ('10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006', 1, '17:00', '21:00', '2026-01-01', '2026-06-30'),
  ('10000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000006', 3, '18:00', '22:00', '2026-01-01', '2026-06-30'),
  ('10000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000006', 6, '09:00', '14:00', '2026-01-01', '2026-06-30'),
  -- Kleine Mehrzweckhalle
  ('10000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000007', 2, '16:00', '20:00', '2026-01-01', '2026-06-30'),
  ('10000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000007', 4, '17:00', '21:00', '2026-01-01', '2026-06-30');
