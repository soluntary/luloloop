-- Create message notification preferences table
CREATE TABLE IF NOT EXISTS public.message_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Email notifications for different message types
    direct_messages BOOLEAN DEFAULT true,
    game_inquiries BOOLEAN DEFAULT true,
    event_inquiries BOOLEAN DEFAULT true,
    group_inquiries BOOLEAN DEFAULT true,
    marketplace_messages BOOLEAN DEFAULT true,
    
    -- Notification frequency settings
    instant_notifications BOOLEAN DEFAULT true,
    daily_digest BOOLEAN DEFAULT false,
    weekly_digest BOOLEAN DEFAULT false,
    
    -- Quiet hours (no notifications during these times)
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    
    -- Weekend notifications
    weekend_notifications BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create message notification log table to track sent notifications
CREATE TABLE IF NOT EXISTS public.message_notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('instant', 'digest')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_sent BOOLEAN DEFAULT false,
    email_error TEXT,
    
    UNIQUE(message_id, notification_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_notification_preferences_user_id ON public.message_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_message_notification_log_user_id ON public.message_notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_message_notification_log_sent_at ON public.message_notification_log(sent_at);

-- Enable Row Level Security
ALTER TABLE public.message_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_notification_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for message notification preferences
CREATE POLICY "Users can view their own notification preferences" ON public.message_notification_preferences
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own notification preferences" ON public.message_notification_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notification preferences" ON public.message_notification_preferences
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for message notification log
CREATE POLICY "Users can view their own notification log" ON public.message_notification_log
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Create trigger for updated_at on message notification preferences
DROP TRIGGER IF EXISTS update_message_notification_preferences_updated_at ON public.message_notification_preferences;
CREATE TRIGGER update_message_notification_preferences_updated_at 
    BEFORE UPDATE ON public.message_notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user should receive notification based on preferences and quiet hours
CREATE OR REPLACE FUNCTION should_send_message_notification(
    p_user_id UUID,
    p_message_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    prefs RECORD;
    current_time TIME;
    current_day INTEGER;
BEGIN
    -- Get user preferences
    SELECT * INTO prefs 
    FROM public.message_notification_preferences 
    WHERE user_id = p_user_id;
    
    -- If no preferences found, use defaults (send notification)
    IF NOT FOUND THEN
        RETURN true;
    END IF;
    
    -- Check if instant notifications are disabled
    IF NOT prefs.instant_notifications THEN
        RETURN false;
    END IF;
    
    -- Check message type preferences
    CASE p_message_type
        WHEN 'general' THEN
            IF NOT prefs.direct_messages THEN RETURN false; END IF;
        WHEN 'lend', 'trade', 'sell', 'search_buy', 'search_rent', 'search_trade' THEN
            IF NOT prefs.marketplace_messages THEN RETURN false; END IF;
        WHEN 'event_inquiry' THEN
            IF NOT prefs.event_inquiries THEN RETURN false; END IF;
        WHEN 'group_inquiry' THEN
            IF NOT prefs.group_inquiries THEN RETURN false; END IF;
        ELSE
            IF NOT prefs.game_inquiries THEN RETURN false; END IF;
    END CASE;
    
    -- Check weekend notifications
    current_day := EXTRACT(DOW FROM NOW()); -- 0=Sunday, 6=Saturday
    IF (current_day = 0 OR current_day = 6) AND NOT prefs.weekend_notifications THEN
        RETURN false;
    END IF;
    
    -- Check quiet hours
    IF prefs.quiet_hours_enabled THEN
        current_time := NOW()::TIME;
        
        -- Handle quiet hours that span midnight
        IF prefs.quiet_hours_start > prefs.quiet_hours_end THEN
            -- Quiet hours span midnight (e.g., 22:00 to 08:00)
            IF current_time >= prefs.quiet_hours_start OR current_time <= prefs.quiet_hours_end THEN
                RETURN false;
            END IF;
        ELSE
            -- Normal quiet hours (e.g., 13:00 to 14:00)
            IF current_time >= prefs.quiet_hours_start AND current_time <= prefs.quiet_hours_end THEN
                RETURN false;
            END IF;
        END IF;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger message notification
CREATE OR REPLACE FUNCTION trigger_message_notification() RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    recipient_email TEXT;
    should_notify BOOLEAN;
BEGIN
    -- Only trigger for new messages
    IF TG_OP = 'INSERT' THEN
        -- Get sender name and recipient email
        SELECT u1.name, u2.email INTO sender_name, recipient_email
        FROM public.users u1, public.users u2
        WHERE u1.id = NEW.from_user_id AND u2.id = NEW.to_user_id;
        
        -- Check if notification should be sent
        SELECT should_send_message_notification(NEW.to_user_id, NEW.offer_type) INTO should_notify;
        
        IF should_notify THEN
            -- Insert notification log entry
            INSERT INTO public.message_notification_log (
                user_id, 
                message_id, 
                notification_type,
                email_sent
            ) VALUES (
                NEW.to_user_id,
                NEW.id,
                'instant',
                false
            );
            
            -- Here you would typically call an external service to send the email
            -- For now, we'll just log that a notification should be sent
            RAISE NOTICE 'Message notification should be sent to % (%) from %', recipient_email, NEW.to_user_id, sender_name;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on messages table to automatically send notifications
DROP TRIGGER IF EXISTS message_notification_trigger ON public.messages;
CREATE TRIGGER message_notification_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_message_notification();

-- Insert default preferences for existing users
INSERT INTO public.message_notification_preferences (user_id)
SELECT id FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.message_notification_preferences)
ON CONFLICT (user_id) DO NOTHING;
