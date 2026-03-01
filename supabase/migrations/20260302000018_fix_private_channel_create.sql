-- Fix: private channel creation fails because SELECT policy
-- requires channel_members entry, but creator isn't added yet at INSERT time.
--
-- Two fixes:
-- 1. Allow circle admins to see ALL channels (including private) in their circles
-- 2. Auto-add channel creator as member via trigger (for all non-default channels)

-- Fix 1: Update channels SELECT policy
DROP POLICY IF EXISTS "Users can view channels in their circles" ON channels;

CREATE POLICY "Users can view channels in their circles"
  ON channels FOR SELECT
  USING (
    -- Public channels: any circle member can see
    (is_private = false AND circle_id IN (SELECT get_my_circle_ids()))
    OR
    -- Private channels: channel members can see
    (is_private = true AND id IN (SELECT get_my_channel_ids()))
    OR
    -- Circle admins/owners can see all channels in their circles
    (circle_id IN (SELECT get_my_admin_circle_ids()))
  );

-- Fix 2: Auto-add channel creator as member
CREATE OR REPLACE FUNCTION on_channel_created()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Default channel: add ALL circle members
    INSERT INTO channel_members (channel_id, user_id)
    SELECT NEW.id, cm.user_id
    FROM circle_members cm
    WHERE cm.circle_id = NEW.circle_id
    ON CONFLICT DO NOTHING;
  ELSE
    -- Non-default channel: add only the creator
    INSERT INTO channel_members (channel_id, user_id)
    VALUES (NEW.id, auth.uid())
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Replace the old trigger
DROP TRIGGER IF EXISTS trigger_default_channel_created ON channels;

CREATE TRIGGER trigger_channel_created
  AFTER INSERT ON channels
  FOR EACH ROW
  EXECUTE FUNCTION on_channel_created();
