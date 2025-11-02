# Debug Assignment Submission Issues

## Run These Queries in Supabase SQL Editor

### 1. Check if assignment_submissions table exists
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'assignment_submissions'
);
```

### 2. Check RLS policies on assignment_submissions
```sql
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
WHERE tablename = 'assignment_submissions';
```

### 3. Verify a lesson exists that can be submitted to
```sql
SELECT 
  cl.id as lesson_id,
  cl.title as lesson_title,
  cl.content_type,
  c.id as course_id,
  c.title as course_title
FROM course_lessons cl
JOIN course_chapters ch ON cl.chapter_id = ch.id
JOIN courses c ON ch.course_id = c.id
WHERE cl.content_type = 'assignment'
LIMIT 5;
```

### 4. Check if student is enrolled in a course with assignments
```sql
-- Replace 'YOUR_STUDENT_ID' with actual student user ID
SELECT 
  ce.student_id,
  c.id as course_id,
  c.title as course_title,
  cl.id as lesson_id,
  cl.title as assignment_title
FROM course_enrollments ce
JOIN courses c ON ce.course_id = c.id
JOIN course_chapters ch ON ch.course_id = c.id
JOIN course_lessons cl ON cl.chapter_id = ch.id
WHERE ce.student_id = 'YOUR_STUDENT_ID'
  AND cl.content_type = 'assignment';
```

### 5. Test insert permission (as student)
```sql
-- This should work if RLS is correct
-- Replace with actual student_id and lesson_id
INSERT INTO assignment_submissions (
  lesson_id,
  student_id,
  project_links,
  description
) VALUES (
  'LESSON_ID_HERE',
  auth.uid(), -- Current user
  ARRAY['test/path.pdf'],
  'Test submission'
);
```

## Common Errors and Solutions

### Error: "new row violates row-level security policy"
**Cause**: Student doesn't have permission to insert
**Solution**: Check that the student's auth.uid() matches the student_id being inserted

### Error: "violates foreign key constraint"
**Cause**: The lesson_id doesn't exist in course_lessons table
**Solution**: Verify the lesson exists and is of type 'assignment'

### Error: "duplicate key value violates unique constraint"
**Cause**: Student already submitted to this assignment
**Solution**: Use upsert (which the code already does) or delete old submission first

### Error: "permission denied for table assignment_submissions"
**Cause**: RLS is enabled but no policies allow the operation
**Solution**: Re-run the migration to create policies

## Check Storage Bucket Permissions

In Supabase Dashboard → Storage → lesson-files bucket:
- Check if bucket exists
- Verify RLS policies allow students to upload
- Check if path pattern matches: `capstone-submissions/{id}/{student_id}/{timestamp}.{ext}`

## Frontend Debugging

Add this to AssignmentUploadWidget.tsx before the insert:
```typescript
console.log('Submission data:', {
  submissionType,
  lesson_id: capstoneProjectId,
  student_id: studentId,
  table: submissionType === 'assignment' ? 'assignment_submissions' : 'capstone_submissions'
});
```
