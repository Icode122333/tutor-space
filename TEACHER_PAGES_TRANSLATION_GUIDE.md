# Teacher Pages Translation Implementation Guide

## Overview
This guide provides step-by-step instructions to translate all 6 teacher pages from English to French.

---

## Translation Keys Added ✅

All necessary translation keys have been added to:
- `src/i18n/locales/en.json` - English translations
- `src/i18n/locales/fr.json` - French translations

Under the `teacher` namespace with sub-sections:
- `teacher.dashboard` - Dashboard page translations
- `teacher.chat` - Chat page translations
- `teacher.grades` - Grades page translations
- `teacher.settings` - Settings page translations
- `teacher.students` - Students page translations
- `teacher.assignments` - Assignments page translations

---

## Pages to Translate

### 1. TeacherDashboard.tsx
**Status:** Ready to translate  
**Priority:** High  
**Estimated Time:** 15 minutes

**Steps:**
1. Add import: `import { useTranslation } from 'react-i18next';`
2. Add hook: `const { t } = useTranslation();`
3. Add LanguageSelector to header
4. Replace hardcoded strings with `t()` calls

**Key Translations Needed:**
```typescript
// Header
"Welcome Back, {name}!" → t('teacher.dashboard.welcomeBack') + ", " + name + "!"
"Here's what's happening..." → t('teacher.dashboard.happeningToday')
"Search courses..." → t('teacher.dashboard.searchCourses')

// Stats Cards
"Total Courses" → t('teacher.dashboard.totalCourses')
"Active courses" → t('teacher.dashboard.activeCourses')
"Total Students" → t('teacher.dashboard.totalStudents')
"Enrolled students" → t('teacher.dashboard.enrolledStudents')
"Total Lessons" → t('teacher.dashboard.totalLessons')
"Total Chapters" → t('teacher.dashboard.totalChapters')
"Across all courses" → t('teacher.dashboard.acrossAllCourses')

// Create Course Section
"Ready to create a new course?" → t('teacher.dashboard.readyToCreate')
"Share your knowledge..." → t('teacher.dashboard.shareKnowledge')
"Create Course" → t('courses.createCourse')

// My Courses
"My Courses" → t('teacher.dashboard.myCourses')
"Manage and edit your courses" → t('teacher.dashboard.manageEdit')
"No courses yet" → t('teacher.dashboard.noCourses')
"Create your first course..." → t('teacher.dashboard.createFirst')

// Actions
"Edit Course" → t('teacher.dashboard.editCourse')
"Add Chapter" → t('teacher.dashboard.addChapter')
"Add Content" → t('teacher.dashboard.addContent')
"View Course" → t('teacher.dashboard.viewCourse')
"Delete Course" → t('teacher.dashboard.deleteCourse')
"Are you sure..." → t('teacher.dashboard.deleteConfirm')

// Course Stats
"Chapters" → t('teacher.dashboard.chapters')
"Lessons" → t('teacher.dashboard.lessons')
"Students" → t('teacher.dashboard.students')

// Calendar
"Calendar" → t('teacher.dashboard.calendar')
"Upcoming Classes" → t('teacher.dashboard.upcomingClasses')
```

---

### 2. TeacherChat.tsx
**Status:** Ready to translate  
**Priority:** High  
**Estimated Time:** 15 minutes

**Key Translations:**
```typescript
// Header Widget
"Course Group Management" → t('teacher.chat.courseGroupManagement')
"Manage your course group chat..." → t('teacher.chat.manageGroupChat')
"Open Group Chat" → t('teacher.chat.openGroupChat')

// Sidebar
"Student Messages" → t('teacher.chat.studentMessages')
"Search students" → t('teacher.chat.searchStudents')
"No student messages yet" → t('teacher.chat.noStudentMessages')
"new" → t('chat.newMessages')

// Chat Area
"Select a conversation" → t('teacher.chat.selectConversation')
"Choose a student..." → t('teacher.chat.chooseStudent')
"Student" → t('teacher.chat.student')
"Message" → t('chat.message')

// Dialog
"Manage Course Group Chats" → t('teacher.chat.manageGroupChats')
"Select a course to create..." → t('teacher.chat.selectCourseToManage')
"Select Course" → t('teacher.chat.selectCourse')
"Linked" → t('teacher.chat.linked')
"No Link" → t('teacher.chat.noLink')
"WhatsApp Link Connected" → t('teacher.chat.whatsappLinked')
"This course already has..." → t('teacher.chat.alreadyHasLink')
"No WhatsApp link found..." → t('teacher.chat.noLinkFound')
"Add one below..." → t('teacher.chat.addLinkBelow')
"WhatsApp Group Link" → t('teacher.chat.whatsappGroupLink')
"How to get the link:" → t('teacher.chat.howToGetLink')
"Open WhatsApp and create..." → t('teacher.chat.step1')
"Tap on the group name..." → t('teacher.chat.step2')
"Tap 'Invite via link'" → t('teacher.chat.step3')
"Copy and paste..." → t('teacher.chat.step4')
"Open Chat" → t('teacher.chat.openChat')
"Save Link" → t('teacher.chat.saveLink')
```

