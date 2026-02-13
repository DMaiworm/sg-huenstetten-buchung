-- ============================================================
-- Migration 004: Organisation (Clubs, Departments, Teams, TrainerAssignments)
-- SG Hünstetten Buchungssystem – Schritt 3
-- ============================================================

-- 1. Tabelle: clubs (Vereine)
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  is_home_club BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabelle: departments (Abteilungen)
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabelle: teams (Mannschaften/Gruppen)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  event_types TEXT[] NOT NULL DEFAULT ARRAY['training'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabelle: trainer_assignments (Trainer-Zuordnungen)
CREATE TABLE trainer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, team_id)
);

-- 5. Indexes
CREATE INDEX idx_departments_club ON departments(club_id);
CREATE INDEX idx_teams_department ON teams(department_id);
CREATE INDEX idx_trainer_assignments_user ON trainer_assignments(user_id);
CREATE INDEX idx_trainer_assignments_team ON trainer_assignments(team_id);

-- 6. Updated_at Trigger
CREATE TRIGGER set_clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_trainer_assignments_updated_at
  BEFORE UPDATE ON trainer_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. Row Level Security (Prototyp: alles offen)
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clubs_select" ON clubs FOR SELECT USING (true);
CREATE POLICY "clubs_insert" ON clubs FOR INSERT WITH CHECK (true);
CREATE POLICY "clubs_update" ON clubs FOR UPDATE USING (true);
CREATE POLICY "clubs_delete" ON clubs FOR DELETE USING (true);

CREATE POLICY "departments_select" ON departments FOR SELECT USING (true);
CREATE POLICY "departments_insert" ON departments FOR INSERT WITH CHECK (true);
CREATE POLICY "departments_update" ON departments FOR UPDATE USING (true);
CREATE POLICY "departments_delete" ON departments FOR DELETE USING (true);

CREATE POLICY "teams_select" ON teams FOR SELECT USING (true);
CREATE POLICY "teams_insert" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "teams_update" ON teams FOR UPDATE USING (true);
CREATE POLICY "teams_delete" ON teams FOR DELETE USING (true);

CREATE POLICY "trainer_assignments_select" ON trainer_assignments FOR SELECT USING (true);
CREATE POLICY "trainer_assignments_insert" ON trainer_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "trainer_assignments_update" ON trainer_assignments FOR UPDATE USING (true);
CREATE POLICY "trainer_assignments_delete" ON trainer_assignments FOR DELETE USING (true);

-- ============================================================
-- 8. SEED DATA
-- ============================================================

-- Clubs
INSERT INTO clubs (id, name, short_name, color, is_home_club) VALUES
  ('20000000-0000-0000-0000-000000000001', 'SG Hünstetten', 'SGH', '#2563eb', true),
  ('20000000-0000-0000-0000-000000000002', 'TV Idstein', 'TVI', '#dc2626', false),
  ('20000000-0000-0000-0000-000000000003', 'TSV Wallrabenstein', 'TSV', '#16a34a', false);

-- Departments: SG Hünstetten
INSERT INTO departments (id, club_id, name, icon, sort_order) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Fußball', '⚽', 1),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Leichtathletik', '🏃', 2),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Yoga', '🧘‍♂️', 3),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'Tischtennis', '🏓', 4),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'Gymnastik', '🤸', 5),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 'Seniorensport', '🏋', 6);

-- Departments: TV Idstein
INSERT INTO departments (id, club_id, name, icon, sort_order) VALUES
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002', 'Handball', '🤾', 1);

-- Departments: TSV Wallrabenstein
INSERT INTO departments (id, club_id, name, icon, sort_order) VALUES
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000003', 'Fußball', '⚽', 1);

-- Teams: SG Hünstetten Fußball
INSERT INTO teams (id, department_id, name, short_name, color, sort_order, event_types) VALUES
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '1. Mannschaft (Herren)', 'Herren I', '#1e40af', 1, ARRAY['training', 'match']),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '2. Mannschaft (Herren)', 'Herren II', '#3b82f6', 2, ARRAY['training', 'match']),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'A-Jugend', 'A-Jgd', '#60a5fa', 3, ARRAY['training', 'match']),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'B-Jugend', 'B-Jgd', '#93c5fd', 4, ARRAY['training', 'match']),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', 'F-Jugend', 'F-Jgd', '#bfdbfe', 5, ARRAY['training', 'match']);

-- Teams: SG Hünstetten Leichtathletik
INSERT INTO teams (id, department_id, name, short_name, color, sort_order, event_types) VALUES
  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', 'Leichtathletik 6–8 Jahre', 'LA 6-8', '#f97316', 1, ARRAY['training', 'event']),
  ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000002', 'Leichtathletik 9–12 Jahre', 'LA 9-12', '#fb923c', 2, ARRAY['training', 'event']);

-- Teams: SG Hünstetten Yoga
INSERT INTO teams (id, department_id, name, short_name, color, sort_order, event_types) VALUES
  ('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000003', 'Herren-Yoga', 'Yoga H', '#a855f7', 1, ARRAY['training']),
  ('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000003', 'Yoga Mixed', 'Yoga M', '#c084fc', 2, ARRAY['training']);

-- Teams: SG Hünstetten Tischtennis, Gymnastik, Seniorensport
INSERT INTO teams (id, department_id, name, short_name, color, sort_order, event_types) VALUES
  ('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000004', 'Tischtennis Senioren', 'TT Sen', '#0891b2', 1, ARRAY['training', 'match']),
  ('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000005', 'Gymnastikgruppe', 'Gym', '#e11d48', 1, ARRAY['training']),
  ('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000006', 'Seniorensport', 'Sen', '#65a30d', 1, ARRAY['training']);

-- Teams: TV Idstein Handball
INSERT INTO teams (id, department_id, name, short_name, color, sort_order, event_types) VALUES
  ('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000007', 'Handball Damen', 'HB Damen', '#dc2626', 1, ARRAY['training', 'match']);

-- Teams: TSV Wallrabenstein Fußball
INSERT INTO teams (id, department_id, name, short_name, color, sort_order, event_types) VALUES
  ('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000008', 'Herren', 'TSV H', '#16a34a', 1, ARRAY['training', 'match']);

-- Trainer Assignments (nutzt Profile-UUIDs aus Migration 002)
INSERT INTO trainer_assignments (id, user_id, team_id, is_primary) VALUES
  ('50000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', true),
  ('50000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000009', true),
  ('50000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000008', true),
  ('50000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', true),
  ('50000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000005', true),
  ('50000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000012', true),
  ('50000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000001', false),
  ('50000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000013', true),
  ('50000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000014', true);
