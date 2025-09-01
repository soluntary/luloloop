-- Fix security definer issue with games_with_distance view
-- This ensures the view respects RLS policies of the querying user

ALTER VIEW public.games_with_distance SET (security_invoker = on);

-- Verify the change was applied
SELECT schemaname, viewname, viewowner, security_invoker 
FROM pg_views 
WHERE viewname = 'games_with_distance';
