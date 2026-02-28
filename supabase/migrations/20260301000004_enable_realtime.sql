-- Enable Realtime for messages and dm_messages tables.
-- Supabase Realtime (postgres_changes) requires tables to be in the
-- supabase_realtime publication.

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE dm_messages;
