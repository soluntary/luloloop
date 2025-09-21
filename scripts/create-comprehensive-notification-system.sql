-- Create comprehensive notification preferences and tracking system

-- Social Activities Notifications
CREATE TABLE IF NOT EXISTS social_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Friend Activities
  friend_requests BOOLEAN DEFAULT true,
  friend_accepts BOOLEAN DEFAULT true,
  friend_posts BOOLEAN DEFAULT true,
  friend_game_activities BOOLEAN DEFAULT true,
  friend_joins_events BOOLEAN DEFAULT false,
  
  -- Community Activities  
  community_invitations BOOLEAN DEFAULT true,
  community_posts BOOLEAN DEFAULT false,
  community_member_joins BOOLEAN DEFAULT false,
  community_events BOOLEAN DEFAULT true,
  
  -- Forum Activities
  forum_replies BOOLEAN DEFAULT true,
  forum_mentions BOOLEAN DEFAULT true,
  forum_post_likes BOOLEAN DEFAULT false,
  forum_reply_likes BOOLEAN DEFAULT false,
  
  -- Game Activities
  game_reviews BOOLEAN DEFAULT true,
  game_ratings BOOLEAN DEFAULT false,
  shelf_access_requests BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing & General Notifications
CREATE TABLE IF NOT EXISTS marketing_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Platform Updates
  feature_announcements BOOLEAN DEFAULT true,
  platform_updates BOOLEAN DEFAULT false,
  maintenance_notices BOOLEAN DEFAULT true,
  
  -- Promotional Content
  game_recommendations BOOLEAN DEFAULT false,
  event_suggestions BOOLEAN DEFAULT false,
  community_suggestions BOOLEAN DEFAULT false,
  partner_offers BOOLEAN DEFAULT false,
  
  -- Newsletter & Digest
  weekly_digest BOOLEAN DEFAULT false,
  monthly_newsletter BOOLEAN DEFAULT false,
  trending_games BOOLEAN DEFAULT false,
  local_events_digest BOOLEAN DEFAULT false,
  
  -- Surveys & Feedback
  user_surveys BOOLEAN DEFAULT false,
  feedback_requests BOOLEAN DEFAULT false,
  beta_testing_invites BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery Method Preferences
CREATE TABLE IF NOT EXISTS delivery_method_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Email Settings
  email_enabled BOOLEAN DEFAULT true,
  email_frequency VARCHAR(20) DEFAULT 'immediate', -- immediate, hourly, daily, weekly
  email_digest_time TIME DEFAULT '09:00:00',
  email_quiet_hours_start TIME DEFAULT '22:00:00',
  email_quiet_hours_end TIME DEFAULT '08:00:00',
  email_weekend_enabled BOOLEAN DEFAULT true,
  
  -- Push Notifications (for future mobile app)
  push_enabled BOOLEAN DEFAULT false,
  push_sound_enabled BOOLEAN DEFAULT true,
  push_vibration_enabled BOOLEAN DEFAULT true,
  push_quiet_hours_start TIME DEFAULT '22:00:00',
  push_quiet_hours_end TIME DEFAULT '08:00:00',
  
  -- In-App Notifications
  in_app_enabled BOOLEAN DEFAULT true,
  in_app_sound_enabled BOOLEAN DEFAULT false,
  in_app_desktop_notifications BOOLEAN DEFAULT true,
  
  -- SMS (for critical notifications)
  sms_enabled BOOLEAN DEFAULT false,
  sms_phone_number VARCHAR(20),
  sms_critical_only BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy Settings
CREATE TABLE IF NOT EXISTS privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Profile Visibility
  profile_visibility VARCHAR(20) DEFAULT 'public', -- public, friends, private
  email_visibility VARCHAR(20) DEFAULT 'private', -- public, friends, private
  location_visibility VARCHAR(20) DEFAULT 'city', -- exact, city, region, private
  phone_visibility VARCHAR(20) DEFAULT 'private',
  
  -- Activity Visibility
  online_status_visible BOOLEAN DEFAULT true,
  last_seen_visible BOOLEAN DEFAULT false,
  game_activity_visible BOOLEAN DEFAULT true,
  event_participation_visible BOOLEAN DEFAULT true,
  
  -- Search & Discovery
  searchable_by_email BOOLEAN DEFAULT false,
  searchable_by_phone BOOLEAN DEFAULT false,
  appear_in_suggestions BOOLEAN DEFAULT true,
  allow_friend_requests BOOLEAN DEFAULT true,
  
  -- Data & Analytics
  allow_analytics BOOLEAN DEFAULT true,
  allow_personalization BOOLEAN DEFAULT true,
  allow_marketing_analysis BOOLEAN DEFAULT false,
  
  -- Communication
  allow_messages_from VARCHAR(20) DEFAULT 'friends', -- everyone, friends, none
  allow_event_invites_from VARCHAR(20) DEFAULT 'everyone', -- everyone, friends, none
  allow_community_invites BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Security Settings (extending existing)
CREATE TABLE IF NOT EXISTS security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Two-Factor Authentication
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_method VARCHAR(20) DEFAULT 'email', -- email, sms, app
  backup_codes_generated BOOLEAN DEFAULT false,
  
  -- Session Management
  auto_logout_minutes INTEGER DEFAULT 480, -- 8 hours
  require_password_for_sensitive BOOLEAN DEFAULT true,
  logout_all_devices_on_password_change BOOLEAN DEFAULT true,
  
  -- Login Security
  login_notifications BOOLEAN DEFAULT true,
  suspicious_activity_alerts BOOLEAN DEFAULT true,
  failed_login_lockout BOOLEAN DEFAULT true,
  max_failed_attempts INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 30,
  
  -- Device Management
  remember_devices BOOLEAN DEFAULT true,
  device_approval_required BOOLEAN DEFAULT false,
  max_remembered_devices INTEGER DEFAULT 10,
  
  -- Data Security
  data_export_notifications BOOLEAN DEFAULT true,
  account_deletion_confirmation BOOLEAN DEFAULT true,
  sensitive_data_access_log BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Queue for batch processing
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  
  -- Delivery tracking
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_opened BOOLEAN DEFAULT false,
  email_clicked BOOLEAN DEFAULT false,
  
  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMP WITH TIME ZONE,
  push_delivered BOOLEAN DEFAULT false,
  
  in_app_shown BOOLEAN DEFAULT false,
  in_app_read BOOLEAN DEFAULT false,
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  priority INTEGER DEFAULT 5, -- 1-10, higher = more important
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_notifications_user_id ON social_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_notifications_user_id ON marketing_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_preferences_user_id ON delivery_method_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_security_settings_user_id ON security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for) WHERE processed_at IS NULL;

-- Create RLS policies
ALTER TABLE social_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_method_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Users can only access their own settings
CREATE POLICY "Users can view own social notification preferences" ON social_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own social notification preferences" ON social_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own social notification preferences" ON social_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own marketing notification preferences" ON marketing_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own marketing notification preferences" ON marketing_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own marketing notification preferences" ON marketing_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own delivery preferences" ON delivery_method_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own delivery preferences" ON delivery_method_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own delivery preferences" ON delivery_method_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own privacy settings" ON privacy_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own privacy settings" ON privacy_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own privacy settings" ON privacy_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own security settings" ON security_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own security settings" ON security_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own security settings" ON security_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own notification queue" ON notification_queue
  FOR SELECT USING (auth.uid() = user_id);
