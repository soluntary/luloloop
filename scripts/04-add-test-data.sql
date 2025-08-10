-- Add more realistic test users for community and friends testing
INSERT INTO users (id, email, name, avatar, bio, website, twitter, instagram, settings) VALUES
  ('550e8400-e29b-41d4-a716-446655440007', 'anna.mueller@example.com', 'Anna Müller', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna', 'Strategiespiel-Enthusiastin aus München. Liebe komplexe Eurogames!', 'https://annasgames.de', '@anna_games', 'anna_boardgames', '{"notifications": {"email": true, "push": true}, "privacy": {"profileVisible": true}}'),
  ('550e8400-e29b-41d4-a716-446655440008', 'max.schmidt@example.com', 'Max Schmidt', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max', 'D&D Dungeon Master seit 10 Jahren. Immer auf der Suche nach neuen Abenteuern!', null, '@max_dm', null, '{"notifications": {"email": true, "push": false}, "privacy": {"profileVisible": true}}'),
  ('550e8400-e29b-41d4-a716-446655440009', 'lisa.weber@example.com', 'Lisa Weber', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa', 'Familienspiele und Kooperative Spiele sind meine Leidenschaft. Mutter von zwei Kindern.', null, null, 'lisa_familygames', '{"notifications": {"email": true, "push": true}, "privacy": {"profileVisible": true}}'),
  ('550e8400-e29b-41d4-a716-446655440010', 'tom.fischer@example.com', 'Tom Fischer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom', 'Ameritrash-Fan und Miniaturenspiel-Sammler. Zombicide ist mein Lieblingsspiel!', 'https://tomsgaming.blog', '@tom_miniatures', null, '{"notifications": {"email": false, "push": true}, "privacy": {"profileVisible": true}}'),
  ('550e8400-e29b-41d4-a716-446655440011', 'sarah.klein@example.com', 'Sarah Klein', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 'Indie-Spiele und Prototypen testen ist mein Hobby. Immer offen für neue Ideen!', null, '@sarah_indie', 'sarah_prototypes', '{"notifications": {"email": true, "push": true}, "privacy": {"profileVisible": true}}'),
  ('550e8400-e29b-41d4-a716-446655440012', 'peter.wagner@example.com', 'Peter Wagner', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Peter', 'Veteran Gamer seit den 80ern. Kenne fast jedes Spiel und teile gerne mein Wissen.', 'https://retrogaming.de', null, null, '{"notifications": {"email": true, "push": false}, "privacy": {"profileVisible": true}}'),
  ('550e8400-e29b-41d4-a716-446655440013', 'julia.hoffmann@example.com', 'Julia Hoffmann', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia', 'Escape Room und Rätselspiel-Liebhaberin. Organisiere regelmäßig Spieleabende.', null, '@julia_puzzles', 'julia_escapes', '{"notifications": {"email": true, "push": true}, "privacy": {"profileVisible": true}}'),
  ('550e8400-e29b-41d4-a716-446655440014', 'michael.bauer@example.com', 'Michael Bauer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael', 'Wargaming und historische Simulationen. Suche Mitspieler für komplexe Strategiespiele.', 'https://wargaming-berlin.de', '@michael_wargames', null, '{"notifications": {"email": true, "push": false}, "privacy": {"profileVisible": true}}')
ON CONFLICT (email) DO NOTHING;

-- Add more diverse communities
INSERT INTO communities (id, creator_id, name, description, type, location, next_meeting, max_members, games, image, active) VALUES
  ('850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440007', 'München Eurogames Runde', 'Wir treffen uns jeden zweiten Samstag für anspruchsvolle Eurogames. Schwerpunkt auf Wirtschafts- und Aufbauspiele.', 'recurring', 'München Schwabing', '2024-01-20 15:00:00', 8, ARRAY['Brass Birmingham', 'Great Western Trail', 'Gaia Project'], '/placeholder.svg?height=200&width=300&text=München+Eurogames', true),
  ('850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440008', 'D&D Abenteuer Hamburg', 'Langzeit-Kampagne in den Forgotten Realms. Suchen noch 1-2 erfahrene Spieler für unsere Gruppe.', 'campaign', 'Hamburg Altona', '2024-01-18 19:00:00', 6, ARRAY['D&D 5E'], '/placeholder.svg?height=200&width=300&text=D%26D+Hamburg', true),
  ('850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440009', 'Familien Spieletreff Köln', 'Entspannte Spielerunde für Familien mit Kindern ab 6 Jahren. Jeden Sonntag im Gemeindezentrum.', 'family', 'Köln Ehrenfeld', '2024-01-21 14:00:00', 20, ARRAY['Ticket to Ride', 'Azul', 'Kingdomino', 'Just One'], '/placeholder.svg?height=200&width=300&text=Familie+Köln', true),
  ('850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440010', 'Zombicide Survivors Frankfurt', 'Wöchentliche Zombicide-Sessions mit allen Erweiterungen. Für Fans von Miniaturenspielen und Zombie-Horror.', 'recurring', 'Frankfurt Sachsenhausen', '2024-01-19 18:30:00', 6, ARRAY['Zombicide', 'Zombicide Black Plague', 'Massive Darkness'], '/placeholder.svg?height=200&width=300&text=Zombicide+Frankfurt', true),
  ('850e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440011', 'Indie Games Testgruppe', 'Wir testen neue und unveröffentlichte Spiele von Indie-Entwicklern. Feedback und Diskussion erwünscht!', 'casual', 'Berlin Kreuzberg', '2024-01-22 19:30:00', 10, ARRAY['Prototypen', 'Kickstarter Games'], '/placeholder.svg?height=200&width=300&text=Indie+Games', true),
  ('850e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440012', 'Retro Gaming Düsseldorf', 'Klassische Brettspiele aus den 70ern, 80ern und 90ern. Nostalgie pur mit erfahrenen Spielern.', 'recurring', 'Düsseldorf Altstadt', '2024-01-17 20:00:00', 12, ARRAY['Civilization', 'Dune', 'Cosmic Encounter', 'Republic of Rome'], '/placeholder.svg?height=200&width=300&text=Retro+Düsseldorf', true),
  ('850e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440013', 'Escape Room Brettspiele Stuttgart', 'Spezialisiert auf Escape Room Brettspiele und Rätselspiele. Perfekt für Knobel-Fans!', 'casual', 'Stuttgart Mitte', '2024-01-20 17:00:00', 8, ARRAY['Exit Games', 'Unlock!', 'Sherlock Holmes Consulting Detective'], '/placeholder.svg?height=200&width=300&text=Escape+Stuttgart', true),
  ('850e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440014', 'Wargaming Nürnberg', 'Historische Kriegsspiele und komplexe Simulationen. Für geduldige Strategen mit viel Zeit.', 'recurring', 'Nürnberg Südstadt', '2024-01-21 10:00:00', 6, ARRAY['Advanced Squad Leader', 'Combat Commander', 'Twilight Struggle'], '/placeholder.svg?height=200&width=300&text=Wargaming+Nürnberg', true)
ON CONFLICT (id) DO NOTHING;

-- Add community memberships
INSERT INTO community_members (id, community_id, user_id, role) VALUES
  -- München Eurogames Runde
  ('950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440007', 'creator'),
  ('950e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440008', 'member'),
  ('950e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440011', 'member'),
  
  -- D&D Abenteuer Hamburg
  ('950e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440008', 'creator'),
  ('950e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440012', 'member'),
  ('950e8400-e29b-41d4-a716-446655440006', '850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440014', 'member'),
  
  -- Familien Spieletreff Köln
  ('950e8400-e29b-41d4-a716-446655440007', '850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440009', 'creator'),
  ('950e8400-e29b-41d4-a716-446655440008', '850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440013', 'member'),
  ('950e8400-e29b-41d4-a716-446655440009', '850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007', 'member'),
  
  -- Zombicide Survivors Frankfurt
  ('950e8400-e29b-41d4-a716-446655440010', '850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440010', 'creator'),
  ('950e8400-e29b-41d4-a716-446655440011', '850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440014', 'member'),
  
  -- Indie Games Testgruppe
  ('950e8400-e29b-41d4-a716-446655440012', '850e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440011', 'creator'),
  ('950e8400-e29b-41d4-a716-446655440013', '850e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440007', 'member'),
  ('950e8400-e29b-41d4-a716-446655440014', '850e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440009', 'member'),
  
  -- Retro Gaming Düsseldorf
  ('950e8400-e29b-41d4-a716-446655440015', '850e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440012', 'creator'),
  ('950e8400-e29b-41d4-a716-446655440016', '850e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440008', 'member'),
  ('950e8400-e29b-41d4-a716-446655440017', '850e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440014', 'member'),
  
  -- Escape Room Brettspiele Stuttgart
  ('950e8400-e29b-41d4-a716-446655440018', '850e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440013', 'creator'),
  ('950e8400-e29b-41d4-a716-446655440019', '850e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011', 'member'),
  
  -- Wargaming Nürnberg
  ('950e8400-e29b-41d4-a716-446655440020', '850e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440014', 'creator'),
  ('950e8400-e29b-41d4-a716-446655440021', '850e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440012', 'member')
ON CONFLICT (id) DO NOTHING;

-- Add some friend requests and friendships (only between new users)
INSERT INTO friend_requests (id, from_user_id, to_user_id, message, status) VALUES
  ('960e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440008', 'Hi Max! Ich habe gesehen, dass du auch D&D spielst. Würde gerne mal zusammen spielen!', 'pending'),
  ('960e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440013', 'Hallo Julia! Deine Escape Room Gruppe klingt super interessant. Können wir uns vernetzen?', 'pending'),
  ('960e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011', 'Hey Sarah! Zombicide und Indie Games - wir haben ähnliche Interessen!', 'accepted'),
  ('960e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440014', 'Peter, als Wargaming-Fans sollten wir uns definitiv kennenlernen!', 'accepted')
ON CONFLICT (id) DO NOTHING;

-- Add accepted friendships to friends table (only between new users)
INSERT INTO friends (id, user_id, friend_id, status) VALUES
  ('970e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011', 'accepted'),
  ('970e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440010', 'accepted'),
  ('970e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440014', 'accepted'),
  ('970e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440012', 'accepted'),
  ('970e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440009', 'accepted'),
  ('970e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440007', 'accepted'),
  ('970e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440013', 'accepted'),
  ('970e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440008', 'accepted')
ON CONFLICT (id) DO NOTHING;

-- Add some games for the new users
INSERT INTO games (id, user_id, title, publisher, condition, players, duration, age, language, available, image) VALUES
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440007', 'Brass Birmingham', 'Roxley Games', 'Wie neu', '2-4', '60-120 min', '14+', 'Deutsch', ARRAY['lend', 'trade'], '/placeholder.svg?height=200&width=150&text=Brass+Birmingham'),
  ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440008', 'D&D Starter Set', 'Wizards of the Coast', 'Sehr gut', '3-6', '2-4 Stunden', '12+', 'Deutsch', ARRAY['lend'], '/placeholder.svg?height=200&width=150&text=D%26D+Starter'),
  ('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440009', 'Kingdomino', 'Blue Orange', 'Wie neu', '2-4', '15-20 min', '8+', 'Deutsch', ARRAY['lend', 'sell'], '/placeholder.svg?height=200&width=150&text=Kingdomino'),
  ('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440010', 'Zombicide Black Plague', 'CMON', 'Gut', '1-6', '60-180 min', '14+', 'Deutsch', ARRAY['lend'], '/placeholder.svg?height=200&width=150&text=Zombicide+BP'),
  ('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440011', 'Everdell', 'Starling Games', 'Wie neu', '1-4', '40-80 min', '13+', 'Deutsch', ARRAY['trade'], '/placeholder.svg?height=200&width=150&text=Everdell'),
  ('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440012', 'Civilization', 'Avalon Hill', 'Gut', '2-7', '180-480 min', '12+', 'Deutsch', ARRAY['lend', 'trade'], '/placeholder.svg?height=200&width=150&text=Civilization'),
  ('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440013', 'Exit: Die verlassene Hütte', 'Kosmos', 'Ungeöffnet', '1-4', '45-90 min', '12+', 'Deutsch', ARRAY['sell'], '/placeholder.svg?height=200&width=150&text=Exit+Hütte'),
  ('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440014', 'Advanced Squad Leader', 'Multi-Man Publishing', 'Sehr gut', '2', '120-480 min', '14+', 'Englisch', ARRAY['lend'], '/placeholder.svg?height=200&width=150&text=ASL')
ON CONFLICT (id) DO NOTHING;

-- Add some marketplace offers from new users
INSERT INTO marketplace_offers (id, user_id, game_id, title, publisher, condition, type, price, location, distance, description, image, active) VALUES
  ('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440005', 'Brass Birmingham', 'Roxley Games', 'Wie neu', 'lend', '8€/Woche', 'München Schwabing', '1.2 km', 'Eines der besten Strategiespiele aller Zeiten! Perfekt organisiert in Schaumstoff.', '/placeholder.svg?height=200&width=150&text=Brass+Birmingham', true),
  ('750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440007', 'Kingdomino', 'Blue Orange', 'Wie neu', 'sell', '15€', 'Köln Ehrenfeld', '0.8 km', 'Tolles Familienspiel, nur zweimal gespielt. Perfekt für Einsteiger!', '/placeholder.svg?height=200&width=150&text=Kingdomino', true),
  ('750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440009', 'Everdell', 'Starling Games', 'Wie neu', 'trade', 'Tausch gegen anderes Engine-Building Spiel', 'Berlin Kreuzberg', '2.1 km', 'Wunderschönes Spiel mit tollen Komponenten. Suche ähnlich komplexe Spiele.', '/placeholder.svg?height=200&width=150&text=Everdell', true),
  ('750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440013', '650e8400-e29b-41d4-a716-446655440011', 'Exit: Die verlassene Hütte', 'Kosmos', 'Ungeöffnet', 'sell', '8€', 'Stuttgart Mitte', '0.5 km', 'Noch originalverpackt! Perfekt für Escape Room Fans.', '/placeholder.svg?height=200&width=150&text=Exit+Hütte', true)
ON CONFLICT (id) DO NOTHING;

-- Add some messages between users
INSERT INTO messages (id, from_user_id, to_user_id, game_title, game_id, offer_type, message, game_image, read) VALUES
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440007', 'Brass Birmingham', '650e8400-e29b-41d4-a716-446655440005', 'lend', 'Hi Anna! Ich würde gerne dein Brass Birmingham ausleihen. Wann wäre das möglich? Ich bin sehr erfahren mit komplexen Spielen.', '/placeholder.svg?height=200&width=150&text=Brass+Birmingham', false),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011', 'Everdell', '650e8400-e29b-41d4-a716-446655440009', 'trade', 'Hey Sarah! Ich hätte Zombicide Black Plague zum Tausch gegen dein Everdell. Interesse?', '/placeholder.svg?height=200&width=150&text=Everdell', false),
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440013', 'Exit: Die verlassene Hütte', '650e8400-e29b-41d4-a716-446655440011', 'sell', 'Hallo Julia! Ist das Exit Spiel noch verfügbar? Würde es gerne für unseren nächsten Spieleabend kaufen.', '/placeholder.svg?height=200&width=150&text=Exit+Hütte', false)
ON CONFLICT (id) DO NOTHING;
