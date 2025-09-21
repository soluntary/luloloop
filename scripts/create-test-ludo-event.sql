-- Create a test Ludo event for debugging
INSERT INTO ludo_events (
  id,
  title,
  description,
  event_date,
  start_time,
  end_time,
  location,
  max_players,
  frequency,
  rules,
  created_by,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Test Event für David',
  'Dies ist ein Test-Event um zu prüfen ob die Anzeige funktioniert',
  '2025-01-15',
  '19:00',
  '22:00',
  'Test Location',
  4,
  'single',
  'Bitte pünktlich sein',
  '11ffa0f3-f213-49f7-8878-5e814c3132c1',
  now(),
  now()
);
