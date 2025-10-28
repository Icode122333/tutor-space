# Course Structure Analysis - DataPlus Tutor-Space

## Overview
This document provides a comprehensive understanding of the database structure and course creation flow for teachers in the DataPlus Tutor-Space LMS.

---

## Database Schema

### Core Tables

#### 1. **profiles**
- `id` (UUID) - Primary key, references auth.users
- `email` (TEXT)
- `full_name` (TEXT)
- `role` (user_role ENUM: 'student', 'teacher')
- `avatar_url` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 2. **courses**
- `id` (UUID) - Primary key
- `teacher_id` (UUID) - References profiles(id)
- `title` (TEXT)
- `description` (TEXT)
- `thumbnail_url` (TEXT)
- `price` (NUMERIC) - Added in migration 20251005214624
- `requirements` (TEXT) - Added in migration 20251005214624
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Anyone can view courses
- Teachers can create courses (must have teacher role)
- Teachers can update/delete their own courses only

#### 3. **course_chapters**
- `id` (UUID) - Primary key
- `course_id` (UUID) - References courses(id) CASCADE DELETE
- `title` (TEXT)
- `description` (TEXT)
- `order_index` (INTEGER) - For sequencing chapters
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Anyone can view chapters
- Teachers can manage chapters for their courses only

#### 4. **course_lessons**
- `id` (UUID) - Primary key
- `chapter_id` (UUID) - References course_chapters(id) CASCADE DELETE
- `title` (TEXT)
- `description` (TEXT)
- `content_type` (TEXT) - 'video', 'pdf', 'document', 'url', 'quiz'
- `content_url` (TEXT) - URL to content (empty for quizzes)
- `duration` (INTEGER) - Duration in minutes (for videos)
- `order_index` (INTEGER) - For sequencing lessons
- `is_mandatory` (BOOLEAN) - If true (for quizzes), students must pass to proceed
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies:**
- Anyone can view lessons
- Teachers can manage lessons for their chapters only

---

### Progress Tracking Tables

#### 5. **student_lesson_progress**
- `id` (UUID) - Primary key
- `student_id` (UUID) - References profiles(id) CASCADE DELETE
- `lesson_id` (UUID) - References course_lessons(id) CASCADE DELETE
- `is_completed` (BOOLEAN)
- `started_at` (TIMESTAMPTZ)
- `completed_at` (TIMESTAMPTZ)
- `last_position` (INTEGER) - For video position tracking
- **UNIQUE(student_id, lesson_id)**

**RLS Policies:**
- Students can view their own progress
- Teachers can view progress for their course students
- Students can manage their own progress

#### 6. **lesson_quiz_questions**
- `id` (UUID) - Primary key
- `lesson_id` (UUID) - References course_lessons(id) CASCADE DELETE
- `question_text` (TEXT)
- `options` (JSONB) - Array: [{"id": "a", "text": "Option A"}, ...]
- `correct_answer` (TEXT) - "a", "b", "c", or "d"
- `explanation` (TEXT) - Optional explanation
- `order_index` (INTEGER)
- `points` (INTEGER)
- `created_at` (TIMESTAMPTZ)

**RLS Policies:**
- Anyone can view quiz questions
- Teachers can manage quiz questions for their lessons

#### 7. **student_quiz_attempts**
- `id` (UUID) - Primary key
- `student_id` (UUID) - References profiles(id) CASCADE DELETE
- `lesson_id` (UUID) - References course_lessons(id) CASCADE DELETE
- `answers` (JSONB) - {"question_id": "selected_answer_id", ...}
- `score` (INTEGER)
- `total_points` (INTEGER)
- `passed` (BOOLEAN)
- `started_at`, `submitted_at` (TIMESTAMPTZ)

**RLS Policies:**
- Students can view/create/update their own quiz attempts
- Teachers can view quiz attempts for their courses

---

### Capstone Project Tables

#### 8. **capstone_projects**
- `id` (UUID) - Primary key
- `course_id` (UUID) - References courses(id) CASCADE DELETE
- `title` (TEXT)
- `description` (TEXT)
- `instructions` (TEXT)
- `requirements` (TEXT[]) - Array of requirements
- `due_date` (TIMESTAMPTZ)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- **UNIQUE(course_id)** - One capstone per course

