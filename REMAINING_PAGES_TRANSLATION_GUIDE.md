# Translation Guide for Remaining Student Pages

## ✅ Translation Keys Ready

All translation keys have been added to both `en.json` and `fr.json` for:
- StudentScores
- StudentSettings  
- StudentAssignments
- MyCourses
- BrowseCourses

## Pages to Translate

### 1. StudentScores.tsx

**Import to add:**
```typescript
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/LanguageSelector";
```

**Hook to add:**
```typescript
const { t } = useTranslation();
```

**Strings to replace:**
- "My Scores" → `{t('grades.myScores')}`
- "Track your academic performance across all courses" → `{t('grades.trackPerformance')}`
- "Select a course" → `{t('grades.selectCourse')}`
- "All Courses" → `{t('grades.allCourses')}`
- "Overall Performance" → `{t('grades.overallPerformance')}`
- "Quiz Average" → `{t('grades.quizAverage')}`
- "Assignment Average" → `{t('grades.assignmentAverage')}`
- "Total Quizzes" → `{t('grades.totalQuizzes')}`
- "Quiz Scores" → `{t('grades.quizScores')}`
- "Assignment Scores" → `{t('grades.assignmentScores')}`
- "Lesson" → `{t('grades.lesson')}`
- "Score" → `{t('grades.score')}`
- "Date" → `{t('grades.date')}`
- "Status" → `{t('grades.status')}`
- "Passed" → `{t('grades.passed')}`
- "Failed" → `{t('grades.failed')}`
- "No scores yet" → `{t('grades.noScoresYet')}`
- "Complete quizzes to see your scores here" → `{t('grades.completeQuizzes')}`
- "No assignment scores yet" → `{t('grades.noAssignmentScores')}`
- "Submit assignments to see your grades here" → `{t('grades.submitAssignments')}`

**Add LanguageSelector** to header

---

### 2. StudentSettings.tsx

**Import to add:**
```typescript
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/LanguageSelector";
```

**Hook to add:**
```typescript
const { t } = useTranslation();
```

**Strings to replace:**
- "Settings" → `{t('settings.settings')}`
- "Manage your account preferences" → `{t('settings.manageAccount')}`
- "Language Settings" → `{t('settings.languageSettings')}`
- "Choose your preferred language" → `{t('settings.chooseLanguage')}`
- "English" → `{t('settings.english')}`
- "French" → `{t('settings.french')}`
- "Language changed to" → `{t('settings.languageChanged')}`
- "Security Settings" → `{t('settings.securitySettings')}`
- "Password and security options" → `{t('settings.passwordSecurity')}`
- "Forgot Password" → `{t('settings.forgotPassword')}`
- "Reset Password" → `{t('settings.resetPassword')}`
- "Enter your email address" → `{t('settings.enterEmail')}`
- "Send Reset Link" → `{t('settings.sendResetLink')}`
- "Password reset email sent! Check your inbox." → `{t('settings.resetEmailSent')}`
- "Please enter your email address" → `{t('settings.enterEmailError')}`
- "Sign Out" → `{t('settings.signOut')}`
- "Are you sure you want to sign out?" → `{t('settings.signOutConfirm')}`
- "Signed out successfully" → `{t('settings.signOutSuccess')}`
- "Cancel" → `{t('settings.cancel')}`

**Add LanguageSelector** to header

---

### 3. StudentAssignments.tsx

**Import to add:**
```typescript
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/LanguageSelector";
```

**Hook to add:**
```typescript
const { t } = useTranslation();
```

**Strings to replace:**
- "My Assignments" → `{t('assignments.myAssignments')}`
- "View and submit your course assignments" → `{t('assignments.viewSubmitAssignments')}`
- "All Assignments" → `{t('assignments.allAssignments')}`
- "Assignment" → `{t('assignments.assignment')}`
- "Capstone Project" → `{t('assignments.capstoneProject')}`
- "Due" → `{t('assignments.due')}`
- "Submitted" → `{t('assignments.submitted')}`
- "Pending" → `{t('assignments.pending')}`
- "Graded" → `{t('assignments.graded')}`
- "Submitted on" → `{t('assignments.submittedOn')}`
- "Not submitted yet" → `{t('assignments.notSubmitted')}`
- "Grade" → `{t('assignments.grade')}`
- "Feedback" → `{t('assignments.feedback')}`
- "Upload Your Submission" → `{t('assignments.uploadSubmission')}`
- "View Course" → `{t('assignments.viewCourse')}`
- "No Assignments Yet" → `{t('assignments.noAssignmentsYet')}`
- "You don't have any assignments. Enroll in courses to get started!" → `{t('assignments.noAssignmentsMessage')}`
- "Browse Courses" → `{t('dashboard.browseCourses')}`

**Add LanguageSelector** to header

---

### 4. MyCourses.tsx

**Import to add:**
```typescript
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/LanguageSelector";
```

**Hook to add:**
```typescript
const { t } = useTranslation();
```

