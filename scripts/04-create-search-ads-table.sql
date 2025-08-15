-- Create search_ads table for marketplace search advertisements
CREATE TABLE IF NOT EXISTS search_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('buy', 'rent')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE search_ads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all active search ads" ON search_ads
  FOR SELECT USING (active = true);

CREATE POLICY "Users can insert their own search ads" ON search_ads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search ads" ON search_ads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search ads" ON search_ads
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_search_ads_updated_at BEFORE UPDATE ON search_ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
