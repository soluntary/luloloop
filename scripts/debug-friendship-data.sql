-- Debug script to check friendship data
-- This will show us what's actually in the database

-- Check all friend requests
SELECT 
  fr.id,
  fr.from_user_id,
  fr.to_user_id,
  fr.status,
  fr.created_at,
  u1.name as from_user_name,
  u2.name as to_user_name
FROM friend_requests fr
LEFT JOIN users u1 ON fr.from_user_id = u1.id
LEFT JOIN users u2 ON fr.to_user_id = u2.id
ORDER BY fr.created_at DESC;

-- Check current user ID (should be c563e6ef-8a91-4268-8757-eccd068a7959 based on logs)
SELECT id, name, email FROM users WHERE id = 'c563e6ef-8a91-4268-8757-eccd068a7959';

-- Check specifically for incoming requests to current user
SELECT 
  fr.id,
  fr.from_user_id,
  fr.to_user_id,
  fr.status,
  fr.created_at,
  u1.name as from_user_name
FROM friend_requests fr
LEFT JOIN users u1 ON fr.from_user_id = u1.id
WHERE fr.to_user_id = 'c563e6ef-8a91-4268-8757-eccd068a7959'
  AND fr.status = 'pending'
ORDER BY fr.created_at DESC;

-- Check RLS policies on friend_requests table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'friend_requests';
