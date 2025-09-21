-- Creating the missing ludo_event_invitations and ludo_event_join_requests tables
CREATE TABLE IF NOT EXISTS public.ludo_event_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.ludo_events(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, invitee_id)
);

CREATE TABLE IF NOT EXISTS public.ludo_event_join_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.ludo_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.users(id),
    UNIQUE(event_id, user_id)
);

-- Adding missing columns to ludo_events table for approval system
ALTER TABLE public.ludo_events 
ADD COLUMN IF NOT EXISTS approval_mode VARCHAR(20) DEFAULT 'automatic' CHECK (approval_mode IN ('automatic', 'manual')),
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'friends_only', 'private'));

-- Creating RLS policies for the new tables
ALTER TABLE public.ludo_event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ludo_event_join_requests ENABLE ROW LEVEL SECURITY;

-- Policies for ludo_event_invitations
CREATE POLICY "Users can view their own invitations" ON public.ludo_event_invitations
    FOR SELECT USING (invitee_id = auth.uid() OR inviter_id = auth.uid());

CREATE POLICY "Users can create invitations for their events" ON public.ludo_event_invitations
    FOR INSERT WITH CHECK (
        inviter_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM public.ludo_events WHERE id = event_id AND creator_id = auth.uid())
    );

CREATE POLICY "Users can update their own invitations" ON public.ludo_event_invitations
    FOR UPDATE USING (invitee_id = auth.uid() OR inviter_id = auth.uid());

-- Policies for ludo_event_join_requests
CREATE POLICY "Users can view join requests for their events or their own requests" ON public.ludo_event_join_requests
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.ludo_events WHERE id = event_id AND creator_id = auth.uid())
    );

CREATE POLICY "Authenticated users can create join requests" ON public.ludo_event_join_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Event creators can update join requests" ON public.ludo_event_join_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.ludo_events WHERE id = event_id AND creator_id = auth.uid())
    );

-- Creating indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ludo_event_invitations_invitee ON public.ludo_event_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_ludo_event_invitations_event ON public.ludo_event_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_ludo_event_join_requests_user ON public.ludo_event_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ludo_event_join_requests_event ON public.ludo_event_join_requests(event_id);
