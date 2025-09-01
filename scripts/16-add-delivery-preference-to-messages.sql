-- Add delivery preference field to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS delivery_preference TEXT CHECK (delivery_preference IN ('pickup', 'shipping'));

-- Add index for delivery preference
CREATE INDEX IF NOT EXISTS idx_messages_delivery_preference ON public.messages(delivery_preference);
