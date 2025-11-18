-- Script to toggle marketplace offer active status
-- This bypasses RLS and is executed with service role
-- Parameters: offer_id, user_id, new_active_value

UPDATE marketplace_offers
SET active = :new_active_value
WHERE id = :offer_id AND user_id = :user_id;
