-- Create table for individual instances of recurring events
CREATE TABLE IF NOT EXISTS ludo_event_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES ludo_events(id) ON DELETE CASCADE,
  instance_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  max_participants INTEGER,
  status VARCHAR(20) DEFAULT 'active', -- active, cancelled, completed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, instance_date)
);

-- Create table for participants in specific event instances
CREATE TABLE IF NOT EXISTS ludo_event_instance_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES ludo_event_instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'registered', -- registered, attended, cancelled
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instance_id, user_id)
);

-- Enable RLS
ALTER TABLE ludo_event_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ludo_event_instance_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for ludo_event_instances
CREATE POLICY "Users can view event instances" ON ludo_event_instances
  FOR SELECT USING (true);

CREATE POLICY "Event creators can manage instances" ON ludo_event_instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ludo_events 
      WHERE ludo_events.id = ludo_event_instances.event_id 
      AND ludo_events.creator_id = auth.uid()
    )
  );

-- RLS policies for ludo_event_instance_participants
CREATE POLICY "Users can view instance participants" ON ludo_event_instance_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own instance participation" ON ludo_event_instance_participants
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Event creators can manage instance participants" ON ludo_event_instance_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ludo_event_instances lei
      JOIN ludo_events le ON lei.event_id = le.id
      WHERE lei.id = ludo_event_instance_participants.instance_id 
      AND le.creator_id = auth.uid()
    )
  );
