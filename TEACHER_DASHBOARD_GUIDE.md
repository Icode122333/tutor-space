# Teacher Dashboard - Complete Guide

## Overview
The Teacher Dashboard is the central hub for teachers to manage their courses, students, assignments, and communication. It provides a comprehensive view of all teaching activities and quick access to key features.

---

## 🎯 Main Sections

### 1. **Dashboard** (`/teacher/dashboard`)

#### **Header Section**
- **Welcome Message**: Personalized greeting with teacher's name
- **Search Bar**: Quick search for courses
- **Notifications Bell**: Shows unread notifications (badge with count)
- **Profile Avatar**: Teacher's profile picture with initials fallback

#### **Statistics Cards** (Top Row)
Four key metrics displayed in colored cards:

1. **Total Courses** (Blue)
   - Shows number of active courses created by teacher
   - Icon: BookOpen
   - Subtitle: "Active courses"

2. **Total Students** (Green)
   - Sum of all enrolled students across all courses
   - Icon: Users
   - Subtitle: "Enrolled students"

3. **Total Lessons** (Orange)
   - Count of all lessons across all courses
   - Icon: PlayCircle
   - Subtitle: "Across all courses"

4. **Total Chapters** (Purple)
   - Count of all chapters across all courses
   - Icon: Layers
   - Subtitle: "Across all courses"

#### **Create Course Section**
- Prominent call-to-action card
- Green gradient background
- "Create Course" button redirects to `/create-course`
- Message: "Ready to create a new course? Share your knowledge with students worldwide"

#### **My Courses Section**
Displays all teacher's courses with:

**For Each Course Card:**
- **Thumbnail**: Course image or default icon
- **Title**: Course name (clickable)
- **Level Badge**: Beginner/Intermediate/Advanced
- **Statistics**:
  - Chapters count (blue icon)
  - Lessons count (purple icon)
  - Students enrolled (green icon)
  - Price (if set)

**Actions Menu** (Three dots):
- Edit Course
- Add Chapter
- View Course
- Delete Course (red, with confirmation)

**Quick Action Buttons**:
- Edit (outline)
- Add Content (outline)
- View Course (green)

**Empty State**:
- Shows when no courses exist
- BookOpen icon
- "Create Course" button

#### **Right Sidebar**

**Calendar Widget**:
- Monthly calendar view
- Scheduled classes marked in red
- Click dates to view details
- Navigation arrows for month switching

**Upcoming Classes**:
- Shows next 3 scheduled classes
- Each class shows:
  - Day abbreviation (MON, TUE, etc.)
  - Date number
  - Class title
  - Time range
- Hardcoded examples (can be made dynamic)

---

### 2. **Students** (`/teacher/students`)

#### **Purpose**
Manage all enrolled students across courses and organize them into cohorts.

#### **Header**
- Title: "Students"
- Subtitle: "Manage your students and organize them into cohorts"
- "Create Cohort" button (green)

#### **Statistics Cards**
1. **Total Students**: Count across all courses
2. **Courses**: Number of active courses
3. **Cohorts**: Number of student groups created

#### **Filters Section**
- **Course Dropdown**: Filter by specific course or "All Courses"
- **Search Bar**: Search by student name or email

#### **Students Table**
Displays all enrolled students with:
- **Checkbox**: Select students for cohort creation
- **Avatar**: Student profile picture
- **Name**: Full name
- **Email**: Student email address
- **Course**: Which course they're enrolled in
- **Cohort**: Badge showing cohort name or "No cohort"
- **Enrolled Date**: When they joined

#### **Create Cohort Feature**
- Select multiple students using checkboxes
- Click "Create Cohort" button
- Enter cohort name (e.g., "January 2025 Batch")
- Assigns selected students to the cohort
- Useful for organizing students by:
  - Start date
  - Skill level
  - Location
  - Any custom grouping

#### **Use Cases**
- Track student enrollment
- Organize students into batches
- Filter students by course
- Search for specific students
- Bulk cohort assignment

---

### 3. **Assignments** (`/teacher/assignments`)

#### **Purpose**
Create, manage, and grade student assignment submissions (capstone projects).

#### **Course Selector**
- Dropdown to select which course to view
- Shows "No courses found" if teacher hasn't created any
- Auto-selects first course on load

#### **Statistics Cards** (When Course Selected)
1. **Total Students**: Enrolled in selected course
2. **Submitted**: Number of submissions with completion percentage
3. **Not Submitted**: Students who haven't submitted
4. **Graded**: Number of graded submissions

