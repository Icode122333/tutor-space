-- =====================================================
-- NUCLEAR OPTION - COMPLETE FIX
-- This will fix EVERYTHING in one go
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- PART 1: Fix all RLS policies to prevent infinite recursion
-- =====================================================

-- Drop ALL problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Teachers can create courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can update their own courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can delete their own courses" ON public.courses;
DROP POLICY IF EXISTS "Students can enroll in courses" ON public.course_enrollments;

-- Ensure profiles has ONLY simple policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Create simple policies for other tables (no profile queries!)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'activity_logs' 
    AND policyname = 'Allow activity log inserts'
  ) THEN
    CREATE POLICY "Allow activity log inserts"
      ON public.activity_logs FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'courses' 
    AND policyname = 'Teachers can create courses'
  ) THEN
    CREATE POLICY "Teachers can create courses"
      ON public.courses FOR INSERT
      WITH CHECK (auth.uid() = teacher_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'courses' 
    AND policyname = 'Teachers can update their own courses'
  ) THEN
    CREATE POLICY "Teachers can update their own courses"
      ON public.courses FOR UPDATE
      USING (auth.uid() = teacher_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'courses' 
    AND policyname = 'Teachers can delete their own courses'
  ) THEN
    CREATE POLICY "Teachers can delete their own courses"
      ON public.courses FOR DELETE
      USING (auth.uid() = teacher_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'course_enrollments' 
    AND policyname = 'Students can enroll in courses'
  ) THEN
    CREATE POLICY "Students can enroll in courses"
      ON public.course_enrollments FOR INSERT
      WITH CHECK (auth.uid() = student_id);
  END IF;
END $$;

-- PART 2: Create helper functions
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role::TEXT INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  teacher_approved BOOLEAN,
  teacher_approval_status TEXT,
  is_suspended BOOLEAN,
  suspension_reason TEXT,
  last_login TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role::TEXT,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    p.teacher_approved,
    p.teacher_approval_status,
    p.is_suspended,
    p.suspension_reason,
    p.last_login
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_activity_logs(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ,
  user_full_name TEXT,
  user_email TEXT
) AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    l.id,
    l.user_id,
    l.action,
    l.entity_type,
    l.entity_id,
    l.details,
    l.ip_address,
    l.user_agent,
    l.created_at,
    p.full_name as user_full_name,
    p.email as user_email
  FROM public.activity_logs l
  LEFT JOIN public.profiles p ON l.user_id = p.id
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 3: Set up admin user
-- =====================================================

-- Add admin to enum if not exists
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

-- Update the admin user
UPDATE public.profiles 
SET 
  role = 'admin',
  onboarding_completed = true,
  teacher_approved = true
WHERE email = 'rubagengwagrace@gmail.com';

-- Verify everything
SELECT 
  'Admin user:' as info,
  id, 
  email, 
  role, 
  onboarding_completed
FROM public.profiles 
WHERE email = 'rubagengwagrace@gmail.com'

UNION ALL

SELECT 
  'Profiles policies:' as info,
  NULL as id,
  policyname as email,
  cmd::text as role,
  NULL as onboarding_completed
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY info, email;

-- Done! Now try logging in.
