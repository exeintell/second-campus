-- ============================================
-- Add missing RLS policies for channels/events features
-- ============================================

-- Channel DELETE (owner/admin only)
CREATE POLICY "Circle admins can delete channels"
  ON channels FOR DELETE
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Channel UPDATE (owner/admin only)
CREATE POLICY "Circle admins can update channels"
  ON channels FOR UPDATE
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Event DELETE (creator only)
CREATE POLICY "Event creators can delete their events"
  ON events FOR DELETE
  USING (created_by = auth.uid());

-- Event UPDATE (creator only)
CREATE POLICY "Event creators can update their events"
  ON events FOR UPDATE
  USING (created_by = auth.uid());

-- Event slots INSERT (event creator only)
CREATE POLICY "Event creators can insert slots"
  ON event_slots FOR INSERT
  WITH CHECK (
    event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
  );

-- Event slots DELETE (event creator only)
CREATE POLICY "Event creators can delete slots"
  ON event_slots FOR DELETE
  USING (
    event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
  );

-- Event responses DELETE (own responses only)
CREATE POLICY "Users can delete their own responses"
  ON event_responses FOR DELETE
  USING (user_id = auth.uid());

-- Enable Realtime for channels, events, event_responses
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE event_responses;
