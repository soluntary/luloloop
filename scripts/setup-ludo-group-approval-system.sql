-- Add approval mode support to communities and create join requests table

-- Add approval_mode column to communities table
ALTER TABLE communities 
ADD COLUMN IF NOT EXISTS approval_mode character varying DEFAULT 'automatic';

-- Add check constraint for approval_mode values
ALTER TABLE communities 
ADD CONSTRAINT communities_approval_mode_check 
CHECK (approval_mode IN ('automatic', 'manual'));

-- Create community_join_requests table for managing join requests
CREATE TABLE IF NOT EXISTS community_join_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status character varying NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamp with time zone,
  
  -- Ensure unique join requests per user per community
  UNIQUE(community_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_join_requests_community_id ON community_join_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_user_id ON community_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_status ON community_join_requests(status);

-- Enable RLS on community_join_requests table
ALTER TABLE community_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own join requests
CREATE POLICY "Users can view their own join requests" ON community_join_requests
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policy: Users can create join requests for themselves
CREATE POLICY "Users can create join requests" ON community_join_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policy: Community creators can view join requests for their communities
CREATE POLICY "Community creators can view join requests" ON community_join_requests
  FOR SELECT USING (
    community_id IN (
      SELECT id FROM communities WHERE creator_id = auth.uid()
    )
  );

-- RLS Policy: Community creators can update join requests for their communities
CREATE POLICY "Community creators can update join requests" ON community_join_requests
  FOR UPDATE USING (
    community_id IN (
      SELECT id FROM communities WHERE creator_id = auth.uid()
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_join_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_community_join_requests_updated_at ON community_join_requests;
CREATE TRIGGER update_community_join_requests_updated_at
  BEFORE UPDATE ON community_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_community_join_requests_updated_at();

-- Create function to handle approved join requests
CREATE OR REPLACE FUNCTION handle_approved_join_request()
RETURNS TRIGGER AS $$
BEGIN
  -- If join request is approved, add user to community_members
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO community_members (community_id, user_id, role)
    VALUES (NEW.community_id, NEW.user_id, 'member')
    ON CONFLICT (community_id, user_id) DO NOTHING;
    
    -- Set reviewed_at timestamp
    NEW.reviewed_at = now();
    NEW.reviewed_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for handling approved join requests
DROP TRIGGER IF EXISTS handle_approved_join_request ON community_join_requests;
CREATE TRIGGER handle_approved_join_request
  BEFORE UPDATE ON community_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_approved_join_request();

-- Update existing communities to have default approval_mode
UPDATE communities 
SET approval_mode = 'automatic' 
WHERE approval_mode IS NULL;
