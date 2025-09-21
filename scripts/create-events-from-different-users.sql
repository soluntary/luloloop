-- Create events from different users to test that all events are displayed
-- This will prove that the RLS policies and query are working correctly

-- First, let's create some test users (these might already exist)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'user1@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'user2@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'user3@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create corresponding profiles
INSERT INTO profiles (id, username, name, avatar)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'testuser1', 'Test User 1', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1'),
  ('22222222-2222-2222-2222-222222222222', 'testuser2', 'Test User 2', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2'),
  ('33333333-3333-3333-3333-333333333333', 'testuser3', 'Test User 3', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3')
ON CONFLICT (id) DO NOTHING;

-- Now create events from these different users
INSERT INTO ludo_events (
  id,
  creator_id,
  title,
  description,
  max_players,
  event_date,
  start_time,
  end_time,
  location,
  is_online,
  is_public,
  requires_approval,
  frequency,
  selected_games,
  custom_games
) VALUES 
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    'User1 Event - Monopoly Night',
    'Join us for a fun Monopoly game night!',
    6,
    '2025-01-20',
    '18:00:00',
    '22:00:00',
    'Community Center',
    false,
    true,
    false,
    'single',
    '[{"id":"game1","title":"Monopoly"}]',
    '[]'
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    'User2 Event - Scrabble Tournament',
    'Weekly Scrabble tournament for word lovers!',
    4,
    '2025-01-22',
    '19:30:00',
    '21:30:00',
    'Library Meeting Room',
    false,
    true,
    false,
    'regular',
    '[{"id":"game2","title":"Scrabble"}]',
    '[]'
  ),
  (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    'User3 Event - Chess Club',
    'Monthly chess club meeting for all skill levels.',
    8,
    '2025-01-25',
    '17:00:00',
    '20:00:00',
    'Chess Club Headquarters',
    false,
    true,
    false,
    'recurring',
    '[{"id":"game3","title":"Chess"}]',
    '[]'
  );

-- Add some debug output
SELECT 'Events created successfully!' as status;
SELECT count(*) as total_events FROM ludo_events;
SELECT creator_id, title FROM ludo_events ORDER BY created_at;
