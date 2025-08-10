-- Insert sample users (for development/demo)
INSERT INTO users (id, email, name, avatar, bio) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'spielefan@example.com', 'SpieleFan42', 'https://api.dicebear.com/7.x/avataaars/svg?seed=SpieleFan42', 'Leidenschaftlicher Brettspieler aus Berlin'),
  ('550e8400-e29b-41d4-a716-446655440002', 'boardgame@example.com', 'BoardGameLover', 'https://api.dicebear.com/7.x/avataaars/svg?seed=BoardGameLover', 'Sammle und spiele seit 15 Jahren Brettspiele'),
  ('550e8400-e29b-41d4-a716-446655440003', 'mars@example.com', 'MarsExplorer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=MarsExplorer', 'Strategiespiel-Fan mit Fokus auf Sci-Fi Themen'),
  ('550e8400-e29b-41d4-a716-446655440004', 'island@example.com', 'IslandGuardian', 'https://api.dicebear.com/7.x/avataaars/svg?seed=IslandGuardian', 'Kooperative Spiele sind meine Leidenschaft'),
  ('550e8400-e29b-41d4-a716-446655440005', 'catan@example.com', 'CatanMeister', 'https://api.dicebear.com/7.x/avataaars/svg?seed=CatanMeister', 'Catan-Experte und Eurogame-Liebhaber'),
  ('550e8400-e29b-41d4-a716-446655440006', 'fliesen@example.com', 'FliesenKönig', 'https://api.dicebear.com/7.x/avataaars/svg?seed=FliesenKönig', 'Abstrakte Spiele und Puzzles sind mein Ding')
ON CONFLICT (email) DO NOTHING;

-- Insert sample games
INSERT INTO games (id, user_id, title, publisher, description, condition, players, duration, age, language, available, image, category, min_players, max_players, play_time, age_rating) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Gloomhaven', 'Cephalofair Games', 'Ein abenteuerreiches Dungeon-Crawler Spiel', 'Wie neu', '1-4', '60-120 min', '14+', 'Deutsch', ARRAY['lend'], '/placeholder.svg?height=200&width=150&text=Gloomhaven', 'Strategie', 1, 4, 120, '14+'),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Pandemic Legacy', 'Z-Man Games', 'Ein Legacy-Spiel mit spannenden Wendepunkten', 'Gut', '2-4', '60 min', '13+', 'Deutsch', ARRAY['trade'], '/images/pandemic-legacy.png', 'Familienspiel', 2, 4, 60, '13+'),
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Terraforming Mars', 'Stronghold Games', 'Ein Strategiespiel über die Kolonisation von Mars', 'Sehr gut', '1-5', '90-120 min', '12+', 'Deutsch', ARRAY['sell'], '/placeholder.svg?height=200&width=150&text=Terraforming+Mars', 'Strategie', 1, 5, 90, '12+'),
  ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'Spirit Island', 'Greater Than Games', 'Ein kooperativer Strategiespiel auf der Suche nach Mystik', 'Wie neu', '1-4', '90-120 min', '13+', 'Deutsch', ARRAY['lend'], '/placeholder.svg?height=200&width=150&text=Spirit+Island', 'Familienspiel', 1, 4, 90, '13+'),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Catan', 'Kosmos', 'Ein strategisches Brettspiel um Handel und Aufbau', 'Sehr gut', '3-4', '60-90 Min', '10+', 'Deutsch', ARRAY['lend', 'trade'], '/placeholder.svg?height=200&width=200&text=Catan', 'Strategie', 3, 4, 75, '10+'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Azul', 'Plan B Games', 'Wunderschönes Legespiel mit Fliesen', 'Wie neu', '2-4', '30-45 Min', '8+', 'Deutsch', ARRAY['lend', 'sell'], '/placeholder.svg?height=200&width=200&text=Azul', 'Familienspiel', 2, 4, 40, '8+'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Wingspan', 'Stonemaier Games', 'Engine-Building Spiel über Vögel', 'Gut', '1-5', '40-70 Min', '10+', 'Deutsch', ARRAY['trade'], '/placeholder.svg?height=200&width=200&text=Wingspan', 'Strategie', 1, 5, 55, '10+')
ON CONFLICT (id) DO NOTHING;

