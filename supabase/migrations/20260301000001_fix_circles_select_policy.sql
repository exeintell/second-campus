-- Fix: circle owner can't SELECT their own circle right after INSERT
-- because they haven't been added to circle_members yet.
-- Add owner_id check so the INSERT().select() chain works.

DROP POLICY IF EXISTS "Users can view circles they belong to" ON circles;

CREATE POLICY "Users can view circles they belong to"
  ON circles FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT get_my_circle_ids())
  );