#### **Assignment Details Card**
Shows capstone project information:
- **Title**: Assignment name
- **Description**: Assignment details
- **Due Date**: Deadline badge (if set)
- **Edit Assignment Button**: Opens course editor

#### **Two Tabs**

**Tab 1: Submitted** (Green)
Shows students who submitted assignments:

For each submission:
- **Student Avatar & Name**
- **Email Address**
- **Submission Date & Time**
- **Description** (if provided)
- **View Button**: Opens document in Google Docs Viewer
  - Handles both external URLs and Supabase Storage files
  - Creates signed URLs automatically
  - Opens in new tab
- **Marks Input Field**: 
  - Label: "Marks (0-100)"
  - Number input (0-100 validation)
  - Centered text
- **Save Button**: 
  - Saves grade to database
  - Updates `graded_at` timestamp
  - Shows success toast
- **Status Badge**:
  - Green "Graded: X/100" if graded
  - Orange "Not Graded" if pending

**Tab 2: Not Submitted** (Orange)
Shows students who haven't submitted:
- Student avatar and name
- Email address
- Orange "Pending" badge with alert icon
- Empty state: "All students have submitted!" with green checkmark

#### **No Assignment State**
When course has no capstone project:
- Large FileText icon
- "No Assignment Created Yet" message
- Explanation text
- "Create Assignment" button (redirects to course editor)

#### **How It Works**
1. Teacher creates capstone project in course editor
2. Students submit files via upload widget
3. Files stored in Supabase Storage (`lesson-files` bucket)
4. Teacher views submissions here
5. Teacher clicks "View" to open in Google Docs
6. Teacher enters marks (0-100)
7. Teacher clicks "Save"
8. Grade automatically appears on student's dashboard

---

### 4. **Grades** (`/teacher/grades`)

#### **Purpose**
View quiz scores and grade assignments for all students in a course.

#### **Course Selector**
Same as Assignments section

#### **Two Tabs**

**Tab 1: Quiz Marks**
- Uses `GradesTable` component
- Shows auto-graded quiz results
- Displays:
  - Student name
  - Course name
  - Quiz title
  - Score (X/Y points)
  - Percentage
  - Pass/Fail status
  - Submission date
- Filters:
  - By course
  - By student
  - By quiz
  - By pass/fail status

**Tab 2: Assignments**

**Statistics Cards**:
1. **Total Students**: In selected course
2. **Class Average**: Overall grade average with letter grade
3. **Graded Assignments**: Count of graded vs total submissions

**Grades Table**:
Comprehensive view of all students:

Columns:
- **Student**: Avatar, name, email
- **Quiz Average**: 
  - Percentage with color coding
  - Click to view individual quiz attempts
  - Shows number of quizzes taken
- **Assignment**: Grade out of 100
- **Overall Grade**: 
  - Weighted average (50% quiz, 50% assignment)
  - Large, bold display
  - Color-coded by performance
- **Letter Grade**: A, B, C, D, F badge
- **Actions**: "Grade" or "Edit Grade" button

**Color Coding**:
- 90-100%: Green (A)
- 80-89%: Blue (B)
- 70-79%: Yellow (C)
- 60-69%: Orange (D)
- Below 60%: Red (F)

**Grade Assignment Dialog**:
- Opens when clicking "Grade" button
- Shows student name
- Input field for grade (0-100)
- Textarea for feedback (optional)
- Save button updates database
- Feedback visible to student

**Quiz Attempts Dialog**:
- Opens when clicking quiz count
- Shows all quiz attempts for student
- Each attempt displays:
  - Quiz title
  - Date and time
  - Score (X/Y points)
  - Percentage
  - Pass/Fail badge
- Sorted by most recent first

#### **Grading Formula**
```
Overall Grade = (Quiz Average × 0.5) + (Assignment Grade × 0.5)
```

If only one component exists:
- Only quizzes: Overall = Quiz Average
- Only assignment: Overall = Assignment Grade

---

### 5. **Schedule** (`/teacher/schedule`)

#### **Purpose**
View and manage scheduled classes and events.

#### **Features** (To be implemented)
- Calendar view of all scheduled classes
- Create new class sessions
- Edit existing schedules
- Set recurring classes
- Add class descriptions and materials
- Send notifications to students

#### **Current State**
- Basic calendar widget on dashboard
- Scheduled classes shown in upcoming section
- Full schedule page needs implementation

---

### 6. **Chat Group** (`/teacher/chat`)

#### **Purpose**
Communicate with students via WhatsApp groups and direct messages.

#### **Top Section: Course Group Management**

