-- Create a test Ludo event for user david_pierrick to verify the display functionality
INSERT INTO ludo_events (
  id,
  user_id,
  title,
  description,
  event_date,
  start_time,
  end_time,
  location,
  max_players,
  frequency,
  selected_games,
  rules,
  image_url,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '11ffa0f3-f213-49f7-8878-5e814c3132c1',
  'Test Ludo Event',
  'Dies ist ein Test-Event um zu überprüfen ob die Anzeige funktioniert.',
  '2025-01-15',
  '19:00',
  '22:00',
  'Mein Zuhause',
  4,
  'single',
  '["783f36da-e3f2-4d16-9656-ca188829462d"]',
  'Bitte pünktlich sein!',
  '',
  NOW(),
  NOW()
);

-- Verify the event was created
SELECT 
  id, 
  title, 
  user_id, 
  event_date, 
  start_time, 
  end_time, 
  location,
  max_players,
  frequency
FROM ludo_events 
WHERE user_id = '11ffa0f3-f213-49f7-8878-5e814c3132c1';
