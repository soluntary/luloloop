-- Creating events from multiple different users to demonstrate that the system correctly displays all public events
-- This will prove that the RLS policies and display logic work correctly

-- First, let's create some test users if they don't exist
INSERT INTO users (id, username, name, avatar, created_at) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'spielmeister', 'Max Spieler', 'https://api.dicebear.com/7.x/avataaars/svg?seed=spielmeister', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'boardgame_queen', 'Anna Brettspiel', 'https://api.dicebear.com/7.x/avataaars/svg?seed=boardgame_queen', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'dice_master', 'Tom Würfel', 'https://api.dicebear.com/7.x/avataaars/svg?seed=dice_master', NOW())
ON CONFLICT (id) DO NOTHING;

-- Now create diverse events from different users
INSERT INTO ludo_events (
  id, creator_id, title, description, max_players, event_date, start_time, end_time, 
  location, is_online, is_public, requires_approval, rules, selected_games, frequency, created_at
) VALUES 
  (
    'event-from-spielmeister-1', 
    '11111111-1111-1111-1111-111111111111',
    'Catan Turnier am Wochenende',
    'Großes Catan Turnier mit Preisen! Alle Erweiterungen erlaubt.',
    8,
    '2025-01-18',
    '14:00:00',
    '18:00:00',
    'Spielecafé München',
    false,
    true,
    false,
    'Bitte pünktlich erscheinen. Getränke und Snacks vorhanden.',
    '[{"id":"catan-id","title":"Die Siedler von Catan"}]',
    'single',
    NOW()
  ),
  (
    'event-from-boardgame-queen-1',
    '22222222-2222-2222-2222-222222222222', 
    'Wingspan & Flügelschlag Abend',
    'Entspannter Abend mit Wingspan und anderen Engine-Building Spielen.',
    6,
    '2025-01-20',
    '19:30:00',
    '23:00:00',
    'Brettspieltreff Berlin',
    false,
    true,
    true,
    'Anfänger willkommen! Wir erklären alle Spiele.',
    '[{"id":"wingspan-id","title":"Wingspan"},{"id":"splendor-id","title":"Splendor"}]',
    'regular',
    NOW()
  ),
  (
    'event-from-dice-master-1',
    '33333333-3333-3333-3333-333333333333',
    'Online Pen & Paper Session',
    'D&D 5e Oneshot für Einsteiger. Charaktere werden gestellt.',
    5,
    '2025-01-22', 
    '20:00:00',
    '24:00:00',
    'Discord Server',
    true,
    true,
    false,
    'Mikrofon erforderlich. Link wird vor dem Event verschickt.',
    '[{"id":"dnd-id","title":"Dungeons & Dragons"}]',
    'recurring',
    NOW()
  ),
  (
    'event-from-spielmeister-2',
    '11111111-1111-1111-1111-111111111111',
    'Azul & Abstrakte Spiele',
    'Abend mit abstrakten Strategiespielen wie Azul, Sagrada und mehr.',
    4,
    '2025-01-25',
    '18:00:00', 
    '22:00:00',
    'Spieletreff Hamburg',
    false,
    true,
    false,
    'Für strategische Denker geeignet.',
    '[{"id":"azul-id","title":"Azul"},{"id":"sagrada-id","title":"Sagrada"}]',
    'single',
    NOW()
  ),
  (
    'event-from-boardgame-queen-2',
    '22222222-2222-2222-2222-222222222222',
    'Familienspiele Nachmittag', 
    'Entspannter Nachmittag mit Familienspielen für alle Altersgruppen.',
    10,
    '2025-01-26',
    '15:00:00',
    '19:00:00',
    'Gemeindezentrum Köln',
    false,
    true,
    false,
    'Kinder ab 8 Jahren willkommen. Kaffee und Kuchen vorhanden.',
    '[{"id":"ticket-to-ride-id","title":"Zug um Zug"},{"id":"kingdomino-id","title":"Kingdomino"}]',
    'single',
    NOW()
  );

-- Add some participants to make the events look more realistic
INSERT INTO ludo_event_participants (event_id, user_id, status, joined_at) VALUES
  ('event-from-spielmeister-1', '5792b81e-9d84-4fa2-aa61-9fbacb601118', 'registered', NOW()),
  ('event-from-boardgame-queen-1', '5792b81e-9d84-4fa2-aa61-9fbacb601118', 'registered', NOW()),
  ('event-from-boardgame-queen-1', '11111111-1111-1111-1111-111111111111', 'registered', NOW()),
  ('event-from-dice-master-1', '22222222-2222-2222-2222-222222222222', 'registered', NOW())
ON CONFLICT (event_id, user_id) DO NOTHING;
