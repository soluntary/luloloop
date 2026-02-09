-- Enable Realtime on the messages table
-- This ensures INSERT/UPDATE/DELETE events are broadcast via Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
