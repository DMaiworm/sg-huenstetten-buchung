-- ============================================================
-- Migration 002: Profiles von auth.users entkoppeln
-- Ermöglicht Prototyp-Betrieb ohne Login-System
-- ============================================================

-- 1. FK-Constraint auf auth.users entfernen
ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;

-- 2. ID-Feld auf auto-generated UUID umstellen (nicht mehr an auth gebunden)
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. RLS Policies lockern für Prototyp (kein Auth → kein auth.uid())
--    Alle dürfen alles lesen und schreiben während Prototyp-Phase
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (true);

CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (true);

-- Operators ebenfalls lockern
DROP POLICY IF EXISTS "operators_insert" ON operators;
DROP POLICY IF EXISTS "operators_update" ON operators;
DROP POLICY IF EXISTS "operators_delete" ON operators;

CREATE POLICY "operators_insert" ON operators
  FOR INSERT WITH CHECK (true);

CREATE POLICY "operators_update" ON operators
  FOR UPDATE USING (true);

CREATE POLICY "operators_delete" ON operators
  FOR DELETE USING (true);

-- 4. Seed Data: Demo-Benutzer einfügen
INSERT INTO profiles (id, first_name, last_name, email, phone, role, operator_id) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Max', 'Müller', 'max.mueller@sg-huenstetten.de', '0171-1234567', 'trainer', NULL),
  ('b0000000-0000-0000-0000-000000000002', 'Anna', 'Schmidt', 'anna.schmidt@sg-huenstetten.de', '0172-2345678', 'trainer', NULL),
  ('b0000000-0000-0000-0000-000000000003', 'Tom', 'Weber', 'tom.weber@sg-huenstetten.de', '0173-3456789', 'trainer', NULL),
  ('b0000000-0000-0000-0000-000000000004', 'Lisa', 'Braun', 'lisa.braun@sg-huenstetten.de', '0174-4567890', 'trainer', NULL),
  ('b0000000-0000-0000-0000-000000000005', 'Hans', 'Meier', 'hans.meier@sg-huenstetten.de', '0175-5678901', 'trainer', NULL),
  ('b0000000-0000-0000-0000-000000000006', 'Peter', 'König', 'peter.koenig@sg-huenstetten.de', '0176-6789012', 'admin', 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000007', 'Sandra', 'Fischer', 'sandra.fischer@tv-idstein.de', '0177-7890123', 'extern', NULL),
  ('b0000000-0000-0000-0000-000000000008', 'Michael', 'Wagner', 'm.wagner@tsv-wallrabenstein.de', '0178-8901234', 'extern', NULL);
