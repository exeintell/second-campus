-- Backfill: add all existing circle members to all existing channels
-- This MUST run before RLS changes to preserve backward compatibility
INSERT INTO channel_members (channel_id, user_id)
SELECT c.id, cm.user_id
FROM channels c
JOIN circle_members cm ON cm.circle_id = c.circle_id
ON CONFLICT DO NOTHING;
