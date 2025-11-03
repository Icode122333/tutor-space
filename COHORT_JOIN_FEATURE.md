# Cohort Join Request Feature

## Overview
Students can now browse available cohorts and request to join them. Teachers can review and approve/reject these requests from the Students page.

## What Was Implemented

### 1. Database Schema
**File:** `supabase/migrations/20250203000000_create_cohorts_system.sql`

Created two new tables:
- **cohorts**: Stores cohort information (name, description, course, teacher, dates, max students)
- **cohort_join_requests**: Tracks student requests to join cohorts with status (pending/approved/rejected)

### 2. Join Cohort Dialog Component
**File:** `src/components/JoinCohortDialog.tsx`

Features:
- Displays all active cohorts from the database
- Shows cohort details (course, teacher, start date, enrollment count)
- Indicates when cohorts are full
- Allows students to select a cohort and add an optional message
- Submits join request to the database
- Prevents duplicate requests

### 3. Cohort Join Requests Component
**File:** `src/components/CohortJoinRequests.tsx`

Features:
- Displays all pending join requests for teacher's cohorts
- Shows student information (name, email, avatar)
- Displays cohort and course information
- Shows student's optional message
- Approve button: Adds student to course with cohort name
- Reject button: Marks request as rejected
- Real-time updates after approval/rejection

### 4. Student Dashboard Integration
**File:** `src/pages/StudentDashboard.tsx`

Changes:
- "Join Now" button now opens the cohort dialog instead of navigating to courses
- Added state management for dialog visibility
- Imported and integrated JoinCohortDialog component

### 5. Teacher Students Page Integration
**File:** `src/pages/TeacherStudents.tsx`

Changes:
- Added CohortJoinRequests component at the top of the page
- Teachers can now see and manage join requests alongside their student list

### 6. Translations
**Files:** `src/i18n/locales/en.json`, `src/i18n/locales/fr.json`

Added translations for:
- Dialog title and description
- Cohort information labels
- Status messages (full, spots left)
- Form labels and placeholders
- Success/error messages
- Request management (approve, reject, pending)
- Teacher-facing messages

## How It Works

### For Students:
1. Click "Join Now" button on the dashboard
2. Browse available cohorts with details (course, teacher, start date, spots available)
3. Select a cohort (if not full)
4. Optionally add a message explaining why they want to join
5. Submit the request
6. Receive confirmation
7. Wait for teacher approval

### For Teachers:
1. Navigate to Students page
2. See "Cohort Join Requests" card at the top (if there are pending requests)
3. Review student information and optional message
4. Click "Approve" to:
   - Add student to the course
   - Assign them to the requested cohort
   - Mark request as approved
5. Click "Reject" to decline the request
6. Requests disappear from the list once processed

## Database Structure

### Cohorts Table
```sql
- id: UUID (primary key)
- name: TEXT (cohort name)
- description: TEXT (optional description)
- course_id: UUID (references courses)
- teacher_id: UUID (references profiles)
- start_date: TIMESTAMPTZ
- end_date: TIMESTAMPTZ
- max_students: INTEGER (default 30)
- is_active: BOOLEAN (default true)
```

### Cohort Join Requests Table
```sql
- id: UUID (primary key)
- cohort_id: UUID (references cohorts)
- student_id: UUID (references profiles)
- status: TEXT (pending/approved/rejected)
- message: TEXT (optional student message)
- created_at: TIMESTAMPTZ
```

## Security (RLS Policies)

### Cohorts:
- Anyone can view active cohorts
- Only teachers can create/update/delete their own cohorts

### Join Requests:
- Students can view their own requests
- Teachers can view requests for their cohorts
- Students can create requests
- Teachers can update request status (approve/reject)

## Complete Workflow

1. **Teacher creates a cohort** (on Students page)
   - Selects students
   - Assigns cohort name
   - Students are grouped together

2. **Teacher creates cohort entry in database** (for join requests)
   - Insert cohort record with details
   - Set max_students, start_date, etc.
   - Mark as active

3. **Student requests to join**
   - Clicks "Join Now" on dashboard
   - Browses available cohorts
   - Submits request with optional message

4. **Teacher reviews request**
   - Sees request on Students page
   - Reviews student info and message
   - Approves or rejects

5. **On approval**
   - Student is enrolled in course
   - Cohort name is assigned
   - Request marked as approved

## Future Enhancements

1. **Notifications**
   - Notify teachers of new join requests
   - Notify students when requests are approved/rejected

2. **Cohort Management UI**
   - Create cohorts directly from UI (instead of manual DB insert)
   - Edit cohort details
   - View cohort statistics
   - Deactivate cohorts

3. **Student Dashboard**
   - Show pending request status
   - Allow canceling pending requests
   - Show cohort information after approval

## Testing

To test the feature:

1. Run the migration to create the tables
2. As a teacher, manually insert a cohort in the database (or create the management page first)
3. As a student, click "Join Now" on the dashboard
4. Select a cohort and submit a request
5. Check the database to verify the request was created

## Sample Cohort Data (for testing)

```sql
INSERT INTO public.cohorts (name, description, course_id, teacher_id, start_date, max_students, is_active)
VALUES 
  ('January 2025 Batch', 'Winter cohort starting January 2025', 'your-course-id', 'your-teacher-id', '2025-01-15', 30, true),
  ('February 2025 Evening', 'Evening classes for working professionals', 'your-course-id', 'your-teacher-id', '2025-02-01', 20, true);
```
