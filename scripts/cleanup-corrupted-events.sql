-- Remove events that were created with error messages as titles
DELETE FROM ludo_events 
WHERE title IN (
  'Überprüfe Anmeldestatus...',
  'Fehler beim Hochladen des Bildes. Bitte versuchen Sie es erneut',
  'Anmelden...',
  'Loading...',
  'Checking login status...'
);

-- Remove any orphaned participants for deleted events
DELETE FROM ludo_event_participants 
WHERE event_id NOT IN (SELECT id FROM ludo_events);

-- Remove any orphaned join requests for deleted events
DELETE FROM ludo_event_join_requests 
WHERE event_id NOT IN (SELECT id FROM ludo_events);