---

### 3. TeacherGrades.tsx
**Status:** Ready to translate  
**Priority:** High  
**Estimated Time:** 15 minutes

**Key Translations:**
```typescript
// Header
"Grades" → t('nav.grades')
"View quiz scores and grade assignments" → t('teacher.grades.viewQuizScores')

// Course Selector
"Select Course" → t('teacher.grades.selectCourse')
"Choose a course to view..." → t('teacher.grades.chooseToView')
"No courses found" → t('teacher.grades.noCoursesFound')
"Create Your First Course" → t('teacher.grades.createFirstCourse')

// Tabs
"Quiz Marks" → t('teacher.grades.quizMarks')
"Assignments" → t('nav.assignments')

// Stats
"Total Students" → t('teacher.dashboard.totalStudents')
"Class Average" → t('teacher.grades.classAverage')
"Graded Assignments" → t('teacher.grades.gradedAssignments')
"submissions" → t('teacher.grades.submissions')

// Table
"Student Grades" → t('teacher.grades.studentGrades')
"Quiz scores are auto-calculated..." → t('teacher.grades.autoCalculated')
"No students enrolled..." → t('teacher.grades.noStudentsEnrolled')
"Student" → t('teacher.grades.student')
"Quiz Average" → t('teacher.grades.quizAverage')
"Assignment" → t('teacher.grades.assignment')
"Overall Grade" → t('teacher.grades.overallGrade')
"Letter" → t('teacher.grades.letter')
"quizzes" → t('teacher.grades.quizzes')
"Edit Grade" → t('teacher.grades.editGrade')
"Grade" → t('teacher.grades.grade')

// Dialog
"Grade Assignment" → t('teacher.grades.gradeAssignment')
"Grade {name}'s capstone submission" → t('teacher.grades.gradeSubmission', { name })
"Feedback (Optional)" → t('assignments.feedback')
"Provide feedback..." → t('teacher.grades.provideFeedback')
"Save Grade" → t('teacher.grades.saveGrade')
"Saving..." → t('teacher.grades.saving')

// Quiz Dialog
"Quiz Attempts" → t('teacher.grades.quizAttempts')
"{name}'s quiz history" → t('teacher.grades.quizHistory', { name })
"No quiz attempts found" → t('teacher.grades.noQuizAttempts')
"Passed" → t('grades.passed')
"Failed" → t('grades.failed')
```

---

### 4. TeacherSettings.tsx
**Status:** Ready to translate  
**Priority:** Medium  
**Estimated Time:** 10 minutes

**Key Translations:**
```typescript
// Header
"Settings" → t('nav.settings')
"Manage your account preferences" → t('teacher.settings.managePreferences')

// Language Section
"Language" → t('settings.language')
"Choose your preferred language" → t('teacher.settings.chooseLanguage')
"Select Language" → t('teacher.settings.selectLanguage')
"English" → t('settings.english')
"Français (French)" → t('settings.french')

// Security Section
"Security" → t('settings.security')
"Manage your account security" → t('teacher.settings.manageAccountSecurity')
"Reset Password" → t('teacher.settings.resetPassword')
"Send a password reset link..." → t('teacher.settings.sendResetLink')
"Reset" → t('teacher.settings.reset')
"Enter your email address..." → t('teacher.settings.enterEmailForReset')
"Sending..." → t('teacher.settings.sending')
"Send Reset Link" → t('teacher.settings.sendResetLinkBtn')

// Privacy Section
"Privacy & Legal" → t('teacher.settings.privacyLegal')
"Review our policies and terms" → t('teacher.settings.reviewPolicies')
"Privacy Policy" → t('nav.privacyPolicy')

// Danger Zone
"Danger Zone" → t('teacher.settings.dangerZone')
"Sign out of your account" → t('teacher.settings.signOutAccount')
"Sign Out" → t('nav.signOut')
"Are you sure?" → t('teacher.settings.areYouSure')
"You will be signed out..." → t('teacher.settings.signOutRedirect')
"Signing out..." → t('teacher.settings.signingOut')
```

---

### 5. TeacherStudents.tsx
**Status:** Ready to translate  
**Priority:** Medium  
**Estimated Time:** 15 minutes

**Key Translations:**
```typescript
// Header
"Students" → t('nav.students')
"Manage your students..." → t('teacher.students.manageStudents')
"Create Cohort" → t('teacher.students.createCohort')

// Stats Cards
"Total Students" → t('teacher.students.totalStudents')
"Across all courses" → t('teacher.students.acrossAllCourses')
"Courses" → t('nav.courses')
"Active courses" → t('teacher.students.activeCourses')
"Cohorts" → t('teacher.students.cohorts')
"Student groups" → t('teacher.students.studentGroups')

// Filters
"Filter Students" → t('teacher.students.filterStudents')
"Course" → t('teacher.students.course')
"All Courses" → t('teacher.students.allCourses')
"Search" → t('common.search')
"Search by name or email..." → t('teacher.students.searchByName')

// Table
"Students List" → t('teacher.students.studentsList')
"{count} student(s) found" → t('teacher.students.studentsFound', { count })
"No students found" → t('teacher.students.noStudentsFound')
"Student" → t('teacher.students.student')
"Email" → t('teacher.students.email')
"Cohort" → t('teacher.students.cohort')
"Enrolled" → t('teacher.students.enrolled')
"No cohort" → t('teacher.students.noCohort')

// Dialog
"Create New Cohort" → t('teacher.students.createNewCohort')
"Group selected students..." → t('teacher.students.groupStudents')
"Cohort Name" → t('teacher.students.cohortName')
"e.g., January 2025 Batch" → t('teacher.students.cohortPlaceholder')
"{count} student(s) selected" → t('teacher.students.studentsSelected', { count })
```

