-- Backfill missing usernames from auth.users metadata.
-- The previous backfill (20260301000002) only copied id and email.
-- Username is stored in auth.users.raw_user_meta_data->>'username'.

UPDATE public.users pu
SET username = au.raw_user_meta_data->>'username'
FROM auth.users au
WHERE pu.id = au.id
  AND pu.username IS NULL
  AND au.raw_user_meta_data->>'username' IS NOT NULL;
