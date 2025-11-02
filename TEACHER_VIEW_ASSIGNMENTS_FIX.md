# Teacher View & Grade Assignments Fix

## Problem
Teachers couldn't see or grade student assignment submissions because the TeacherAssignments page was only looking at the `capstone_submissions` table and the old empty `assignments` table.

## Solution
Updated `TeacherAssignments.tsx` to fetch from BOTH submission tables:
- `assignment_submissions` - for regular assignments (from course_lessons)
- `capstone_submissions` - for capstone projects

## Changes Made

### 1. Updated `fetchSubmissions()` Function
Now fetches from both tables:
```typescript
// Get lesson IDs for assignments from course_lessons
const courseLessons = await supabase
  .from("course_lessons")
  .select("id, course_chapters!inner(course_id)")
  .eq("content_type", "assignment")
  .eq("course_chapters.course_id", selectedCourseId);

// Fetch from assignment_submissions table
const assignmentSubmissions = await supabase
  .from("assignment_submissions")
  .select("*, profiles(...)")
  .in("lesson_id", lessonIds);

// Fetch from capstone_submissions table
const capstoneSubmissions = await supabase
  .from("capstone_submissions")
  .select("*, profiles(...)")
  .in("capstone_project_id", capstoneIds);

// Combine and sort by date
const allSubmissions = [...assignmentSubmissions, ...capstoneSubmissions];
```

### 2. Updated `handleSaveInlineGrade()` Function
Now detects which table to update based on submission type:
```typescript
// Determine table based on which ID field exists
const isAssignment = 'lesson_id' in submission;
const tableName = isAssignment ? "assignment_submissions" : "capstone_submissions";

// Update the correct table
await supabase
  .from(tableName)
  .update({ grade, graded_at: new Date().toISOString() })
  .eq("id", submissionId);
```

## How It Works

### Data Flow
1. **Teacher selects a course**
2. **System fetches:**
   - All assignment-type lessons from `course_lessons`
   - All capstone projects from `capstone_projects`
3. **System queries submissions:**
   - `assignment_submissions` for lesson IDs
   - `capstone_submissions` for capstone IDs
4. **Combines and displays** all submissions together
5. **When grading:**
   - Detects submission type by checking for `lesson_id` field
   - Updates the appropriate table

### Submission Type Detection
```typescript
// Assignment submissions have: lesson_id
// Capstone submissions have: capstone_project_id

const isAssignment = 'lesson_id' in submission;
```

## Result

Teachers can now:
- ✅ View all student submissions (both assignments and capstones)
- ✅ See submission details and uploaded files
- ✅ Grade both types of submissions
- ✅ Track which students haven't submitted
- ✅ View statistics for both submission types

## Files Modified
- `tutor-space/src/pages/TeacherAssignments.tsx`

## Testing
1. Teacher creates an assignment in course structure
2. Student submits the assignment
3. Teacher views the Assignments page
4. Teacher should see the submission
5. Teacher can grade it and save
6. Student sees the grade on their Assignments page
