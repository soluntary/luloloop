-- Add new message types to the check constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_offer_type_check;

ALTER TABLE messages ADD CONSTRAINT messages_offer_type_check 
CHECK (offer_type IN (
  'buy', 'sell', 'rent', 'trade', 'borrow', 'lend', 
  'group_inquiry', 'event_inquiry', 'general'
));
