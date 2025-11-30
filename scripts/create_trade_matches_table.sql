-- Create table to store trade matches
CREATE TABLE IF NOT EXISTS trade_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offer_a_id UUID NOT NULL REFERENCES marketplace_offers(id) ON DELETE CASCADE,
  offer_b_id UUID NOT NULL REFERENCES marketplace_offers(id) ON DELETE CASCADE,
  search_ad_a_id UUID REFERENCES search_ads(id) ON DELETE CASCADE,
  search_ad_b_id UUID REFERENCES search_ads(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL DEFAULT 100, -- 100 = perfect match, <100 = partial match
  match_type VARCHAR(50) NOT NULL DEFAULT 'trade', -- 'trade', 'rental', 'sell'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'completed'
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_match UNIQUE(offer_a_id, offer_b_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_trade_matches_user_a ON trade_matches(user_a_id);
CREATE INDEX IF NOT EXISTS idx_trade_matches_user_b ON trade_matches(user_b_id);
CREATE INDEX IF NOT EXISTS idx_trade_matches_status ON trade_matches(status);
CREATE INDEX IF NOT EXISTS idx_trade_matches_created ON trade_matches(created_at DESC);

-- Enable RLS
ALTER TABLE trade_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own matches"
  ON trade_matches FOR SELECT
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Users can update their own match status"
  ON trade_matches FOR UPDATE
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Function to find trade matches
CREATE OR REPLACE FUNCTION find_trade_matches()
RETURNS TABLE (
  user_a_id UUID,
  user_b_id UUID,
  offer_a_id UUID,
  offer_b_id UUID,
  search_ad_a_id UUID,
  search_ad_b_id UUID,
  match_score INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Perfect matches: User A offers what User B searches, User B offers what User A searches
  SELECT DISTINCT
    mo1.user_id as user_a_id,
    mo2.user_id as user_b_id,
    mo1.id as offer_a_id,
    mo2.id as offer_b_id,
    sa1.id as search_ad_a_id,
    sa2.id as search_ad_b_id,
    100 as match_score
  FROM marketplace_offers mo1
  INNER JOIN search_ads sa1 ON sa1.user_id = mo1.user_id AND sa1.active = true
  INNER JOIN marketplace_offers mo2 ON 
    mo2.title ILIKE '%' || sa1.title || '%' AND 
    mo2.user_id != mo1.user_id AND
    mo2.type = 'Tauschen' AND
    mo2.active = true
  INNER JOIN search_ads sa2 ON 
    sa2.user_id = mo2.user_id AND
    sa2.title ILIKE '%' || mo1.title || '%' AND
    sa2.active = true
  WHERE mo1.type = 'Tauschen' AND mo1.active = true
  ORDER BY mo1.created_at DESC;
END;
$$;
