-- ============================================================
-- Migration 008: Ferien & Feiertage (Hessen)
-- SG Hünstetten Buchungssystem
-- ============================================================

-- 1. Tabelle: holidays (Feiertage & Schulferien)
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feiertag', 'schulferien')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- 2. Indexes
CREATE INDEX idx_holidays_year ON holidays(year);
CREATE INDEX idx_holidays_type ON holidays(type);
CREATE INDEX idx_holidays_dates ON holidays(start_date, end_date);

-- 3. Updated_at Trigger
CREATE TRIGGER set_holidays_updated_at
  BEFORE UPDATE ON holidays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. Row Level Security (Prototyp: alles offen)
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "holidays_select" ON holidays FOR SELECT USING (true);
CREATE POLICY "holidays_insert" ON holidays FOR INSERT WITH CHECK (true);
CREATE POLICY "holidays_update" ON holidays FOR UPDATE USING (true);
CREATE POLICY "holidays_delete" ON holidays FOR DELETE USING (true);