**RLS Policies:**
- Anyone can view capstone projects
- Teachers can manage capstone projects for their courses

#### 9. **capstone_submissions**
- `id` (UUID) - Primary key
- `capstone_project_id` (UUID) - References capstone_projects(id) CASCADE DELETE
- `student_id` (UUID) - References profiles(id) CASCADE DELETE
- `project_links` (TEXT[]) - Array of project URLs
- `description` (TEXT)
- `submitted_at` (TIMESTAMPTZ)
- `grade` (INTEGER) - Out of 100
- `feedback` (TEXT) - Teacher feedback
- `graded_at` (TIMESTAMPTZ)
- `graded_by` (UUID) - References profiles(id)
- **UNIQUE(capstone_project_id, student_id)**

**RLS Policies:**
- Students can view/manage their own submissions
- Teachers can view submissions and update for grading

---

### Other Related Tables

#### 10. **course_enrollments**
- `id`, `course_id`, `student_id`, `enrolled_at`
- **UNIQUE(course_id, student_id)**

#### 11. **course_materials**
- `id`, `course_id`, `title`, `description`, `file_url`, `file_type`, `uploaded_at`

#### 12. **assignments**
- `id`, `course_id`, `title`, `description`, `due_date`, `max_score`, `created_at`

#### 13. **assignment_submissions**
- `id`, `assignment_id`, `student_id`, `submission_text`, `file_url`, `score`, `feedback`, `submitted_at`, `graded_at`

#### 14. **quizzes** (Old separate quiz system)
- Separate from lesson quizzes
- `id`, `course_id`, `title`, `description`, `time_limit`, `max_score`, `created_at`

#### 15. **quiz_questions** (Old system)
- Different from lesson_quiz_questions
- Multiple question types: 'multiple_choice', 'true_false', 'short_answer'

#### 16. **quiz_attempts** (Old system)
- For standalone quizzes, not lesson quizzes

---

## Database Functions

### 1. **calculate_course_progress(p_student_id UUID, p_course_id UUID)**
Returns:
- `total_lessons` (INTEGER)
- `completed_lessons` (INTEGER)
- `progress_percentage` (NUMERIC) - 0-100

Calculates overall course completion for a student.

### 2. **calculate_chapter_progress(p_student_id UUID, p_chapter_id UUID)**
Returns:
- `total_lessons` (INTEGER)
- `completed_lessons` (INTEGER)
- `progress_percentage` (NUMERIC) - 0-100
- `all_completed` (BOOLEAN)

Calculates chapter-level completion for a student.

### 3. **update_updated_at_column()**
Trigger function that automatically updates `updated_at` timestamps.

---

## How Teachers Create Courses

### Course Creation Flow (src/pages/CreateCourse.tsx)

#### Step 1: Course Details
Teacher provides:
- **Title** (required)
- **Description** (required)
- **Price** (required, numeric)
- **Thumbnail URL** (optional)
- **Requirements** (optional, text)

#### Step 2: Course Content (Chapters & Lessons)
Teachers can add multiple chapters, each containing:

**Chapter Fields:**
- Title (required)
- Description (optional)
- order_index (auto-assigned)

**Lesson Fields:**
- Title (required)
- Content Type (required): video | pdf | document | url | quiz
- Content URL (required for non-quiz types)
- Duration (for videos, in minutes)
- Description (optional)
- order_index (auto-assigned)

**For Quiz Lessons:**
- `is_mandatory` checkbox - if checked, students must pass to proceed
- Multiple quiz questions, each with:
  - Question text
  - 4 options (A, B, C, D)
  - Correct answer (radio button selection)
  - Explanation (optional)
  - Points (default: 1)

#### Step 3: Capstone Project (Optional)
Teacher can optionally add a capstone project:
- Title (required if included)
- Description (required if included)
- Instructions (required if included)
- Requirements (array, can add multiple)
- Due Date (optional)

