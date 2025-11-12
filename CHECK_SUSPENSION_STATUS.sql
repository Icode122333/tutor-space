-- Check suspension status of all users
-- Run this in Supabase SQL Editor to verify suspensions

SELECT 
  id,
  email,
  full_name,
  role,
  is_suspended,
  suspension_reason,
  updated_at
FROM public.profiles
WHERE is_suspended = true
ORDER BY updated_at DESC;

-- If you want to check a specific user by email:
-- SELECT 
--   id,
--   email,
--   full_name,
--   role,
--   is_suspended,
--   suspension_reason,
--   updated_at
-- FROM public.profiles
-- WHERE email = 'user@example.com';

-- To manually suspend a user (replace the email):
-- UPDATE public.profiles
-- SET 
--   is_suspended = true,
--   suspension_reason = 'Test suspension',
--   updated_at = NOW()
-- WHERE email = 'user@example.com';

-- To manually unsuspend a user (replace the email):
-- UPDATE public.profiles
-- SET 
--   is_suspended = false,
--   suspension_reason = NULL,
--   updated_at = NOW()
-- WHERE email = 'user@example.com';