**Course Widget** (Green gradient card):
- Shows current course name
- Carousel navigation (left/right arrows)
- "Open Group Chat" button
- Illustration image

**Group Chat Dialog**:
Opens when clicking "Open Group Chat":

**Course Selection**:
- Radio buttons for each course
- Shows course name
- Badge indicating link status:
  - Green "Linked" if WhatsApp link exists
  - Orange "No Link" if not set

**For Courses WITH Link**:
- Shows green notification box
- Displays existing WhatsApp link
- "Open Chat" button opens link in new tab

**For Courses WITHOUT Link**:
- Shows orange notification box
- Input field for WhatsApp link
- Instructions on how to get the link:
  1. Open WhatsApp and create group
  2. Tap group name
  3. Tap "Invite via link"
  4. Copy and paste link
- "Save Link" button stores link in database

#### **Bottom Section: Direct Messages**

**Three-Column Layout**:

**Left Sidebar** (Green background):
- Title: "Student Messages"
- Unread count badge
- Search bar for students
- List of conversations:
  - Student avatar
  - Student name
  - Last message preview
  - Timestamp
  - Unread count badge
  - Online indicator (green dot)
- Click to open conversation

**Middle Section** (Chat Area):
- **Header**:
  - Student avatar and name
  - "Student" status with green dot
- **Messages Area**:
  - Date separators
  - Message bubbles:
    - Teacher messages: Green, right-aligned
    - Student messages: Blue, left-aligned
  - Timestamps
  - Smooth scrolling
  - Auto-scroll to latest
- **Input Area**:
  - Text input field
  - Send button (purple)
  - Enter to send, Shift+Enter for new line

**Empty States**:
- No conversations: "No student messages yet"
- No conversation selected: "Select a conversation to start messaging"

#### **How It Works**
1. Students initiate conversations from their dashboard
2. Conversations appear in teacher's chat list
3. Teacher clicks student to open chat
4. Real-time messaging (currently manual refresh)
5. Unread messages tracked automatically
6. Messages marked as read when viewed

---

### 7. **Settings** (`/teacher/settings`)

#### **Purpose**
Manage account preferences and security settings.

#### **Sections**

**1. Language**
- Globe icon
- Dropdown selector
- Options: English, Français (French)
- Saves to localStorage
- Shows success toast on change

**2. Security**
- Lock icon
- **Reset Password**:
  - Opens dialog
  - Enter email address
  - Sends password reset link
  - Link redirects to reset page
  - Email sent via Supabase Auth

**3. Privacy & Legal**
- Shield icon
- "Privacy Policy" button
- Redirects to `/privacy-policy`

**4. Danger Zone** (Red border)
- **Sign Out**:
  - Red button
  - Confirmation dialog
  - "Are you sure?" message
  - Signs out and redirects to `/auth`
  - Clears session

#### **Dark Mode Support**
- All sections support dark mode
- Automatic theme detection
- Smooth transitions

---

## 🎨 Design System

### **Color Scheme**
- **Primary Green**: `#006d2c` (DataPlus brand color)
- **Dark Green**: `#005523` (hover states)
- **Background**: `#133223` (sidebar)
- **Success**: Green shades
- **Warning**: Orange shades
- **Error**: Red shades
- **Info**: Blue shades

### **Icons**
All icons from `lucide-react`:
- Home, Users, FileText, Award, Calendar
- MessageSquare, Settings, BookOpen, GraduationCap
- Plus, Edit, Trash2, Eye, Check, AlertCircle
- And many more...

### **Typography**
- **Headers**: Bold, 2xl-3xl
- **Subheaders**: Medium, lg-xl
- **Body**: Regular, sm-base
- **Captions**: xs, muted-foreground

### **Components**
All from `shadcn/ui`:
- Cards, Buttons, Badges, Avatars
- Dialogs, Dropdowns, Tabs, Tables
- Inputs, Selects, Textareas
- Calendar, Progress, Separator
- And 40+ more components

---

## 🔄 Data Flow

### **Authentication**
1. User logs in via `/auth`
2. Supabase Auth creates session
3. `useAuth` hook provides user data
4. Profile fetched from `profiles` table
5. Role checked (must be "teacher")
6. Onboarding status verified
7. Dashboard loads

### **Course Data**
```
Teacher creates course → Stored in `courses` table
  ↓
Add chapters → Stored in `course_chapters` table
  ↓
Add lessons → Stored in `course_lessons` table
  ↓
Add quizzes → Stored in `lesson_quiz_questions` table
  ↓
Add capstone → Stored in `capstone_projects` table
```

