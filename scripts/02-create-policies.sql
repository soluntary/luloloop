-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;

DROP POLICY IF EXISTS "Anyone can view games" ON public.games;
DROP POLICY IF EXISTS "Users can insert own games" ON public.games;
DROP POLICY IF EXISTS "Users can update own games" ON public.games;
DROP POLICY IF EXISTS "Users can delete own games" ON public.games;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.games;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.games;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.games;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.games;

DROP POLICY IF EXISTS "Anyone can view marketplace offers" ON public.marketplace_offers;
DROP POLICY IF EXISTS "Users can insert own offers" ON public.marketplace_offers;
DROP POLICY IF EXISTS "Users can update own offers" ON public.marketplace_offers;
DROP POLICY IF EXISTS "Users can delete own offers" ON public.marketplace_offers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.marketplace_offers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.marketplace_offers;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.marketplace_offers;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.marketplace_offers;

DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own received messages" ON public.messages;

DROP POLICY IF EXISTS "Users can view their friends" ON public.friends;
DROP POLICY IF EXISTS "Users can insert friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can delete friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can create friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friends;

DROP POLICY IF EXISTS "Users can view friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can insert friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can view own friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update received friend requests" ON public.friend_requests;

DROP POLICY IF EXISTS "Anyone can view communities" ON public.communities;
DROP POLICY IF EXISTS "Users can insert communities" ON public.communities;
DROP POLICY IF EXISTS "Users can update own communities" ON public.communities;
DROP POLICY IF EXISTS "Users can delete own communities" ON public.communities;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.communities;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.communities;
DROP POLICY IF EXISTS "Community creators can update their communities" ON public.communities;
DROP POLICY IF EXISTS "Community creators can delete their communities" ON public.communities;

DROP POLICY IF EXISTS "Anyone can view community members" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can view all community memberships" ON public.community_members;

-- Create policies for users table
CREATE POLICY "Allow public read access" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Allow users to update their own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for games table
CREATE POLICY "Allow public read access" ON public.games
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert their own games" ON public.games
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Allow users to update their own games" ON public.games
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Allow users to delete their own games" ON public.games
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create policies for marketplace_offers table
CREATE POLICY "Allow public read access" ON public.marketplace_offers
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert their own offers" ON public.marketplace_offers
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Allow users to update their own offers" ON public.marketplace_offers
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Allow users to delete their own offers" ON public.marketplace_offers
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create policies for messages table
CREATE POLICY "Allow users to view their own messages" ON public.messages
    FOR SELECT USING (auth.uid()::text = from_user_id::text OR auth.uid()::text = to_user_id::text);

CREATE POLICY "Allow authenticated users to send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid()::text = from_user_id::text);

CREATE POLICY "Allow users to update received messages" ON public.messages
    FOR UPDATE USING (auth.uid()::text = to_user_id::text);

-- Create policies for friends table
CREATE POLICY "Allow users to view their friendships" ON public.friends
    FOR SELECT USING (auth.uid()::text = user_id::text OR auth.uid()::text = friend_id::text);

CREATE POLICY "Allow users to create friendships" ON public.friends
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Allow users to delete their friendships" ON public.friends
    FOR DELETE USING (auth.uid()::text = user_id::text OR auth.uid()::text = friend_id::text);

-- Create policies for friend_requests table
CREATE POLICY "Allow users to view their friend requests" ON public.friend_requests
    FOR SELECT USING (auth.uid()::text = from_user_id::text OR auth.uid()::text = to_user_id::text);

CREATE POLICY "Allow users to send friend requests" ON public.friend_requests
    FOR INSERT WITH CHECK (auth.uid()::text = from_user_id::text);

CREATE POLICY "Allow users to update received friend requests" ON public.friend_requests
    FOR UPDATE USING (auth.uid()::text = to_user_id::text);

-- Create policies for communities table
CREATE POLICY "Allow public read access" ON public.communities
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to create communities" ON public.communities
    FOR INSERT WITH CHECK (auth.uid()::text = creator_id::text);

CREATE POLICY "Allow creators to update their communities" ON public.communities
    FOR UPDATE USING (auth.uid()::text = creator_id::text);

CREATE POLICY "Allow creators to delete their communities" ON public.communities
    FOR DELETE USING (auth.uid()::text = creator_id::text);

-- Create policies for community_members table
CREATE POLICY "Allow public read access" ON public.community_members
    FOR SELECT USING (true);

CREATE POLICY "Allow users to join communities" ON public.community_members
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Allow users to leave communities" ON public.community_members
    FOR DELETE USING (auth.uid()::text = user_id::text);