-- Insert sample marketplace offers
INSERT INTO marketplace_offers (id, user_id, game_id, title, publisher, condition, type, price, location, distance, description, image, active) VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Gloomhaven', 'Cephalofair Games', 'Wie neu', 'lend', '5€/Woche', 'Berlin Mitte', '2.3 km', 'Komplettes Spiel mit allen Komponenten. Perfekt für Dungeon-Crawler Fans!', '/placeholder.svg?height=200&width=150&text=Gloomhaven', true),
  ('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'Pandemic Legacy', 'Z-Man Games', 'Gut', 'trade', 'Tausch gegen Strategiespiel', 'Berlin Kreuzberg', '4.1 km', 'Bereits gespielt, aber noch viele Überraschungen ungeöffnet.', '/images/pandemic-legacy.png', true),
  ('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'Terraforming Mars', 'Stronghold Games', 'Sehr gut', 'sell', '45€', 'Berlin Prenzlauer Berg', '3.7 km', 'Wenig gespielt, alle Karten in Hüllen.', '/placeholder.svg?height=200&width=150&text=Terraforming+Mars', true),
  ('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', 'Spirit Island', 'Greater Than Games', 'Wie neu', 'lend', '6€/Woche', 'Berlin Charlottenburg', '5.2 km', 'Kooperatives Strategiespiel in perfektem Zustand.', '/placeholder.svg?height=200&width=150&text=Spirit+Island', true),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Catan', 'Kosmos', 'Sehr gut', 'lend', NULL, 'Berlin Mitte', '2 km', 'Klassisches Catan in sehr gutem Zustand. Alle Teile vollständig.', '/placeholder.svg?height=200&width=200&text=Catan', true),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'Azul', 'Plan B Games', 'Wie neu', 'sell', '25€', 'Berlin Kreuzberg', '5 km', 'Azul in perfektem Zustand, nur einmal gespielt.', '/placeholder.svg?height=200&width=200&text=Azul', true),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 'Wingspan', 'Stonemaier Games', 'Gut', 'trade', NULL, 'Berlin Prenzlauer Berg', '3 km', 'Suche Tausch gegen andere Engine-Building Spiele.', '/placeholder.svg?height=200&width=200&text=Wingspan', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample messages
INSERT INTO messages (id, from_user_id, to_user_id, game_title, game_id, offer_type, message, game_image, read) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Catan', '550e8400-e29b-41d4-a716-446655440001', 'lend', 'Hallo! Ich würde gerne dein Catan ausleihen. Wann wäre das möglich?', '/placeholder.svg?height=200&width=200&text=Catan', false),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Azul', '550e8400-e29b-41d4-a716-446655440002', 'sell', 'Ist Azul noch verfügbar? Würde es gerne kaufen.', '/placeholder.svg?height=200&width=200&text=Azul', false)
ON CONFLICT (id) DO NOTHING;

-- Insert sample communities
INSERT INTO communities (id, creator_id, name, description, type, location, next_meeting, max_members, games, image, active) VALUES
  ('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Strategiespiel-Runde Berlin', 'Wir treffen uns jeden Donnerstag für komplexe Strategiespiele. Neue Mitglieder willkommen!', 'recurring', 'Berlin Mitte', 'Donnerstag, 19:00', 15, ARRAY['Terraforming Mars', 'Wingspan', 'Scythe'], '/placeholder.svg?height=200&width=300&text=Strategiespiele', true),
  ('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Familienspiele am Wochenende', 'Entspannte Spielrunde für Familien mit Kindern ab 8 Jahren.', 'family', 'Berlin Kreuzberg', 'Samstag, 14:00', 12, ARRAY['Azul', 'Ticket to Ride', 'Splendor'], '/placeholder.svg?height=200&width=300&text=Familienspiele', true),
  ('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Gloomhaven Kampagne', 'Suchen noch 1-2 Spieler für unsere laufende Gloomhaven Kampagne.', 'campaign', 'Berlin Prenzlauer Berg', 'Freitag, 18:30', 4, ARRAY['Gloomhaven'], '/placeholder.svg?height=200&width=300&text=Gloomhaven', true),
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Berlin Brettspiel Runde', 'Wöchentliche Spielerunde für alle Brettspiel-Fans in Berlin', 'recurring', 'Berlin Mitte', 'Jeden Donnerstag 19:00', 8, ARRAY['Catan', 'Ticket to Ride', 'Azul'], '/placeholder.svg?height=200&width=200&text=Berlin+Brettspiel', true),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Familien Spieleabend', 'Entspannte Runde für die ganze Familie', 'family', 'Berlin Charlottenburg', 'Samstag 15:00', 6, ARRAY['Ticket to Ride', 'Azul'], '/placeholder.svg?height=200&width=200&text=Familie+Spiele', true),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'D&D Kampagne: Drachen von Faerûn', 'Langzeit D&D Kampagne für erfahrene Spieler', 'campaign', 'Berlin Friedrichshain', 'Jeden 2. Sonntag 14:00', 5, ARRAY['D&D 5E'], '/placeholder.svg?height=200&width=200&text=D%26D+Kampagne', true),
  ('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Berlin Brettspiel Runde', 'Wöchentliche Spielrunde für Strategiespiele', 'recurring', 'Berlin Mitte', 'Jeden Donnerstag 19:00', 8, ARRAY['Catan', 'Azul', 'Wingspan', 'Scythe'], '/placeholder.svg?height=200&width=200&text=Berlin+Brettspiel+Runde', true),
  ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Familien Spieleabend', 'Entspannte Runde für Familien mit Kindern', 'family', 'Berlin Kreuzberg', 'Samstag 15:00', 12, ARRAY['Azul', 'Ticket to Ride', 'Splendor'], '/placeholder.svg?height=200&width=200&text=Familien+Spieleabend', true),
  ('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'D&D Kampagne: Drachen von Faerûn', 'Langzeit D&D Kampagne für erfahrene Spieler', 'campaign', 'Berlin Prenzlauer Berg', 'Jeden 2. Sonntag 14:00', 6, ARRAY['D&D 5E', 'Pathfinder'], '/placeholder.svg?height=200&width=200&text=D%26D+Kampagne', true)
ON CONFLICT (id) DO NOTHING;

-- Optional community insertion for testing
INSERT INTO public.communities (id, creator_id, name, description, location, game_focus, meeting_frequency, image) VALUES
(
    uuid_generate_v4(),
    (SELECT id FROM public.users LIMIT 1), -- This will only work if there's at least one user
    'Berlin Brettspiel Runde',
    'Wöchentliche Spielerunde für alle Brettspiel-Fans in Berlin',
    'Berlin Mitte',
    'Strategiespiele',
    'Wöchentlich',
    '/placeholder.svg?height=200&width=300&text=Berlin+Brettspiel'
)
ON CONFLICT DO NOTHING;

-- Insert sample community members
INSERT INTO community_members (id, community_id, user_id, role) VALUES
  ('850e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'creator'),
  ('850e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'creator'),
  ('850e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'creator'),
  ('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'creator'),
  ('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'creator'),
  ('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'creator')
ON CONFLICT (id) DO NOTHING;

-- Note: Most data will be created through the app interface
-- This seed file is mainly for initial setup and testing