---

### 6. TeacherAssignments.tsx
**Status:** Ready to translate  
**Priority:** High  
**Estimated Time:** 20 minutes

**Key Translations:**
```typescript
// Header
"Assignments" → t('nav.assignments')
"Track student submissions..." → t('teacher.assignments.trackSubmissions')

// Course Selector
"Select Course" → t('teacher.assignments.selectCourse')
"Choose a course to view..." → t('teacher.assignments.chooseToView')
"No courses found" → t('teacher.assignments.noCoursesFound')
"Create Your First Course" → t('teacher.assignments.createFirstCourse')

// Stats Cards
"Total Students" → t('teacher.assignments.totalStudents')
"Submitted" → t('teacher.assignments.submitted')
"completion" → t('teacher.assignments.completion')
"Not Submitted" → t('teacher.assignments.notSubmitted')
"Graded" → t('teacher.assignments.graded')

// Assignment Details
"Course Assignments" → t('teacher.assignments.courseAssignments')
"View and grade student..." → t('teacher.assignments.viewGrade')
"Manage Course" → t('teacher.assignments.manageCourse')
"Edit Assignment" → t('teacher.assignments.editAssignment')
"Due" → t('assignments.due')

// Tabs
"Submitted ({count})" → t('teacher.assignments.submitted') + " (" + count + ")"
"Not Submitted ({count})" → t('teacher.assignments.notSubmitted') + " (" + count + ")"

// Submissions
"No submissions yet" → t('teacher.assignments.noSubmissions')
"Students will see assignments..." → t('teacher.assignments.studentsWillSee')
"Submitted" → t('teacher.assignments.submittedTime')
"Student Remarks" → t('teacher.assignments.studentRemarks')
"View" → t('common.view')
"Marks (0-100)" → t('teacher.assignments.marks')
"Save" → t('common.save')
"Graded" → t('teacher.assignments.graded')
"Not Graded" → t('teacher.assignments.notGraded')

// Not Submitted Tab
"All students have submitted!" → t('teacher.assignments.allSubmitted')
"Pending" → t('assignments.pending')
```

---

## Implementation Steps for Each Page

### Step 1: Add Imports
```typescript
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/LanguageSelector";
```

### Step 2: Add Hook
```typescript
const { t } = useTranslation();
```

### Step 3: Add Language Selector to Header
```typescript
<div className="flex items-center gap-4">
  {/* existing header content */}
  <LanguageSelector />
  {/* rest of header */}
</div>
```

### Step 4: Replace Hardcoded Strings
Replace all English text with `t()` calls using the keys from this guide.

### Step 5: Test
1. Run the application
2. Switch between English and French
3. Verify all text changes correctly
4. Check for any missing translations

---

## Quick Implementation Script

For each page, follow this pattern:

```typescript
// 1. Import at top
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/LanguageSelector";

// 2. Add hook in component
const YourComponent = () => {
  const { t } = useTranslation();
  // ... rest of component

  // 3. Replace strings
  return (
    <div>
      <h1>{t('teacher.section.key')}</h1>
      {/* Add LanguageSelector in header */}
      <LanguageSelector />
    </div>
  );
};
```

---

## Testing Checklist

After implementing translations for each page:

- [ ] TeacherDashboard - All text translates correctly
- [ ] TeacherChat - Dialog and messages translate
- [ ] TeacherGrades - Tables and forms translate
- [ ] TeacherSettings - Settings options translate
- [ ] TeacherStudents - Student list translates
- [ ] TeacherAssignments - Assignment tracking translates

---

## Common Issues & Solutions

### Issue: Translation key not found
**Solution:** Check that the key exists in both en.json and fr.json

### Issue: Variables not showing
**Solution:** Use interpolation: `t('key', { variable: value })`

### Issue: Plurals not working
**Solution:** Use i18next plural forms: `t('key', { count: number })`

### Issue: Language not switching
**Solution:** Ensure i18n is properly initialized in App.tsx

---

## Next Steps After Translation

1. **Test all pages** in both languages
2. **Check for missing keys** in console
3. **Verify formatting** (dates, numbers, etc.)
4. **Update documentation** with any new keys added
5. **Create PR** with all changes

---

## Resources

- Translation Files: `src/i18n/locales/`
- i18next Docs: https://www.i18next.com/
- React i18next: https://react.i18next.com/

---

**Status:** Ready for implementation  
**Estimated Total Time:** 90 minutes for all 6 pages
