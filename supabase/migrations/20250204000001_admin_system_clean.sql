-- =====================================================
-- Admin System Migration - Clean Version
-- Creates admin role, teacher approval, and activity logs
-- Designed to work with existing database structure
-- =====================================================

-- 1. Add 'admin' to user_role enum if not exists
DO $$ 
BEGIN
  -- Check if admin value already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'admin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'admin';
  END IF;
END $$;

-- 2. Add teacher approval and admin fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS teacher_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS teacher_approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS teacher_approval_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS teacher_approved_by UUID,
ADD COLUMN IF NOT EXISTS teacher_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add constraint for teacher_approval_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_teacher_approval_status_check'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_teacher_approval_status_check 
    CHECK (teacher_approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Add foreign key for teacher_approved_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_teacher_approved_by_fkey'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_teacher_approved_by_fkey 
    FOREIGN KEY (teacher_approved_by) REFERENCES public.profiles(id);
  END IF;
END $$;

-- 3. Create activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- 4. Create system settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add course approval columns (only if courses table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses') THEN
    ALTER TABLE public.courses
    ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
    
    ALTER TABLE public.courses
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
    
    ALTER TABLE public.courses
    ADD COLUMN IF NOT EXISTS category TEXT;
    
    -- Add constraint
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'courses_approval_status_check'
    ) THEN
      ALTER TABLE public.courses 
      ADD CONSTRAINT courses_approval_status_check 
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));
    END IF;
  END IF;
END $$;

-- 6. Enable RLS on new tables
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing admin policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 8. Create RLS Policies for activity_logs
CREATE POLICY "Admins can view all activity logs"
  ON public.activity_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

-- 9. Create RLS Policies for system_settings
CREATE POLICY "Admins can manage system settings"
  ON public.system_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 10. Add admin policies to profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 11. Create activity logging function
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

-- 12. Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('site_name', '"DataPlus Learning"', 'Platform name'),
  ('require_teacher_approval', 'true', 'Require admin approval for new teachers'),
  ('require_course_approval', 'false', 'Require admin approval for new courses'),
  ('maintenance_mode', 'false', 'Enable maintenance mode')
ON CONFLICT (key) DO NOTHING;

-- 13. Add comments
COMMENT ON TABLE public.activity_logs IS 'Tracks all important actions in the system';
COMMENT ON TABLE public.system_settings IS 'Global system configuration';
COMMENT ON COLUMN public.profiles.teacher_approved IS 'Whether teacher account is approved by admin';
COMMENT ON COLUMN public.profiles.is_suspended IS 'Whether user account is suspended';
COMMENT ON COLUMN public.profiles.teacher_approval_status IS 'Status of teacher approval: pending, approved, or rejected';
COMMENT ON FUNCTION public.log_activity IS 'Function to log admin and system activities';

-- 14. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_approval_status ON public.profiles(teacher_approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Admin system migration completed successfully!';
  RAISE NOTICE 'Next step: UPDATE public.profiles SET role = ''admin'' WHERE email = ''your-email@example.com'';';
END $$;
