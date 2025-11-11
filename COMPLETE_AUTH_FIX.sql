-- =====================================================
-- NUCLEAR OPTION: Complete Auth Fix
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- STEP 1: Drop ALL problematic policies
-- =====================================================

-- Drop policies on activity_logs
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;

-- Drop policies on system_settings
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;

-- Drop policies on courses that query profiles
DROP POLICY IF EXISTS "Teachers can create courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can update their own courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can delete their own courses" ON public.courses;

-- Drop policies on course_enrollments that query profiles
DROP POLICY IF EXISTS "Students can enroll in courses" ON public.course_enrollments;

-- STEP 2: Create helper functions
-- =====================================================

-- Function to get user role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role::TEXT INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role(user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- STEP 3: Create simple, non-recursive policies
-- =====================================================

-- Activity logs: Only allow inserts (check if exists first)
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
END $$;

-- Courses: Simple ownership checks (no role checking)
DO $$ 
BEGIN
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
END $$;

-- Course enrollments: Simple ownership checks
DO $$ 
BEGIN
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

-- STEP 4: Create RPC functions for admin operations
-- =====================================================

-- Get all profiles (admin only)
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
  FROM public.profiles p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get activity logs (admin only)
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

-- Get system settings (admin only)
CREATE OR REPLACE FUNCTION public.get_system_settings()
RETURNS TABLE (
  id UUID,
  key TEXT,
  value JSONB,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    s.id,
    s.key,
    s.value,
    s.description,
    s.updated_by,
    s.updated_at
  FROM public.system_settings s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log activity function
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

-- STEP 5: Verify profiles policies are correct
-- =====================================================
-- These should already exist and be simple (no recursion):
-- ✓ "Users can view their own profile" - USING (auth.uid() = id)
-- ✓ "Users can update their own profile" - USING (auth.uid() = id)
-- ✓ "Users can insert their own profile" - WITH CHECK (auth.uid() = id)

-- Done! Auth should now work for all users.
