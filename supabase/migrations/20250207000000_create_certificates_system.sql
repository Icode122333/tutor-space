-- =====================================================
-- CERTIFICATES SYSTEM
-- =====================================================

-- 1. CREATE CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  completion_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  grade TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);

-- 2. ADD COMPLETION TRACKING TO ENROLLMENTS
ALTER TABLE public.course_enrollments
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS final_grade TEXT,
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_course_enrollments_completed ON public.course_enrollments(completed);

-- 3. RLS POLICIES FOR CERTIFICATES
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
DROP POLICY IF EXISTS "Anyone can view approved certificates" ON public.certificates;

-- Students can view their own certificates (any status)
CREATE POLICY "Students can view own certificates"
ON public.certificates FOR SELECT TO authenticated
USING (student_id = auth.uid());

-- Admins and teachers can view all certificates
CREATE POLICY "Staff can view all certificates"
ON public.certificates FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
));

-- Admins can insert certificates
CREATE POLICY "Admins can insert certificates"
ON public.certificates FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update certificates
CREATE POLICY "Admins can update certificates"
ON public.certificates FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can delete certificates
CREATE POLICY "Admins can delete certificates"
ON public.certificates FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. RPC FUNCTION: GET STUDENTS WHO COMPLETED COURSE
-- This function finds students who have completed ALL lessons in a course
CREATE OR REPLACE FUNCTION get_course_completions(p_course_id UUID DEFAULT NULL)
RETURNS TABLE (
  enrollment_id UUID,
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  course_id UUID,
  course_title TEXT,
  teacher_name TEXT,
  completed BOOLEAN,
  completion_date TIMESTAMPTZ,
  final_grade TEXT,
  progress_percentage INTEGER,
  certificate_id UUID,
  certificate_status TEXT,
  certificate_url TEXT,
  certificate_approved_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH course_lesson_counts AS (
    -- Count total lessons per course
    SELECT 
      ch.course_id,
      COUNT(cl.id) AS total_lessons
    FROM public.course_chapters ch
    INNER JOIN public.course_lessons cl ON cl.chapter_id = ch.id
    GROUP BY ch.course_id
  ),
  student_completed_lessons AS (
    -- Count completed lessons per student per course
    SELECT 
      slp.student_id,
      ch.course_id,
      COUNT(slp.lesson_id) AS completed_lessons,
      MAX(slp.completed_at) AS last_completed_at
    FROM public.student_lesson_progress slp
    INNER JOIN public.course_lessons cl ON cl.id = slp.lesson_id
    INNER JOIN public.course_chapters ch ON ch.id = cl.chapter_id
    WHERE slp.is_completed = TRUE
    GROUP BY slp.student_id, ch.course_id
  )
  SELECT 
    ce.id AS enrollment_id,
    ce.student_id,
    p.full_name::TEXT AS student_name,
    u.email::TEXT AS student_email,
    ce.course_id,
    c.title::TEXT AS course_title,
    tp.full_name::TEXT AS teacher_name,
    TRUE AS completed,
    scl.last_completed_at AS completion_date,
    ce.final_grade::TEXT,
    100 AS progress_percentage,
    cert.id AS certificate_id,
    cert.status::TEXT AS certificate_status,
    cert.certificate_url::TEXT,
    cert.approved_at AS certificate_approved_at
  FROM public.course_enrollments ce
  INNER JOIN public.profiles p ON ce.student_id = p.id
  INNER JOIN auth.users u ON ce.student_id = u.id
  INNER JOIN public.courses c ON ce.course_id = c.id
  INNER JOIN public.profiles tp ON c.teacher_id = tp.id
  INNER JOIN course_lesson_counts clc ON clc.course_id = ce.course_id
  INNER JOIN student_completed_lessons scl ON scl.student_id = ce.student_id AND scl.course_id = ce.course_id
  LEFT JOIN public.certificates cert ON cert.student_id = ce.student_id AND cert.course_id = ce.course_id
  WHERE 
    scl.completed_lessons >= clc.total_lessons
    AND clc.total_lessons > 0
    AND (p_course_id IS NULL OR ce.course_id = p_course_id)
  ORDER BY scl.last_completed_at DESC;
END;
$$;

-- 5. RPC FUNCTION: APPROVE CERTIFICATE
CREATE OR REPLACE FUNCTION approve_certificate(
  p_student_id UUID,
  p_course_id UUID,
  p_certificate_url TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_certificate_id UUID;
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve certificates';
  END IF;
  
  INSERT INTO public.certificates (
    student_id, course_id, certificate_url, status, approved_by, approved_at, notes, completion_date
  )
  VALUES (
    p_student_id, p_course_id, p_certificate_url, 'approved', v_admin_id, NOW(), p_notes,
    COALESCE((SELECT ce.completion_date FROM public.course_enrollments ce
     WHERE ce.student_id = p_student_id AND ce.course_id = p_course_id), NOW())
  )
  ON CONFLICT (student_id, course_id)
  DO UPDATE SET
    certificate_url = p_certificate_url,
    status = 'approved',
    approved_by = v_admin_id,
    approved_at = NOW(),
    notes = p_notes,
    updated_at = NOW()
  RETURNING id INTO v_certificate_id;
  
  RETURN v_certificate_id;
END;
$$;

-- 6. RPC FUNCTION: MARK COURSE AS COMPLETED
CREATE OR REPLACE FUNCTION mark_course_completed(
  p_student_id UUID,
  p_course_id UUID,
  p_final_grade TEXT DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.course_enrollments
  SET completed = TRUE, completion_date = NOW(), final_grade = p_final_grade, progress_percentage = 100
  WHERE student_id = p_student_id AND course_id = p_course_id;
  
  INSERT INTO public.certificates (student_id, course_id, status, completion_date, grade)
  VALUES (p_student_id, p_course_id, 'pending', NOW(), p_final_grade)
  ON CONFLICT (student_id, course_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- 7. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION get_course_completions TO authenticated;
GRANT EXECUTE ON FUNCTION approve_certificate TO authenticated;
GRANT EXECUTE ON FUNCTION mark_course_completed TO authenticated;
