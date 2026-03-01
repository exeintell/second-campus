-- ============================================
-- Channel membership RLS policies + helper function
-- ============================================

-- Helper function: get channel IDs the current user belongs to
CREATE OR REPLACE FUNCTION get_my_channel_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT channel_id FROM channel_members WHERE user_id = auth.uid();
$$;

-- ============================================
-- channel_members RLS policies
-- ============================================

-- Members can see other members in their channels
CREATE POLICY "Users can view channel members"
  ON channel_members FOR SELECT
  USING (channel_id IN (SELECT get_my_channel_ids()));

-- Self-join for public channels (user must be a circle member)
CREATE POLICY "Users can join public channels"
  ON channel_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND channel_id IN (
      SELECT c.id FROM channels c
      WHERE c.is_private = false
        AND c.circle_id IN (SELECT get_my_circle_ids())
    )
  );

-- Self-leave (anyone can remove themselves)
CREATE POLICY "Users can leave channels"
  ON channel_members FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- channel_join_requests RLS policies
-- ============================================

-- Users can see their own requests
CREATE POLICY "Users can view own channel join requests"
  ON channel_join_requests FOR SELECT
  USING (user_id = auth.uid());

-- Circle admins can see requests for channels in their circles
CREATE POLICY "Admins can view channel join requests"
  ON channel_join_requests FOR SELECT
  USING (
    channel_id IN (
      SELECT c.id FROM channels c
      WHERE c.circle_id IN (SELECT get_my_admin_circle_ids())
    )
  );

-- Users can create requests for private channels they're not in
CREATE POLICY "Users can request to join private channels"
  ON channel_join_requests FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND channel_id IN (
      SELECT c.id FROM channels c
      WHERE c.is_private = true
        AND c.circle_id IN (SELECT get_my_circle_ids())
    )
  );

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update channel join requests"
  ON channel_join_requests FOR UPDATE
  USING (
    channel_id IN (
      SELECT c.id FROM channels c
      WHERE c.circle_id IN (SELECT get_my_admin_circle_ids())
    )
  );

-- ============================================
-- Replace channels SELECT policy
-- Public channels: circle members can see
-- Private channels: only channel_members can see
-- ============================================

DROP POLICY IF EXISTS "Users can view channels in their circles" ON channels;

CREATE POLICY "Users can view channels in their circles"
  ON channels FOR SELECT
  USING (
    (is_private = false AND circle_id IN (SELECT get_my_circle_ids()))
    OR
    (is_private = true AND id IN (SELECT get_my_channel_ids()))
  );

-- ============================================
-- Replace channels DELETE policy
-- Only owner/admin, and cannot delete default channels
-- ============================================

DROP POLICY IF EXISTS "Circle admins can delete channels" ON channels;

CREATE POLICY "Circle admins can delete non-default channels"
  ON channels FOR DELETE
  USING (
    is_default = false
    AND circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- Replace messages policies to use channel_members
-- ============================================

DROP POLICY IF EXISTS "Users can view messages in channels they have access to" ON messages;

CREATE POLICY "Users can view messages in channels they have access to"
  ON messages FOR SELECT
  USING (channel_id IN (SELECT get_my_channel_ids()));

DROP POLICY IF EXISTS "Users can insert messages in channels they have access to" ON messages;

CREATE POLICY "Users can insert messages in channels they have access to"
  ON messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND channel_id IN (SELECT get_my_channel_ids())
  );

-- ============================================
-- Enable Realtime for channel_members
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE channel_members;
