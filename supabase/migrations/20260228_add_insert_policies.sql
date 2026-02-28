-- ============================================
-- Add missing RLS policies for core functionality
-- ============================================

-- Users: allow inserting own profile (needed for signup)
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users: allow viewing profiles of users in same circles (needed for chat)
CREATE POLICY "Users can view profiles of circle members"
  ON users FOR SELECT
  USING (
    id IN (
      SELECT cm.user_id FROM circle_members cm
      WHERE cm.circle_id IN (
        SELECT cm2.circle_id FROM circle_members cm2 WHERE cm2.user_id = auth.uid()
      )
    )
  );

-- Circles: allow authenticated users to create circles
CREATE POLICY "Authenticated users can create circles"
  ON circles FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Circle Members: allow users to add themselves or owners/admins to add others
CREATE POLICY "Users can join circles"
  ON circle_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
