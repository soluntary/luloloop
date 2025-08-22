-- Create shelf access requests table
CREATE TABLE IF NOT EXISTS shelf_access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, owner_id)
);

-- Create game interaction requests table (for trade/buy/rent requests)
CREATE TABLE IF NOT EXISTS game_interaction_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('trade', 'buy', 'rent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'completed')),
  message TEXT,
  offered_game_id UUID REFERENCES games(id) ON DELETE SET NULL, -- For trade requests
  offered_price DECIMAL(10,2), -- For buy requests
  rental_duration_days INTEGER, -- For rent requests
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shelf_access_requests_requester ON shelf_access_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_shelf_access_requests_owner ON shelf_access_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_shelf_access_requests_status ON shelf_access_requests(status);

CREATE INDEX IF NOT EXISTS idx_game_interaction_requests_requester ON game_interaction_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_game_interaction_requests_owner ON game_interaction_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_game_interaction_requests_game ON game_interaction_requests(game_id);
CREATE INDEX IF NOT EXISTS idx_game_interaction_requests_status ON game_interaction_requests(status);

-- Enable RLS
ALTER TABLE shelf_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_interaction_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for shelf_access_requests
CREATE POLICY "Users can view their own shelf access requests" ON shelf_access_requests
  FOR SELECT USING (requester_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Users can create shelf access requests" ON shelf_access_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Owners can update shelf access requests" ON shelf_access_requests
  FOR UPDATE USING (owner_id = auth.uid());

-- RLS policies for game_interaction_requests
CREATE POLICY "Users can view their own game interaction requests" ON game_interaction_requests
  FOR SELECT USING (requester_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Users can create game interaction requests" ON game_interaction_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Owners can update game interaction requests" ON game_interaction_requests
  FOR UPDATE USING (owner_id = auth.uid());
