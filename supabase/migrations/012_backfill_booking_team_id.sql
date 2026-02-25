-- ============================================================
-- Migration 012: Backfill team_id für bestehende Buchungen
--
-- Strategie:
--   1. Trainer mit genau 1 Team-Zuordnung → eindeutig setzbar
--   2. Trainer mit mehreren Teams → Titel-Matching gegen Teamname/Kurzname
--   3. Rest bleibt NULL (manuell zuordnen oder ignorieren)
-- ============================================================

-- Schritt 1: Eindeutige Zuordnung (Trainer hat genau 1 Team)
UPDATE bookings b
SET team_id = sub.team_id
FROM (
  SELECT ta.user_id, ta.team_id
  FROM trainer_assignments ta
  WHERE ta.user_id IN (
    SELECT user_id
    FROM trainer_assignments
    GROUP BY user_id
    HAVING COUNT(*) = 1
  )
) sub
WHERE b.user_id = sub.user_id
  AND b.team_id IS NULL;

-- Schritt 2: Titel-Matching (Trainer hat mehrere Teams)
-- Versucht den Booking-Titel gegen Team-Name oder Short-Name zu matchen.
UPDATE bookings b
SET team_id = matched.team_id
FROM (
  SELECT DISTINCT ON (b2.id) b2.id AS booking_id, t.id AS team_id
  FROM bookings b2
  JOIN trainer_assignments ta ON ta.user_id = b2.user_id
  JOIN teams t ON t.id = ta.team_id
  WHERE b2.team_id IS NULL
    AND (
      b2.title ILIKE '%' || t.name || '%'
      OR b2.title ILIKE '%' || t.short_name || '%'
    )
  ORDER BY b2.id, LENGTH(t.name) DESC  -- längster Match = spezifischster
) matched
WHERE b.id = matched.booking_id
  AND b.team_id IS NULL;
