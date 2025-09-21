-- Create security events table to track security-related activities
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'login_attempt', 'password_change', 'email_change', 'suspicious_activity', etc.
  event_data JSONB DEFAULT '{}', -- Additional event details (IP, device, location, etc.)
  ip_address INET,
  user_agent TEXT,
  location TEXT,
  device_info TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security notification preferences table
CREATE TABLE IF NOT EXISTS security_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  login_attempts BOOLEAN DEFAULT true,
  password_changes BOOLEAN DEFAULT true,
  email_changes BOOLEAN DEFAULT true,
  suspicious_activity BOOLEAN DEFAULT true,
  new_device_login BOOLEAN DEFAULT true,
  account_recovery BOOLEAN DEFAULT true,
  security_settings_changes BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on both tables
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_events
CREATE POLICY "Users can view their own security events" ON security_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert security events" ON security_events
  FOR INSERT WITH CHECK (true); -- Allow system to insert events

-- RLS policies for security_notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON security_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON security_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON security_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);

-- Function to automatically create default security notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_security_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO security_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to create default security preferences on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_security_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_security_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_security_preferences();

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_device_info TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO security_events (
    user_id, event_type, event_data, ip_address, 
    user_agent, location, device_info, success
  )
  VALUES (
    p_user_id, p_event_type, p_event_data, p_ip_address,
    p_user_agent, p_location, p_device_info, p_success
  )
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;
