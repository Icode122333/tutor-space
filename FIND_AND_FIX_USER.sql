-- =====================================================
-- FIND AND FIX YOUR USER
-- Run these queries ONE BY ONE to find and fix your account
-- =====================================================

-- STEP 1: Find all users in profiles table
-- This will show you all existing users
SELECT 
  id, 
  email, 
  role, 
  full_name,
  onboarding_completed,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 20;

-- STEP 2: Find users in auth.users table
-- This shows users who have authenticated but might not have profiles
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- STEP 3: After you identify your user from above, update this query
-- Replace 'YOUR_ACTUAL_EMAIL@gmail.com' with the email you see in the results
-- Then run this:

-- First, ensure admin enum value exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'admin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'admin';
    RAISE NOTICE 'Added admin to user_role enum';
  END IF;
END $$;

-- Update your user to admin (REPLACE THE EMAIL!)
UPDATE public.profiles 
SET 
  role = 'admin',
  onboarding_completed = true,
  teacher_approved = true
WHERE email = 'YOUR_ACTUAL_EMAIL@gmail.com';  -- CHANGE THIS!

-- Verify it worked
SELECT id, email, role, onboarding_completed 
FROM public.profiles 
WHERE email = 'YOUR_ACTUAL_EMAIL@gmail.com';  -- CHANGE THIS!

-- STEP 4: If your email doesn't exist in profiles at all, create it
-- Get your user ID from auth.users (from STEP 2), then run:

/*
INSERT INTO public.profiles (id, email, role, full_name, onboarding_completed)
VALUES (
  'YOUR_USER_ID_FROM_AUTH_USERS',  -- Replace with actual UUID
  'your@email.com',                 -- Replace with your email
  'admin',                          -- Set as admin
  'Your Name',                      -- Your name
  true                              -- Skip onboarding
);
*/
