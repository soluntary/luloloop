-- Add event_reminders column to social_notification_preferences table
ALTER TABLE social_notification_preferences
ADD COLUMN IF NOT EXISTS event_reminders boolean DEFAULT true;

-- Create table to track sent event reminders to avoid duplicates
CREATE TABLE IF NOT EXISTS event_reminders_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES ludo_event_instances(id) ON DELETE CASCADE,
  reminder_type varchar(50) NOT NULL, -- '1_hour', '1_day', '1_week'
  sent_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, instance_id, reminder_type)
);

-- Enable RLS on event_reminders_sent table
ALTER TABLE event_reminders_sent ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own sent reminders
CREATE POLICY "Users can view their own sent reminders"
ON event_reminders_sent
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for system to insert sent reminders
CREATE POLICY "System can insert sent reminders"
ON event_reminders_sent
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_reminders_sent_user_instance 
ON event_reminders_sent(user_id, instance_id);

CREATE INDEX IF NOT EXISTS idx_event_reminders_sent_sent_at 
ON event_reminders_sent(sent_at);
