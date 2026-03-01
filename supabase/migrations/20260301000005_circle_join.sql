-- Circle join feature: invite codes + join requests

-- 1a. circles: add invite_code column
ALTER TABLE circles ADD COLUMN invite_code TEXT UNIQUE;

UPDATE circles SET invite_code = substr(md5(random()::text), 1, 6)
WHERE invite_code IS NULL;

ALTER TABLE circles ALTER COLUMN invite_code SET NOT NULL;
ALTER TABLE circles ALTER COLUMN invite_code SET DEFAULT substr(md5(random()::text), 1, 6);

-- 1b. join_requests table
CREATE TABLE join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(circle_id, user_id)
);
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- 1c. RLS policies for join_requests
CREATE POLICY "Users can view own requests" ON join_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Owners can view circle requests" ON join_requests
  FOR SELECT USING (circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid() AND role = 'owner'
  ));

CREATE POLICY "Users can create requests" ON join_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can update requests" ON join_requests
  FOR UPDATE USING (circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- 1d. Allow all authenticated users to search circles
-- NOTE: useCircles hook must explicitly filter by membership after this
CREATE POLICY "Authenticated users can search circles"
  ON circles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 1e. RPC: join circle by invite code
CREATE OR REPLACE FUNCTION join_circle_by_code(code TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_circle_id UUID;
BEGIN
  SELECT id INTO v_circle_id FROM circles WHERE invite_code = code;
  IF v_circle_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF EXISTS (SELECT 1 FROM circle_members WHERE circle_id = v_circle_id AND user_id = auth.uid()) THEN
    RETURN v_circle_id;
  END IF;

  INSERT INTO circle_members (circle_id, user_id, role) VALUES (v_circle_id, auth.uid(), 'member');
  RETURN v_circle_id;
END;
$$;

-- 1f. RPC: approve join request
CREATE OR REPLACE FUNCTION approve_join_request(request_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_request join_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request FROM join_requests WHERE id = request_id AND status = 'pending';
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Request not found or already resolved';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = v_request.circle_id AND user_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only owner can approve';
  END IF;

  INSERT INTO circle_members (circle_id, user_id, role) VALUES (v_request.circle_id, v_request.user_id, 'member')
  ON CONFLICT DO NOTHING;

  UPDATE join_requests SET status = 'approved', resolved_at = now() WHERE id = request_id;
END;
$$;
