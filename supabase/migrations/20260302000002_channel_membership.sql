-- Add is_private and is_default columns to channels
ALTER TABLE channels ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE channels ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;

-- Mark existing '一般' channels as default
UPDATE channels SET is_default = true WHERE name = '一般';

-- channel_members table
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX idx_channel_members_user ON channel_members(user_id);

-- channel_join_requests table (for private channels)
CREATE TABLE channel_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE channel_join_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_channel_join_requests_channel ON channel_join_requests(channel_id);
CREATE INDEX idx_channel_join_requests_status ON channel_join_requests(channel_id, status);
