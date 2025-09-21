-- Add RLS policy to allow all authenticated users to read public events
CREATE POLICY "Allow authenticated users to read public events" 
ON ludo_events 
FOR SELECT 
USING (
  is_public = true 
  AND auth.uid() IS NOT NULL
);

-- Also allow users to read their own events (both public and private)
CREATE POLICY "Allow users to read their own events" 
ON ludo_events 
FOR SELECT 
USING (auth.uid() = creator_id);