#### Step 4: Submission
On submit, the system:
1. Creates/updates the course record
2. Creates all chapters in sequence
3. For each chapter, creates all lessons in sequence
4. For quiz lessons, inserts all quiz questions
5. If capstone included, creates capstone project record

**Edit Mode:**
- When editing, system fetches all existing data
- On update, deletes all existing chapters/lessons
- Rebuilds structure from scratch with new data

---

## Content Types Explained

### 1. **Video**
- Content URL: YouTube URL or direct video link
- Duration tracking: Minutes field
- Auto-embedded in app via EmbeddedContentViewer component
- Progress marked complete when viewed

### 2. **PDF Document**
- Content URL: Direct PDF link
- Opens embedded in app viewer
- Progress marked complete when opened

### 3. **Document (DOC/DOCX)**
- Content URL: Direct document link
- Opens embedded in app viewer
- Progress marked complete when opened

### 4. **External URL**
- Content URL: Any external website/resource
- Opens in new tab (due to iframe restrictions)
- Progress marked complete when link clicked

### 5. **Quiz**
- No content URL (questions stored in lesson_quiz_questions)
- Multiple choice questions with auto-grading
- Pass threshold: 60% (configurable)
- If mandatory, blocks next lesson until passed
- Progress marked complete when passed

---

## Key Features

### Progress Tracking
- ✅ Per-lesson completion tracking
- ✅ Chapter-level progress calculation
- ✅ Course-level progress calculation
- ✅ "Completed" badges on finished content
- ✅ Video position saving (last_position field)

### Quiz System
- ✅ Inline quiz lessons within chapters
- ✅ Auto-grading with immediate feedback
- ✅ Mandatory quizzes block progression
- ✅ Multiple attempts allowed
- ✅ Score history tracked in student_quiz_attempts

### Capstone Projects
- ✅ One capstone per course
- ✅ Students submit multiple project links
- ✅ Teacher grading with feedback
- ✅ Grade out of 100
- ✅ Optional due dates

### Security (RLS)
- ✅ Teachers can only manage their own courses
- ✅ Students can only view enrolled courses' full content
- ✅ Public can browse course listings
- ✅ Students can only modify their own progress/submissions
- ✅ Teachers can view student progress for their courses

---

## Migration Timeline

1. **20250930184305** - Core system (profiles, courses, enrollments, materials, assignments, quizzes, chat)
2. **20250930184331** - Fix search_path for update_updated_at_column function
3. **20251005214624** - Add course chapters & lessons structure (video, pdf, document)
4. **20251020020000** - Extend with quiz lessons, progress tracking, capstone projects (url, quiz content types)

---

## Data Relationships

```
profiles (teacher)
    ↓
courses
    ↓
├─ course_chapters
│   ↓
│   course_lessons
│       ↓
│       ├─ lesson_quiz_questions (if content_type='quiz')
│       ├─ student_lesson_progress (tracks completion)
│       └─ student_quiz_attempts (quiz results)
│
├─ capstone_projects
│   ↓
│   capstone_submissions
│
├─ course_enrollments (students enrolled)
├─ course_materials (additional files)
├─ assignments (separate from lessons)
└─ group_chats (course communication)
```

---

## Current State Summary

✅ **Fully Implemented:**
- Chapter/lesson hierarchy
- 5 content types (video, pdf, doc, url, quiz)
- Quiz builder with multiple choice questions
- Progress tracking (lesson, chapter, course level)
- Mandatory quiz blocking
- Capstone project system
- Teacher course creation/editing UI
- Auto-grading quizzes
- RLS security policies

📌 **Note:** There are TWO quiz systems:
1. **Old system**: Standalone quizzes table (not tied to lessons)
2. **New system**: lesson_quiz_questions (integrated into course structure)

Both exist in the database, but the CreateCourse UI uses the new system exclusively.

---

## Ready for Restructuring

Now that you understand the current structure, you can proceed with your restructuring plans. Key considerations:

1. **Keep or merge quiz systems?** (standalone vs lesson-based)
2. **Simplify chapter/lesson creation flow?**
3. **Additional content types needed?**
4. **Enhanced progress tracking features?**
5. **Better capstone project workflows?**

Let me know what restructuring you'd like to tackle!
