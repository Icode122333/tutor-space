# Admin Course Management

## Overview
Admins can now view all courses in the system and delete any course with full confirmation and logging.

## Features

### 1. View All Courses
- See complete list of all courses
- Filter by approval status (All, Approved, Pending, Rejected)
- Search by course title or teacher name
- View course details including:
  - Course title and description
  - Teacher name and email
  - Approval status
  - Featured status
  - Creation date

### 2. Delete Courses
- Delete any course with confirmation dialog
- Cascading deletion removes all related data:
  - Course chapters and lessons
  - Course enrollments
  - Course assignments
  - Course quizzes
  - Student progress
  - All related records
- Action is logged in activity_logs
- Cannot be undone

### 3. Other Actions
- **Approve Course:** Approve pending courses
- **Toggle Featured:** Mark/unmark courses as featured
- **View Course:** Navigate to course detail page

## How to Use

### As Admin:

1. **View All Courses:**
   - Go to Admin Panel → All Courses
   - Browse the complete course list
   - Use search to find specific courses
   - Filter by status

2. **Delete a Course:**
   - Find the course you want to delete
   - Click the "Delete" button (red trash icon)
   - Confirm deletion in the dialog
   - Course and all related data will be permanently deleted

3. **Approve Pending Courses:**
   - Filter by "Pending" status
   - Click "Approve" button for courses that meet quality standards

4. **Feature Courses:**
   - Click the star icon to toggle featured status
   - Featured courses appear prominently to students

## Database Setup

Run this migration in Supabase SQL Editor:

```sql
-- Copy content from: tutor-space/supabase/migrations/20250205000004_admin_delete_course.sql
```

This creates:
- `admin_delete_course(course_id)` RPC function
- RLS policy allowing admins to delete courses
- Automatic activity logging

## Security

- Only admins can delete courses
- Deletion requires confirmation
- All deletions are logged with:
  - Admin user ID
  - Course ID
  - Timestamp
  - Action type
- RPC function uses `SECURITY DEFINER` for proper permissions

## What Gets Deleted

When a course is deleted, the following are automatically removed (CASCADE):

✅ Course record
✅ All chapters
✅ All lessons
✅ All quizzes and questions
✅ All assignments
✅ All enrollments
✅ All student progress
✅ All course-related activity logs
✅ Course update history
✅ Course approvals

## Confirmation Dialog

Before deletion, admins see:
- Course title
- Warning that action cannot be undone
- List of what will be deleted
- Cancel and Confirm buttons

## Activity Logging

Every course deletion is logged with:
```json
{
  "user_id": "admin-uuid",
  "action": "course_deleted_by_admin",
  "entity_type": "course",
  "entity_id": "course-uuid",
  "created_at": "timestamp"
}
```

## UI Features

### Course Table Columns:
1. **Course** - Title and description
2. **Teacher** - Name and email
3. **Status** - Approval status badge
4. **Featured** - Star toggle button
5. **Created** - Creation date
6. **Actions** - Approve, View, Delete buttons

### Filters:
- **Search** - By course title or teacher name
- **Status** - All, Approved, Pending, Rejected

### Action Buttons:
- **Approve** (green) - For pending courses
- **View** (outline) - Navigate to course page
- **Delete** (red) - Delete course with confirmation

## Best Practices

1. **Before Deleting:**
   - Verify it's the correct course
   - Check if students are enrolled
   - Consider archiving instead of deleting (future feature)

2. **Communication:**
   - Notify the teacher before deleting their course
   - Provide reason for deletion
   - Offer opportunity to fix issues

3. **Alternatives to Deletion:**
   - Reject course approval
   - Suspend teacher account
   - Mark course as inactive (future feature)

## Testing

1. **View Courses:**
   - Go to `/admin/courses`
   - Verify all courses are visible
   - Test search and filters

2. **Delete Course:**
   - Click delete on a test course
   - Verify confirmation dialog appears
   - Confirm deletion
   - Verify course is removed
   - Check activity logs

3. **Verify Cascade:**
   - Create a course with enrollments
   - Delete the course
   - Verify enrollments are also deleted

## Error Handling

- If deletion fails, user sees error toast
- Console logs error details
- Transaction rolls back (nothing deleted)
- User can retry

## Future Enhancements

- Soft delete (archive) instead of hard delete
- Bulk delete multiple courses
- Export course data before deletion
- Restore deleted courses (within timeframe)
- Email notifications to affected users
