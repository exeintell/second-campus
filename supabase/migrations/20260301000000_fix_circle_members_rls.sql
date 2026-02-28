-- ============================================
-- Fix infinite recursion in circle_members RLS
-- ============================================
-- Problem: "Users can view circle members of their circles" policy
-- sub-selects from circle_members, which re-triggers the same policy → infinite loop.
-- Solution: SECURITY DEFINER helper functions that bypass RLS for membership checks.

-- 1. Helper functions (SECURITY DEFINER = runs as table owner, bypasses RLS)

CREATE OR REPLACE FUNCTION get_my_circle_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT circle_id FROM circle_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_my_admin_circle_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT circle_id FROM circle_members
  WHERE user_id = auth.uid() AND role IN ('owner', 'admin');
$$;

CREATE OR REPLACE FUNCTION get_circle_member_user_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT user_id FROM circle_members
  WHERE circle_id IN (SELECT get_my_circle_ids());
$$;

-- 2. Drop all policies that sub-query circle_members

DROP POLICY IF EXISTS "Users can view circle members of their circles" ON circle_members;
DROP POLICY IF EXISTS "Users can join circles" ON circle_members;
DROP POLICY IF EXISTS "Users can view circles they belong to" ON circles;
DROP POLICY IF EXISTS "Users can view channels in their circles" ON channels;
DROP POLICY IF EXISTS "Circle admins can create channels" ON channels;
DROP POLICY IF EXISTS "Users can view messages in channels they have access to" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in channels they have access to" ON messages;
DROP POLICY IF EXISTS "Users can view events in their circles" ON events;
DROP POLICY IF EXISTS "Circle members can create events" ON events;
DROP POLICY IF EXISTS "Users can view event slots for events they have access to" ON event_slots;
DROP POLICY IF EXISTS "Users can view responses for events they have access to" ON event_responses;
DROP POLICY IF EXISTS "Users can insert their own responses" ON event_responses;
DROP POLICY IF EXISTS "Users can view profiles of circle members" ON users;

-- 3. Recreate all policies using helper functions

-- circle_members
CREATE POLICY "Users can view circle members of their circles"
  ON circle_members FOR SELECT
  USING (circle_id IN (SELECT get_my_circle_ids()));

CREATE POLICY "Users can join circles"
  ON circle_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR circle_id IN (SELECT get_my_admin_circle_ids())
  );

-- circles
CREATE POLICY "Users can view circles they belong to"
  ON circles FOR SELECT
  USING (id IN (SELECT get_my_circle_ids()));

-- channels
CREATE POLICY "Users can view channels in their circles"
  ON channels FOR SELECT
  USING (circle_id IN (SELECT get_my_circle_ids()));

CREATE POLICY "Circle admins can create channels"
  ON channels FOR INSERT
  WITH CHECK (circle_id IN (SELECT get_my_admin_circle_ids()));

-- messages
CREATE POLICY "Users can view messages in channels they have access to"
  ON messages FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM channels WHERE circle_id IN (SELECT get_my_circle_ids())
    )
  );

CREATE POLICY "Users can insert messages in channels they have access to"
  ON messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    channel_id IN (
      SELECT id FROM channels WHERE circle_id IN (SELECT get_my_circle_ids())
    )
  );

-- events
CREATE POLICY "Users can view events in their circles"
  ON events FOR SELECT
  USING (circle_id IN (SELECT get_my_circle_ids()));

CREATE POLICY "Circle members can create events"
  ON events FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    circle_id IN (SELECT get_my_circle_ids())
  );

-- event_slots
CREATE POLICY "Users can view event slots for events they have access to"
  ON event_slots FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE circle_id IN (SELECT get_my_circle_ids())
    )
  );

-- event_responses
CREATE POLICY "Users can view responses for events they have access to"
  ON event_responses FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE circle_id IN (SELECT get_my_circle_ids())
    )
  );

CREATE POLICY "Users can insert their own responses"
  ON event_responses FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    event_id IN (
      SELECT id FROM events WHERE circle_id IN (SELECT get_my_circle_ids())
    )
  );

-- users (view profiles of fellow circle members)
CREATE POLICY "Users can view profiles of circle members"
  ON users FOR SELECT
  USING (id IN (SELECT get_circle_member_user_ids()));

-- Also allow users in DM conversations to see each other's profiles
CREATE POLICY "Users can view profiles of DM partners"
  ON users FOR SELECT
  USING (
    id IN (
      SELECT CASE
        WHEN user_id_1 = auth.uid() THEN user_id_2
        ELSE user_id_1
      END
      FROM conversations
      WHERE user_id_1 = auth.uid() OR user_id_2 = auth.uid()
    )
  );

-- conversations UPDATE (needed for updating updated_at on message send)
CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
