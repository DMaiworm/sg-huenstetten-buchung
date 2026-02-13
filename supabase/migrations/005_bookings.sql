-- ============================================================
-- Migration 005: Bookings
-- SG Hünstetten Buchungssystem – Schritt 4
-- ============================================================

-- 1. ENUMs
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE booking_type AS ENUM ('training', 'match', 'event', 'other');

-- 2. Tabelle: bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  booking_type booking_type NOT NULL DEFAULT 'training',
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status booking_status NOT NULL DEFAULT 'pending',
  series_id TEXT,
  parent_booking BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_booking_time CHECK (start_time < end_time)
);

-- 3. Indexes
CREATE INDEX idx_bookings_resource ON bookings(resource_id);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_series ON bookings(series_id) WHERE series_id IS NOT NULL;
CREATE INDEX idx_bookings_resource_date ON bookings(resource_id, date);

-- 4. Updated_at Trigger
CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Row Level Security (Prototyp: alles offen)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (true);
CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings_update" ON bookings FOR UPDATE USING (true);
CREATE POLICY "bookings_delete" ON bookings FOR DELETE USING (true);

-- 6. Konflikterkennung: Funktion prüft ob Zeitraum bereits belegt
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_resource_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS TABLE(conflicting_id UUID, conflicting_title TEXT, conflicting_start TIME, conflicting_end TIME) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.start_time, b.end_time
  FROM bookings b
  WHERE b.resource_id = p_resource_id
    AND b.date = p_date
    AND b.status IN ('pending', 'approved')
    AND b.start_time < p_end_time
    AND b.end_time > p_start_time
    AND (p_exclude_id IS NULL OR b.id != p_exclude_id);
END;
$$ LANGUAGE plpgsql;

-- 7. SEED DATA: Demo-Buchungen mit korrekten UUIDs
INSERT INTO bookings (id, resource_id, date, start_time, end_time, title, booking_type, user_id, status, series_id) VALUES
  -- Sportplatz links: A-Jugend Training
  ('60000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000001',
   '2026-02-10', '16:00', '18:00', 'A-Jugend Training', 'training',
   'b0000000-0000-0000-0000-000000000001', 'approved', 'series-1'),
  -- Gymnastikraum: Yoga Kurs
  ('60000000-0000-0000-0000-000000000002',
   'e0000000-0000-0000-0000-000000000003',
   '2026-02-10', '19:00', '20:30', 'Yoga Kurs', 'training',
   'b0000000-0000-0000-0000-000000000002', 'approved', 'series-2'),
  -- Große Halle: Hallenfußball
  ('60000000-0000-0000-0000-000000000003',
   'e0000000-0000-0000-0000-000000000006',
   '2026-02-10', '18:00', '20:00', 'Hallenfußball', 'training',
   'b0000000-0000-0000-0000-000000000003', 'pending', 'series-3'),
  -- Kleinfeld: F-Jugend Training
  ('60000000-0000-0000-0000-000000000004',
   'e0000000-0000-0000-0000-000000000002',
   '2026-02-11', '15:00', '17:00', 'F-Jugend Training', 'training',
   'b0000000-0000-0000-0000-000000000004', 'pending', NULL),
  -- Fitnessraum: Seniorensport
  ('60000000-0000-0000-0000-000000000005',
   'e0000000-0000-0000-0000-000000000004',
   '2026-02-12', '10:00', '11:30', 'Seniorensport', 'training',
   'b0000000-0000-0000-0000-000000000005', 'approved', NULL),
  -- Sportplatz komplett: Heimspiel
  ('60000000-0000-0000-0000-000000000006',
   'e0000000-0000-0000-0000-000000000001',
   '2026-02-15', '14:00', '17:00', 'Heimspiel 1. Mannschaft', 'match',
   'b0000000-0000-0000-0000-000000000006', 'approved', NULL);
