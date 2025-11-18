-- Script to toggle search ad active status
-- This bypasses RLS and is executed with service role
-- Parameters: ad_id, user_id, new_active_value

UPDATE search_ads
SET active = :new_active_value
WHERE id = :ad_id AND user_id = :user_id;
