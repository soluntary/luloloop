-- Create spielhilfen_templates table for storing user templates
CREATE TABLE IF NOT EXISTS spielhilfen_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spielhilfe_type VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_spielhilfen_templates_user_id ON spielhilfen_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_spielhilfen_templates_type ON spielhilfen_templates(spielhilfe_type);
CREATE INDEX IF NOT EXISTS idx_spielhilfen_templates_user_type ON spielhilfen_templates(user_id, spielhilfe_type);

-- Enable Row Level Security
ALTER TABLE spielhilfen_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own templates
CREATE POLICY "Users can view own templates" ON spielhilfen_templates
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own templates
CREATE POLICY "Users can insert own templates" ON spielhilfen_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own templates
CREATE POLICY "Users can update own templates" ON spielhilfen_templates
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON spielhilfen_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_spielhilfen_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_spielhilfen_templates_updated_at ON spielhilfen_templates;
CREATE TRIGGER trigger_update_spielhilfen_templates_updated_at
  BEFORE UPDATE ON spielhilfen_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_spielhilfen_templates_updated_at();
