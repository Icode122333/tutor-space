# Assignment Submission RLS Error Fix

## Problem

Students were getting "new row violates row-level security policy" error when trying to submit assignments.

## Root Cause

The system was trying to insert ALL submissions (both regular assignments and capstone projects) into the `capstone_submissions` table, but:

1. **Foreign key constraint failure**: Regular assignments use lesson IDs from `course_lessons`, but `capstone_submissions` expects IDs from `capstone_projects` table
2. **Wrong table**: Regular assignments shouldn't use the capstone submissions table

## Solution

Created a separate submission system for regular assignments:

### 1. New Database Table

Created `assignment_submissions` table specifically for regular assignments:
- References `course_lessons` (lesson_id) instead of `capstone_projects`
- Has same structure as capstone_submissions (grade, feedback, etc.)
- Proper RLS policies for students and teachers

**Migration file:** `20250202000001_create_assignment_submissions.sql`

### 2. Updated AssignmentUploadWidget

Added `submissionType` prop to handle both types:
```typescript
submissionType?: 'assignment' | 'capstone'
```

The widget now:
- Inserts into `assignment_submissions` for regular assignments
- Inserts into `capstone_submissions` for capstone projects
- Uses correct ID field (lesson_id vs capstone_project_id)

### 3. Updated StudentAssignments.tsx

- Added `type` field to Assignment interface
- Fetches from both submission tables separately
- Passes correct `submissionType` to upload widget
- Maps submissions correctly based on type

## Data Flow

### Regular Assignments:
```
Teacher creates lesson (type='assignment') 
  → Stored in course_lessons
  → Student submits 
  → Stored in assignment_submissions (lesson_id)
```

### Capstone Projects:
```
Teacher creates capstone project 
  → Stored in capstone_projects
  → Student submits 
  → Stored in capstone_submissions (capstone_project_id)
```

## Files Modified

1. **New Migration**: `tutor-space/supabase/migrations/20250202000001_create_assignment_submissions.sql`
2. **Component**: `tutor-space/src/components/AssignmentUploadWidget.tsx`
3. **Page**: `tutor-space/src/pages/StudentAssignments.tsx`

## Testing

After applying the migration:

1. Students should be able to submit regular assignments without RLS errors
2. Capstone project submissions should continue working
3. Both types should display correctly with submission status
4. Teachers should be able to view and grade both types

## Next Steps

Run the migration:
```bash
# Apply the new migration to create assignment_submissions table
supabase db push
```

The system now properly handles both assignment types with appropriate database tables and RLS policies.
