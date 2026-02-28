-- pgcrypto provides gen_random_uuid() on older PG; on PG 13+ it's built-in
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. Create All Tables
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id_1, user_id_2),
  CHECK (user_id_1 < user_id_2)
);

CREATE TABLE dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE event_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE event_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES event_slots(id) ON DELETE CASCADE,
  response TEXT CHECK (response IN ('available', 'unavailable', 'tentative')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id, slot_id)
);

-- ============================================
-- 2. Enable RLS on All Tables
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_responses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS Policies (all tables exist now)
-- ============================================

-- Users
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Circles
CREATE POLICY "Users can view circles they belong to"
  ON circles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM circle_members WHERE circle_id = circles.id
    )
  );

CREATE POLICY "Circle owners can update their circles"
  ON circles FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Circle owners can delete their circles"
  ON circles FOR DELETE
  USING (owner_id = auth.uid());

-- Circle Members
CREATE POLICY "Users can view circle members of their circles"
  ON circle_members FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own memberships"
  ON circle_members FOR SELECT
  USING (user_id = auth.uid());

-- Channels
CREATE POLICY "Users can view channels in their circles"
  ON channels FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Circle admins can create channels"
  ON channels FOR INSERT
  WITH CHECK (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Messages
CREATE POLICY "Users can view messages in channels they have access to"
  ON messages FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM channels WHERE circle_id IN (
        SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert messages in channels they have access to"
  ON messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    channel_id IN (
      SELECT id FROM channels WHERE circle_id IN (
        SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  USING (user_id = auth.uid());

-- Conversations
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    auth.uid() = user_id_1 OR auth.uid() = user_id_2
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id_1 OR auth.uid() = user_id_2
  );

-- DM Messages
CREATE POLICY "Users can view messages in their conversations"
  ON dm_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user_id_1 = auth.uid() OR user_id_2 = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON dm_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user_id_1 = auth.uid() OR user_id_2 = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own messages"
  ON dm_messages FOR DELETE
  USING (user_id = auth.uid());

-- Events
CREATE POLICY "Users can view events in their circles"
  ON events FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Circle members can create events"
  ON events FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
    )
  );

-- Event Slots
CREATE POLICY "Users can view event slots for events they have access to"
  ON event_slots FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE circle_id IN (
        SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
      )
    )
  );

-- Event Responses
CREATE POLICY "Users can view responses for events they have access to"
  ON event_responses FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE circle_id IN (
        SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own responses"
  ON event_responses FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    event_id IN (
      SELECT id FROM events WHERE circle_id IN (
        SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own responses"
  ON event_responses FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- 4. Indexes
-- ============================================

CREATE INDEX idx_circle_members_circle_id ON circle_members(circle_id);
CREATE INDEX idx_circle_members_user_id ON circle_members(user_id);
CREATE INDEX idx_channels_circle_id ON channels(circle_id);
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_dm_messages_conversation_id ON dm_messages(conversation_id);
CREATE INDEX idx_dm_messages_user_id ON dm_messages(user_id);
CREATE INDEX idx_dm_messages_created_at ON dm_messages(created_at DESC);
CREATE INDEX idx_events_circle_id ON events(circle_id);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_event_slots_event_id ON event_slots(event_id);
CREATE INDEX idx_event_responses_event_id ON event_responses(event_id);
CREATE INDEX idx_event_responses_user_id ON event_responses(user_id);
CREATE INDEX idx_event_responses_slot_id ON event_responses(slot_id);
