-- ============================================
-- Auto-join triggers + RPC functions
-- ============================================

-- Trigger: when a user joins a circle, auto-add them to default channels
CREATE OR REPLACE FUNCTION on_circle_member_joined()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO channel_members (channel_id, user_id)
  SELECT c.id, NEW.user_id
  FROM channels c
  WHERE c.circle_id = NEW.circle_id AND c.is_default = true
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_circle_member_joined
  AFTER INSERT ON circle_members
  FOR EACH ROW
  EXECUTE FUNCTION on_circle_member_joined();

-- Trigger: when a default channel is created, auto-add all circle members
CREATE OR REPLACE FUNCTION on_default_channel_created()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    INSERT INTO channel_members (channel_id, user_id)
    SELECT NEW.id, cm.user_id
    FROM circle_members cm
    WHERE cm.circle_id = NEW.circle_id
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_default_channel_created
  AFTER INSERT ON channels
  FOR EACH ROW
  EXECUTE FUNCTION on_default_channel_created();

-- RPC: invite a user to a channel (instant join, no request needed)
CREATE OR REPLACE FUNCTION invite_to_channel(p_channel_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_circle_id UUID;
BEGIN
  -- Get the channel's circle_id
  SELECT circle_id INTO v_circle_id FROM channels WHERE id = p_channel_id;
  IF v_circle_id IS NULL THEN
    RAISE EXCEPTION 'Channel not found';
  END IF;

  -- Verify inviter is a channel member or circle admin
  IF NOT EXISTS (
    SELECT 1 FROM channel_members WHERE channel_id = p_channel_id AND user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM circle_members WHERE circle_id = v_circle_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized to invite';
  END IF;

  -- Verify invitee is a circle member
  IF NOT EXISTS (
    SELECT 1 FROM circle_members WHERE circle_id = v_circle_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a circle member';
  END IF;

  -- Add to channel
  INSERT INTO channel_members (channel_id, user_id)
  VALUES (p_channel_id, p_user_id)
  ON CONFLICT DO NOTHING;
END;
$$;

-- RPC: approve a channel join request
CREATE OR REPLACE FUNCTION approve_channel_join_request(p_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel_id UUID;
  v_user_id UUID;
  v_circle_id UUID;
BEGIN
  -- Get request details
  SELECT channel_id, user_id INTO v_channel_id, v_user_id
  FROM channel_join_requests
  WHERE id = p_request_id AND status = 'pending';

  IF v_channel_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Get circle_id
  SELECT circle_id INTO v_circle_id FROM channels WHERE id = v_channel_id;

  -- Verify caller is admin/owner
  IF NOT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = v_circle_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Update request
  UPDATE channel_join_requests
  SET status = 'approved', resolved_at = now(), resolved_by = auth.uid()
  WHERE id = p_request_id;

  -- Add to channel
  INSERT INTO channel_members (channel_id, user_id)
  VALUES (v_channel_id, v_user_id)
  ON CONFLICT DO NOTHING;
END;
$$;
