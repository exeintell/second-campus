-- Fix: PostgREST cannot resolve joins like "users(username, avatar_url)"
-- because all user_id FKs point to auth.users, not public.users.
-- Solution: re-point FKs to public.users (which itself refs auth.users).

-- Step 0: Backfill public.users for any auth.users entries that are missing.
-- This ensures FK constraints won't fail when re-pointing.
INSERT INTO public.users (id, email)
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

-- messages
ALTER TABLE messages
  DROP CONSTRAINT messages_user_id_fkey,
  ADD CONSTRAINT messages_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- dm_messages
ALTER TABLE dm_messages
  DROP CONSTRAINT dm_messages_user_id_fkey,
  ADD CONSTRAINT dm_messages_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- circle_members
ALTER TABLE circle_members
  DROP CONSTRAINT circle_members_user_id_fkey,
  ADD CONSTRAINT circle_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- circles (owner_id)
ALTER TABLE circles
  DROP CONSTRAINT circles_owner_id_fkey,
  ADD CONSTRAINT circles_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- conversations
ALTER TABLE conversations
  DROP CONSTRAINT conversations_user_id_1_fkey,
  ADD CONSTRAINT conversations_user_id_1_fkey
    FOREIGN KEY (user_id_1) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE conversations
  DROP CONSTRAINT conversations_user_id_2_fkey,
  ADD CONSTRAINT conversations_user_id_2_fkey
    FOREIGN KEY (user_id_2) REFERENCES public.users(id) ON DELETE CASCADE;

-- events (created_by)
ALTER TABLE events
  DROP CONSTRAINT events_created_by_fkey,
  ADD CONSTRAINT events_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;

-- event_responses
ALTER TABLE event_responses
  DROP CONSTRAINT event_responses_user_id_fkey,
  ADD CONSTRAINT event_responses_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
