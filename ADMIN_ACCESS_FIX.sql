-- =====================================================
-- COMPLETE ADMIN ACCESS FIX
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- Step 1: Ensure the user_role enum includes 'admin'
DO $$ 
BEGIN
  -- Check if admin value exists in enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'admin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    -- Add admin to the enum
    ALTER TYPE public.user_role ADD VALUE 'admin';
    RAISE NOTICE 'Added admin to user_role enum';
  ELSE
    RAISE NOTICE 'Admin already exists in user_role enum';
  END IF;
END $$;

-- Step 2: Update your user to admin
-- REPLACE 'muhirwaalex7@gmail.com' with your actual email
UPDATE public.profiles 
SET 
  role = 'admin',
  onboarding_completed = true,
  teacher_approved = true,
  teacher_approval_status = 'approved'
WHERE email = 'muhirwaalex7@gmail.com';

-- Step 3: Verify the update worked
SELECT 
  id, 
  email, 
  role, 
  onboarding_completed,
  teacher_approved,
  created_at
FROM public.profiles 
WHERE email = 'muhirwaalex7@gmail.com';

-- Step 4: Ensure profiles table policies are simple (no recursion)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Verify only these 3 policies exist on profiles:
-- 1. Users can view their own profile
-- 2. Users can update their own profile  
-- 3. Users can insert their own profile

-- Step 5: Check what policies exist on profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- If you see any policies that mention "admin" or query profiles, they need to be dropped!
