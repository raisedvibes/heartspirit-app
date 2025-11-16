-- Create messages table for storing conversation history
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  intent TEXT,
  reply_to_id UUID REFERENCES messages(id),
  meta JSONB,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster session queries
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Create practices table for storing mindfulness practices
CREATE TABLE IF NOT EXISTS practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration INTEGER, -- in minutes
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create practice_recommendations table for AI-driven practice matching
CREATE TABLE IF NOT EXISTS practice_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  energy TEXT NOT NULL, -- e.g., "Low", "Moderate", "High", "Peak"
  feelingtone TEXT NOT NULL, -- e.g., "Anxious", "Calm", "Sad", "Joyful"
  priority INTEGER DEFAULT 1, -- higher = better match
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(practice_id, energy, feelingtone)
);

-- Create indexes for practice recommendations
CREATE INDEX IF NOT EXISTS idx_practice_recs_lookup ON practice_recommendations(energy, feelingtone, priority DESC);