**Strings to replace:**
- "My Courses" → `{t('courses.myCourses')}`
- "View and manage your enrolled courses" → `{t('courses.viewManageCourses')}`
- "Continue where you left off" → `{t('courses.continueWhere')}`
- "Progress" → `{t('courses.progress')}`
- "Lessons" → `{t('courses.lessons')}`
- "Continue" → `{t('courses.continue')}`
- "Enrolled" → `{t('courses.enrolled')}`
- "View" → `{t('common.view')}`
- "No Courses Enrolled" → `{t('courses.noCoursesEnrolled')}`
- "You haven't enrolled in any courses yet" → `{t('courses.notEnrolledYet')}`
- "Explore available courses and start learning today!" → `{t('courses.exploreAvailable')}`
- "Explore Courses" → `{t('courses.exploreCourses')}`

**Add LanguageSelector** to header
**Keep course titles in English** (as requested)

---

### 5. BrowseCourses.tsx

**Import to add:**
```typescript
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/LanguageSelector";
```

**Hook to add:**
```typescript
const { t } = useTranslation();
```

**Strings to replace:**
- "Available Courses" → `{t('courses.availableCourses')}`
- "Discover and enroll in courses" → `{t('courses.discoverCourses')}`
- "Search" → `{t('common.search')}`
- "All Courses" → `{t('grades.allCourses')}`
- "students" → `{t('courses.students')}`
- "Enroll Now" → `{t('courses.enrollNow')}`
- "Enrolled" → `{t('courses.enrolled')}`
- "View" → `{t('common.view')}`
- "No courses available at the moment" → `{t('courses.noCoursesAvailable')}`
- "Browse Courses" → `{t('courses.browseCourses')}`

**Add LanguageSelector** to header
**Keep course titles and descriptions in English** (as requested)

---

## Quick Implementation Steps

For each file:

1. **Add imports** at the top:
```typescript
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/LanguageSelector";
```

2. **Add hook** in component:
```typescript
const { t } = useTranslation();
```

3. **Replace hardcoded strings** with translation keys using the mappings above

4. **Add LanguageSelector** to the header section:
```typescript
<LanguageSelector />
```

5. **Test** by switching languages

---

## Translation Keys Available

All keys are ready in both `en.json` and `fr.json`:

### Settings Keys:
- `settings.settings`
- `settings.manageAccount`
- `settings.languageSettings`
- `settings.chooseLanguage`
- `settings.english`
- `settings.french`
- `settings.languageChanged`
- `settings.securitySettings`
- `settings.passwordSecurity`
- `settings.forgotPassword`
- `settings.resetPassword`
- `settings.enterEmail`
- `settings.sendResetLink`
- `settings.resetEmailSent`
- `settings.enterEmailError`
- `settings.signOut`
- `settings.signOutConfirm`
- `settings.signOutSuccess`
- `settings.cancel`

### Grades/Scores Keys:
- `grades.myScores`
- `grades.trackPerformance`
- `grades.selectCourse`
- `grades.allCourses`
- `grades.overallPerformance`
- `grades.quizAverage`
- `grades.assignmentAverage`
- `grades.totalQuizzes`
- `grades.quizScores`
- `grades.assignmentScores`
- `grades.lesson`
- `grades.score`
- `grades.date`
- `grades.status`
- `grades.passed`
- `grades.failed`
- `grades.noScoresYet`
- `grades.completeQuizzes`
- `grades.noAssignmentScores`
- `grades.submitAssignments`

### Assignment Keys:
- `assignments.myAssignments`
- `assignments.viewSubmitAssignments`
- `assignments.allAssignments`
- `assignments.assignment`
- `assignments.capstoneProject`
- `assignments.due`
- `assignments.submitted`
- `assignments.pending`
- `assignments.graded`
- `assignments.submittedOn`
- `assignments.notSubmitted`
- `assignments.grade`
- `assignments.feedback`
- `assignments.uploadSubmission`
- `assignments.noAssignmentsYet`
- `assignments.noAssignmentsMessage`
- `assignments.viewCourse`

### Course Keys:
- `courses.myCourses`
- `courses.viewManageCourses`
- `courses.continueWhere`
- `courses.progress`
- `courses.lessons`
- `courses.continue`
- `courses.noCoursesEnrolled`
- `courses.notEnrolledYet`
- `courses.exploreAvailable`
- `courses.exploreCourses`
- `courses.availableCourses`
- `courses.discoverCourses`
- `courses.students`
- `courses.enrollNow`
- `courses.noCoursesAvailable`

---

## Notes

- **Course titles and descriptions** should remain in English (as requested)
- **Course levels** (Beginner/Intermediate/Advanced) should remain in English
- All **UI text** should be translated
- Add **LanguageSelector** to each page header for easy language switching
- Test each page after translation to ensure proper display in both languages

---

## Status

- ✅ Translation keys added to `en.json`
- ✅ Translation keys added to `fr.json`
- ⏳ Pages need to be updated with translation hooks
- ⏳ LanguageSelector needs to be added to headers

**Estimated time per page**: 10-15 minutes
**Total estimated time**: 50-75 minutes for all 5 pages
