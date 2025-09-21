-- Adding comprehensive participation and approval system for ludo events
-- Enhanced ludo_event_participants table with approval workflow
ALTER TABLE ludo_event_participants 
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Update existing status column to support approval workflow
-- Status values: 'pending', 'approved', 'rejected', 'left'
ALTER TABLE ludo_event_participants 
ALTER COLUMN status SET DEFAULT 'pending';

-- Add approval_mode and visibility to ludo_events table
ALTER TABLE ludo_events 
ADD COLUMN IF NOT EXISTS approval_mode CHARACTER VARYING DEFAULT 'automatic',
ADD COLUMN IF NOT EXISTS visibility CHARACTER VARYING DEFAULT 'public';

-- Create ludo_event_invitations table for friends-only events
CREATE TABLE IF NOT EXISTS ludo_event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES ludo_events(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status CHARACTER VARYING DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, invitee_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ludo_event_participants_event_id ON ludo_event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_ludo_event_participants_user_id ON ludo_event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_ludo_event_participants_status ON ludo_event_participants(status);
CREATE INDEX IF NOT EXISTS idx_ludo_event_invitations_event_id ON ludo_event_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_ludo_event_invitations_invitee_id ON ludo_event_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_ludo_events_visibility ON ludo_events(visibility);
CREATE INDEX IF NOT EXISTS idx_ludo_events_creator_id ON ludo_events(creator_id);

-- RLS Policies for ludo_event_participants
ALTER TABLE ludo_event_participants ENABLE ROW LEVEL SECURITY;

-- Users can view participants of events they can see
CREATE POLICY "Users can view event participants" ON ludo_event_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ludo_events 
      WHERE ludo_events.id = ludo_event_participants.event_id 
      AND (
        ludo_events.visibility = 'public' 
        OR ludo_events.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM ludo_event_invitations 
          WHERE ludo_event_invitations.event_id = ludo_events.id 
          AND ludo_event_invitations.invitee_id = auth.uid()
        )
      )
    )
  );

-- Users can join events (create participation requests)
CREATE POLICY "Users can join events" ON ludo_event_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM ludo_events 
      WHERE ludo_events.id = ludo_event_participants.event_id 
      AND (
        ludo_events.visibility = 'public' 
        OR EXISTS (
          SELECT 1 FROM ludo_event_invitations 
          WHERE ludo_event_invitations.event_id = ludo_events.id 
          AND ludo_event_invitations.invitee_id = auth.uid()
        )
      )
    )
  );

-- Users can update their own participation or event creators can approve/reject
CREATE POLICY "Users can update participation" ON ludo_event_participants
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM ludo_events 
      WHERE ludo_events.id = ludo_event_participants.event_id 
      AND ludo_events.creator_id = auth.uid()
    )
  );

-- Users can delete their own participation
CREATE POLICY "Users can leave events" ON ludo_event_participants
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for ludo_event_invitations
ALTER TABLE ludo_event_invitations ENABLE ROW LEVEL SECURITY;

-- Event creators can manage invitations
CREATE POLICY "Event creators can manage invitations" ON ludo_event_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ludo_events 
      WHERE ludo_events.id = ludo_event_invitations.event_id 
      AND ludo_events.creator_id = auth.uid()
    )
  );

-- Invitees can view and respond to their invitations
CREATE POLICY "Users can view their invitations" ON ludo_event_invitations
  FOR SELECT USING (invitee_id = auth.uid());

CREATE POLICY "Users can respond to invitations" ON ludo_event_invitations
  FOR UPDATE USING (invitee_id = auth.uid());

-- Update ludo_events RLS to handle visibility
DROP POLICY IF EXISTS "Users can view public events" ON ludo_events;
CREATE POLICY "Users can view events based on visibility" ON ludo_events
  FOR SELECT USING (
    visibility = 'public' 
    OR creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM ludo_event_invitations 
      WHERE ludo_event_invitations.event_id = ludo_events.id 
      AND ludo_event_invitations.invitee_id = auth.uid()
    )
  );

-- Function to automatically approve participants for automatic approval mode
CREATE OR REPLACE FUNCTION auto_approve_participant()
RETURNS TRIGGER AS $$
BEGIN
  -- If the event has automatic approval, immediately approve the participant
  IF EXISTS (
    SELECT 1 FROM ludo_events 
    WHERE id = NEW.event_id 
    AND approval_mode = 'automatic'
  ) THEN
    NEW.status = 'approved';
    NEW.approved_at = NOW();
    NEW.approved_by = (SELECT creator_id FROM ludo_events WHERE id = NEW.event_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-approve participants
DROP TRIGGER IF EXISTS trigger_auto_approve_participant ON ludo_event_participants;
CREATE TRIGGER trigger_auto_approve_participant
  BEFORE INSERT ON ludo_event_participants
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_participant();

-- Function to update participant count
CREATE OR REPLACE FUNCTION update_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be used to maintain a participant count if needed
  -- For now, we'll calculate it dynamically in queries
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
