-- ============================================================
-- Migration 011: Add team_id to bookings
-- Speichert die Mannschaft direkt in der Buchung, damit die
-- Anzeige nicht vom ersten Trainer-Assignment abhängt.
-- ============================================================

ALTER TABLE bookings
  ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX idx_bookings_team ON bookings(team_id) WHERE team_id IS NOT NULL;
