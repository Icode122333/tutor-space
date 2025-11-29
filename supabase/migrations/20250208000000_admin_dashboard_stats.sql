-- Migration: Admin Dashboard Real-Time Statistics
-- This creates functions to get accurate user statistics for the admin dashboard

-- Add last_activity column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_activity'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_activity TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Function to update user activity (called by frontend heartbeat)
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET last_activity = NOW()
  WHERE id = auth.uid();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_user_activity() TO authenticated;

-- Function to get dashboard statistics with online user counts
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  total_users INT;
  total_students INT;
  total_teachers INT;
  pending_teachers INT;
  total_courses INT;
  pending_courses INT;
  suspended_users INT;
  online_students INT;
  online_teachers INT;
  online_users INT;
  active_week INT;
BEGIN
  -- Total counts by role
  SELECT COUNT(*) INTO total_users FROM profiles;
  SELECT COUNT(*) INTO total_students FROM profiles WHERE role = 'student';
  SELECT COUNT(*) INTO total_teachers FROM profiles WHERE role = 'teacher';
  
  -- Pending teacher approvals
  SELECT COUNT(*) INTO pending_teachers 
  FROM profiles 
  WHERE role = 'teacher' AND teacher_approval_status = 'pending';
  
  -- Suspended users
  SELECT COUNT(*) INTO suspended_users 
  FROM profiles 
  WHERE is_suspended = true;
  
  -- Course counts
  SELECT COUNT(*) INTO total_courses FROM courses;
  SELECT COUNT(*) INTO pending_courses 
  FROM courses 
  WHERE approval_status = 'pending';
  
  -- Online users (active in last 5 minutes based on last_activity)
  SELECT COUNT(*) INTO online_students 
  FROM profiles 
  WHERE role = 'student' 
    AND last_activity >= NOW() - INTERVAL '5 minutes';
  
  SELECT COUNT(*) INTO online_teachers 
  FROM profiles 
  WHERE role = 'teacher' 
    AND last_activity >= NOW() - INTERVAL '5 minutes';
  
  online_users := online_students + online_teachers;
  
  -- Active users this week (based on last_activity)
  SELECT COUNT(*) INTO active_week 
  FROM profiles 
  WHERE last_activity >= NOW() - INTERVAL '7 days';
  
  -- Build result JSON
  result := json_build_object(
    'totalUsers', total_users,
    'totalStudents', total_students,
    'totalTeachers', total_teachers,
    'pendingTeachers', pending_teachers,
    'totalCourses', total_courses,
    'pendingCourses', pending_courses,
    'suspendedUsers', suspended_users,
    'onlineStudents', online_students,
    'onlineTeachers', online_teachers,
    'onlineUsers', online_users,
    'activeThisWeek', active_week
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
