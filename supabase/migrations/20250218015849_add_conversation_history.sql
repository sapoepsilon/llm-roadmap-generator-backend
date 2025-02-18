-- Migration file for roadmap system tables
-- Description: Creates roadmaps and roadmap_conversations tables with RLS policies

-- Up Migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roadmaps table
CREATE TABLE roadmaps (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_idea TEXT NOT NULL,
    clarification_questions TEXT,
    market_overview TEXT,
    market_overview_metadata JSONB,
    mvp_epics TEXT,
    task_breakdown TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create roadmap_conversations table
CREATE TABLE roadmap_conversations (
    id BIGSERIAL PRIMARY KEY,
    roadmap_id BIGINT REFERENCES roadmaps(id) ON DELETE CASCADE,
    messages JSONB[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX idx_roadmap_conversations_roadmap_id ON roadmap_conversations(roadmap_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_roadmaps_updated_at
    BEFORE UPDATE ON roadmaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmap_conversations_updated_at
    BEFORE UPDATE ON roadmap_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own roadmaps"
    ON roadmaps FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roadmaps"
    ON roadmaps FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roadmaps"
    ON roadmaps FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roadmaps"
    ON roadmaps FOR DELETE
    USING (auth.uid() = user_id);

-- RLS policies for roadmap_conversations (inherits access from parent roadmap)
CREATE POLICY "Users can view their roadmap conversations"
    ON roadmap_conversations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM roadmaps
        WHERE roadmaps.id = roadmap_conversations.roadmap_id
        AND roadmaps.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert roadmap conversations"
    ON roadmap_conversations FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM roadmaps
        WHERE roadmaps.id = roadmap_conversations.roadmap_id
        AND roadmaps.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their roadmap conversations"
    ON roadmap_conversations FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM roadmaps
        WHERE roadmaps.id = roadmap_conversations.roadmap_id
        AND roadmaps.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their roadmap conversations"
    ON roadmap_conversations FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM roadmaps
        WHERE roadmaps.id = roadmap_conversations.roadmap_id
        AND roadmaps.user_id = auth.uid()
    ));

-- Down Migration
-- Note: Add this section at the bottom of your migration file
/*
-- Drop tables (will cascade to triggers and policies)
DROP TABLE IF EXISTS roadmap_conversations;
DROP TABLE IF EXISTS roadmaps;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();
*/
