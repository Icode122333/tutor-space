# Assignment Zero Count Fix

## Problem Identified

Students were seeing **zero assignments** even though teachers had uploaded assignments in the course structure.

## Root Cause

There were **two separate systems** for assignments that weren't connected:

1. **`course_lessons` table** - Where teachers actually create assignments
   - Teachers create lessons with `content_type = 'assignment'`
   - These are visible in the course structure
   - This is where the data actually exists

2. **`assignments` table** - A separate table that was never populated
   - Students were querying this empty table
   - No sync mechanism existed between the two tables

## The Disconnect

```
Teacher Flow:
Create Course → Add Chapter → Add Lesson (type: assignment) → Stored in course_lessons ✓

Student Flow:
View Assignments → Query assignments table → Empty! ✗
```

## Solution Implemented

Modified `StudentAssignments.tsx` to fetch assignments from the correct source:

### Before:
```typescript
// Queried empty 'assignments' table
supabase
  .from("assignments")
  .select(...)
  .in("course_id", courseIds)
```

### After:
```typescript
// Query 'course_lessons' where content_type = 'assignment'
supabase
  .from("course_lessons")
  .select(`
    id,
    title,
    description,
    course_chapters!inner (
      course_id,
      courses (
        title
      )
    )
  `)
  .eq("content_type", "assignment")
  .in("course_chapters.course_id", courseIds)
```

## Key Changes

1. **Changed data source** from `assignments` table to `course_lessons` table
2. **Added filter** for `content_type = 'assignment'`
3. **Used inner join** with `course_chapters` to get course information
4. **Transformed data** to match expected format

## Result

- Students now see assignments that teachers create in course structure
- No changes needed to teacher workflow
- Assignments display correctly with upload widgets
- Submission tracking works as expected

## Future Consideration

If the `assignments` table is needed for other features, consider:
- Creating a database trigger to sync `course_lessons` (type='assignment') to `assignments` table
- Or deprecating the `assignments` table entirely and using only `course_lessons`

## Files Modified

- `tutor-space/src/pages/StudentAssignments.tsx` - Updated query to fetch from course_lessons
