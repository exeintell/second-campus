-- ============================================================
-- Notifications table, indexes, RLS, triggers, and RPC
-- ============================================================

-- 1. Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'channel_message',
    'dm_message',
    'circle_join_request',
    'channel_join_request',
    'join_request_approved',
    'join_request_rejected',
    'channel_join_approved',
    'channel_join_rejected',
    'new_event'
  )),
  title TEXT NOT NULL,
  body TEXT,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- 3. RLS Policies (users can only see/update/delete their own notifications)
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 5. RPC: mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE notifications
  SET is_read = true
  WHERE user_id = auth.uid() AND is_read = false;
$$;

-- ============================================================
-- 6. Trigger functions (SECURITY DEFINER to bypass RLS for INSERT)
-- ============================================================

-- 6a. Channel message → notify channel members (excluding sender)
CREATE OR REPLACE FUNCTION notify_channel_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_channel_name TEXT;
  v_circle_id UUID;
  v_username TEXT;
BEGIN
  SELECT c.name, c.circle_id INTO v_channel_name, v_circle_id
  FROM channels c WHERE c.id = NEW.channel_id;

  SELECT u.username INTO v_username
  FROM public.users u WHERE u.id = NEW.user_id;

  INSERT INTO notifications (user_id, type, title, body, circle_id, channel_id, actor_id)
  SELECT cm.user_id,
         'channel_message',
         v_username || ' が #' || v_channel_name || ' に投稿しました',
         LEFT(NEW.content, 100),
         v_circle_id,
         NEW.channel_id,
         NEW.user_id
  FROM channel_members cm
  WHERE cm.channel_id = NEW.channel_id
    AND cm.user_id != NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_channel_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_channel_message();

-- 6b. DM message → notify conversation partner
CREATE OR REPLACE FUNCTION notify_dm_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_username TEXT;
  v_other_user UUID;
BEGIN
  SELECT u.username INTO v_username
  FROM public.users u WHERE u.id = NEW.user_id;

  -- Find the other user in the conversation
  SELECT CASE
    WHEN c.user_id_1 = NEW.user_id THEN c.user_id_2
    ELSE c.user_id_1
  END INTO v_other_user
  FROM conversations c WHERE c.id = NEW.conversation_id;

  INSERT INTO notifications (user_id, type, title, body, conversation_id, actor_id)
  VALUES (
    v_other_user,
    'dm_message',
    v_username || ' からメッセージが届きました',
    LEFT(NEW.content, 100),
    NEW.conversation_id,
    NEW.user_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_dm_message
  AFTER INSERT ON dm_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_dm_message();

-- 6c. Circle join request → notify circle owner/admins
CREATE OR REPLACE FUNCTION notify_circle_join_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_circle_name TEXT;
  v_username TEXT;
BEGIN
  SELECT c.name INTO v_circle_name
  FROM circles c WHERE c.id = NEW.circle_id;

  SELECT u.username INTO v_username
  FROM public.users u WHERE u.id = NEW.user_id;

  INSERT INTO notifications (user_id, type, title, body, circle_id, actor_id)
  SELECT cm.user_id,
         'circle_join_request',
         v_username || ' が ' || v_circle_name || ' への参加をリクエストしました',
         NULL,
         NEW.circle_id,
         NEW.user_id
  FROM circle_members cm
  WHERE cm.circle_id = NEW.circle_id
    AND cm.role IN ('owner', 'admin');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_circle_join_request
  AFTER INSERT ON join_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_circle_join_request();

-- 6d. Channel join request → notify circle owner/admins
CREATE OR REPLACE FUNCTION notify_channel_join_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_channel_name TEXT;
  v_circle_id UUID;
  v_username TEXT;
BEGIN
  SELECT ch.name, ch.circle_id INTO v_channel_name, v_circle_id
  FROM channels ch WHERE ch.id = NEW.channel_id;

  SELECT u.username INTO v_username
  FROM public.users u WHERE u.id = NEW.user_id;

  INSERT INTO notifications (user_id, type, title, body, circle_id, channel_id, actor_id)
  SELECT cm.user_id,
         'channel_join_request',
         v_username || ' が #' || v_channel_name || ' への参加をリクエストしました',
         NULL,
         v_circle_id,
         NEW.channel_id,
         NEW.user_id
  FROM circle_members cm
  WHERE cm.circle_id = v_circle_id
    AND cm.role IN ('owner', 'admin');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_channel_join_request
  AFTER INSERT ON channel_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_channel_join_request();

-- 6e. Circle join request resolved → notify requester
CREATE OR REPLACE FUNCTION notify_join_request_resolved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_circle_name TEXT;
BEGIN
  -- Only fire when status changes from pending to approved/rejected
  IF OLD.status != 'pending' OR NEW.status = 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT c.name INTO v_circle_name
  FROM circles c WHERE c.id = NEW.circle_id;

  INSERT INTO notifications (user_id, type, title, circle_id)
  VALUES (
    NEW.user_id,
    CASE WHEN NEW.status = 'approved' THEN 'join_request_approved' ELSE 'join_request_rejected' END,
    v_circle_name || ' への参加リクエストが' || CASE WHEN NEW.status = 'approved' THEN '承認' ELSE '拒否' END || 'されました',
    NEW.circle_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_join_request_resolved
  AFTER UPDATE ON join_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_join_request_resolved();

-- 6f. Channel join request resolved → notify requester
CREATE OR REPLACE FUNCTION notify_channel_join_resolved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_channel_name TEXT;
  v_circle_id UUID;
BEGIN
  IF OLD.status != 'pending' OR NEW.status = 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT ch.name, ch.circle_id INTO v_channel_name, v_circle_id
  FROM channels ch WHERE ch.id = NEW.channel_id;

  INSERT INTO notifications (user_id, type, title, circle_id, channel_id)
  VALUES (
    NEW.user_id,
    CASE WHEN NEW.status = 'approved' THEN 'channel_join_approved' ELSE 'channel_join_rejected' END,
    '#' || v_channel_name || ' への参加リクエストが' || CASE WHEN NEW.status = 'approved' THEN '承認' ELSE '拒否' END || 'されました',
    v_circle_id,
    NEW.channel_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_channel_join_resolved
  AFTER UPDATE ON channel_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_channel_join_resolved();

-- 6g. New event → notify circle members (excluding creator)
CREATE OR REPLACE FUNCTION notify_new_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_username TEXT;
  v_circle_name TEXT;
BEGIN
  SELECT u.username INTO v_username
  FROM public.users u WHERE u.id = NEW.created_by;

  SELECT c.name INTO v_circle_name
  FROM circles c WHERE c.id = NEW.circle_id;

  INSERT INTO notifications (user_id, type, title, body, circle_id, event_id, actor_id)
  SELECT cm.user_id,
         'new_event',
         v_circle_name || ' に新しいイベント「' || NEW.title || '」が作成されました',
         NEW.description,
         NEW.circle_id,
         NEW.id,
         NEW.created_by
  FROM circle_members cm
  WHERE cm.circle_id = NEW.circle_id
    AND cm.user_id != NEW.created_by;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_event
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_event();