### **Student Enrollment**
```
Student enrolls → `course_enrollments` table
  ↓
Takes quizzes → `student_quiz_attempts` table
  ↓
Submits assignment → `capstone_submissions` table
  ↓
Teacher grades → Updates `grade` field
  ↓
Grade appears on student dashboard
```

### **Real-time Updates**
Currently using manual refresh:
- Fetch data on page load
- Refetch after actions
- Can be upgraded to Supabase Realtime subscriptions

---

## 📊 Database Tables Used

### **Core Tables**
- `profiles` - User information
- `courses` - Course data
- `course_chapters` - Chapter organization
- `course_lessons` - Lesson content
- `course_enrollments` - Student enrollments

### **Assessment Tables**
- `lesson_quiz_questions` - Quiz questions
- `student_quiz_attempts` - Quiz results
- `capstone_projects` - Assignment details
- `capstone_submissions` - Student submissions

### **Communication Tables**
- `conversations` - Direct message threads
- `direct_messages` - Individual messages
- `group_chats` - WhatsApp group info

### **Progress Tables**
- `student_lesson_progress` - Lesson completion
- Functions: `calculate_course_progress`, `calculate_chapter_progress`

---

## 🚀 Key Features

### **Course Management**
✅ Create unlimited courses
✅ Add chapters and lessons
✅ Multiple content types (video, PDF, quiz, etc.)
✅ Edit and delete courses
✅ View course statistics

### **Student Management**
✅ View all enrolled students
✅ Organize into cohorts
✅ Filter by course
✅ Search by name/email
✅ Track enrollment dates

### **Assignment Grading**
✅ View all submissions
✅ Open documents in Google Docs Viewer
✅ Enter marks (0-100)
✅ Add feedback
✅ Track submission status
✅ Auto-sync to student dashboard

### **Grade Management**
✅ View quiz scores (auto-graded)
✅ View assignment grades
✅ Calculate overall grades
✅ Letter grade assignment
✅ Class average calculation
✅ Individual quiz attempt history

### **Communication**
✅ WhatsApp group integration
✅ Direct messaging with students
✅ Unread message tracking
✅ Real-time chat interface
✅ Message history

### **Settings**
✅ Language selection
✅ Password reset
✅ Privacy policy access
✅ Secure sign out

---

## 💡 Tips for Teachers

### **Getting Started**
1. Complete onboarding
2. Create your first course
3. Add chapters and lessons
4. Create capstone project
5. Share course with students

### **Best Practices**
- **Organize courses** into clear chapters
- **Use cohorts** to group students by batch
- **Grade promptly** to keep students motivated
- **Provide feedback** on assignments
- **Check chat** regularly for student questions
- **Update WhatsApp links** for each course

### **Keyboard Shortcuts**
- **Enter**: Send message in chat
- **Shift+Enter**: New line in message
- **Esc**: Close dialogs

### **Mobile Usage**
- Responsive design works on tablets
- Some features better on desktop
- Chat works well on mobile
- Grading easier on larger screens

---

## 🔒 Security & Privacy

### **Access Control**
- Only teachers can access teacher dashboard
- Students redirected to student dashboard
- Row Level Security (RLS) on all tables
- Teachers can only see their own data

### **Data Protection**
- Passwords hashed by Supabase Auth
- Files stored securely in Supabase Storage
- Signed URLs for private files
- Session management handled automatically

### **Privacy**
- Student data protected
- Grades only visible to student and teacher
- Messages encrypted in transit
- GDPR compliant

---

## 🐛 Troubleshooting

### **Common Issues**

**Can't see courses**:
- Check if you created any courses
- Verify you're logged in as teacher
- Check database connection

**Students not showing**:
- Verify students enrolled in course
- Check course selector is set correctly
- Refresh the page

**Grades not saving**:
- Check internet connection
- Verify marks are 0-100
- Check browser console for errors

**Chat not working**:
- Verify student initiated conversation
- Check database permissions
- Refresh to load new messages

**WhatsApp link not saving**:
- Verify link format is correct
- Check you selected a course
- Try again or contact support

---

## 📈 Future Enhancements

### **Planned Features**
- [ ] Real-time notifications
- [ ] Bulk grading
- [ ] Export grades to CSV
- [ ] Advanced analytics dashboard
- [ ] Video conferencing integration
- [ ] Assignment templates
- [ ] Automated reminders
- [ ] Mobile app
- [ ] AI-powered insights
- [ ] Peer review system

---

## 📞 Support

For help or questions:
1. Check this guide first
2. Review error messages
3. Check browser console
4. Contact technical support
5. Report bugs via feedback form

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
