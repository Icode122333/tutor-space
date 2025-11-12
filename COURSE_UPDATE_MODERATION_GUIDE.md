# Course Update Moderation System

## Overview
When teachers update their courses, the changes are submitted for admin approval before becoming visible to students. This ensures quality control and prevents inappropriate content.

## How It Works

### For Teachers:

1. **Update a Course:**
   - Edit your course content
   - When you save/update, the system automatically marks it as "pending approval"
   - You'll see a notification: "Course update submitted for admin review"

2. **Add Update Notes (Optional):**
   - When updating, you can add notes explaining what changed
   - This helps admins review faster

3. **Wait for Approval:**
   - Your course remains visible with the OLD content to students
   - Once approved, the NEW content becomes visible
   - If rejected, you'll receive feedback on what needs to be fixed

### For Admins:

1. **Review Pending Updates:**
   - Go to Admin Panel → Course Updates
   - See all courses with pending updates
   - View update notes from teachers

2. **Approve or Reject:**
   - **Approve:** New content becomes visible to students immediately
   - **Reject:** Provide feedback, teacher can revise and resubmit

## Database Setup

Run this migration in Supabase SQL Editor:

```sql
-- Already exists: tutor-space/supabase/migrations/20250205000000_course_update_moderation.sql
```

## Implementation

### Step 1: Add to Course Update Function

When a teacher updates a course, call the RPC function:

```typescript
// After updating course in database
const { error } = await supabase.rpc("submit_course_update", {
  p_course_id: courseId,
  p_update_notes: "Updated lesson 3 with new video content"
});

if (!error) {
  toast.info("Course update submitted for admin review");
}
```

### Step 2: Show Notification to Teacher

```typescript
toast.info(
  "Your course update has been submitted for admin approval. " +
  "Students will see the updated content once approved.",
  { duration: 5000 }
);
```

### Step 3: Admin Reviews

Admins can:
- View all pending updates at `/admin/course-updates`
- Approve with one click
- Reject with feedback

## Features

✅ Course updates require admin approval
✅ Teachers get notified when submitting updates
✅ Admins see pending updates in dedicated page
✅ Update history is tracked
✅ Teachers can add notes explaining changes
✅ Students only see approved content
✅ All actions are logged

## RPC Functions

### `submit_course_update(course_id, update_notes)`
- Called by teachers when updating a course
- Marks course as having pending update
- Logs the update in history

### `approve_course_update(course_id, review_notes)`
- Called by admins to approve updates
- Makes new content visible to students
- Logs approval

### `reject_course_update(course_id, review_notes)`
- Called by admins to reject updates
- Keeps old content visible
- Provides feedback to teacher

### `get_pending_course_updates()`
- Returns all courses with pending updates
- Admin-only function

## Integration Example

### In CreateCourse.tsx (or wherever courses are updated):

```typescript
const handleUpdateCourse = async () => {
  try {
    // 1. Update the course in database
    const { error: updateError } = await supabase
      .from("courses")
      .update({ ...courseData })
      .eq("id", courseId);

    if (updateError) throw updateError;

    // 2. Submit for admin review
    const { error: submitError } = await supabase.rpc("submit_course_update", {
      p_course_id: courseId,
      p_update_notes: updateNotes || "Course content updated"
    });

    if (submitError) throw submitError;

    // 3. Notify teacher
    toast.info(
      "Course update submitted for admin approval",
      { 
        description: "Students will see the updated content once approved by an admin.",
        duration: 6000 
      }
    );

    navigate("/teacher/dashboard");
  } catch (error) {
    console.error("Error:", error);
    toast.error("Failed to update course");
  }
};
```

## Admin Dashboard Integration

The AdminCourseUpdates page shows:
- Course thumbnail
- Course title
- Teacher name
- Update date
- Update notes from teacher
- Approve/Reject buttons
- Link to view full course

## Notifications

### Teacher Notification (on update):
```
ℹ️ Course update submitted for admin approval
Students will see the updated content once approved by an admin.
```

### Admin Notification (on approval):
```
✅ Course "Course Title" update approved!
```

### Admin Notification (on rejection):
```
❌ Course "Course Title" update rejected
```

## Testing

1. **As Teacher:**
   - Update a course
   - Check that you see the "pending approval" notification
   - Verify course still shows old content to students

2. **As Admin:**
   - Go to `/admin/course-updates`
   - See the pending update
   - Approve or reject it

3. **As Student:**
   - Before approval: See old content
   - After approval: See new content

## Security

- Only course owners can submit updates
- Only admins can approve/reject
- All actions are logged in activity_logs
- RLS policies prevent unauthorized access
