# Quick Translation Reference Card

## 🚀 5-Minute Implementation Guide

### Step 1: Add Imports (Copy-Paste)
```typescript
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/LanguageSelector";
```

### Step 2: Add Hook (After other hooks)
```typescript
const { t } = useTranslation();
```

### Step 3: Add Language Selector (In header)
```typescript
<LanguageSelector />
```

### Step 4: Replace Text (Find & Replace Pattern)
```typescript
// Before:
<h1>Welcome Back</h1>

// After:
<h1>{t('teacher.dashboard.welcomeBack')}</h1>
```

---

## 📋 Teacher Pages - Translation Keys Quick Reference

### TeacherDashboard.tsx
```typescript
t('teacher.dashboard.welcomeBack')
t('teacher.dashboard.happeningToday')
t('teacher.dashboard.totalCourses')
t('teacher.dashboard.totalStudents')
t('teacher.dashboard.totalLessons')
t('teacher.dashboard.totalChapters')
t('teacher.dashboard.myCourses')
t('teacher.dashboard.createFirst')
t('courses.createCourse')
```

### TeacherChat.tsx
```typescript
t('teacher.chat.courseGroupManagement')
t('teacher.chat.studentMessages')
t('teacher.chat.openGroupChat')
t('teacher.chat.manageGroupChats')
t('teacher.chat.whatsappGroupLink')
t('teacher.chat.saveLink')
```

### TeacherGrades.tsx
```typescript
t('teacher.grades.viewQuizScores')
t('teacher.grades.selectCourse')
t('teacher.grades.studentGrades')
t('teacher.grades.quizAverage')
t('teacher.grades.overallGrade')
t('teacher.grades.gradeAssignment')
```

### TeacherSettings.tsx
```typescript
t('settings.language')
t('teacher.settings.chooseLanguage')
t('settings.security')
t('teacher.settings.resetPassword')
t('teacher.settings.dangerZone')
t('nav.signOut')
```

### TeacherStudents.tsx
```typescript
t('teacher.students.manageStudents')
t('teacher.students.createCohort')
t('teacher.students.totalStudents')
t('teacher.students.filterStudents')
t('teacher.students.studentsList')
```

### TeacherAssignments.tsx
```typescript
t('teacher.assignments.trackSubmissions')
t('teacher.assignments.selectCourse')
t('teacher.assignments.submitted')
t('teacher.assignments.notSubmitted')
t('teacher.assignments.graded')
```

---

## 🎯 Common Patterns

### Simple Text
```typescript
"Hello" → {t('common.hello')}
```

### With Variables
```typescript
`Welcome, ${name}!` → {t('dashboard.welcome')} + ", " + name + "!"
// OR
{t('dashboard.welcomeUser', { name: name })}
```

### With Count
```typescript
`${count} students` → {t('students.count', { count: count })}
```

### Conditional
```typescript
{isStudent ? t('nav.studentDashboard') : t('nav.teacherDashboard')}
```

---

## ✅ Testing Checklist

For each page:
1. [ ] Imports added
2. [ ] Hook added
3. [ ] LanguageSelector added
4. [ ] All text replaced
5. [ ] Page loads without errors
6. [ ] English displays correctly
7. [ ] French displays correctly
8. [ ] Language switching works

---

## 🔍 Find & Replace Examples

### Example 1: Headers
```
Find: "Welcome Back"
Replace: {t('teacher.dashboard.welcomeBack')}
```

### Example 2: Buttons
```
Find: "Create Course"
Replace: {t('courses.createCourse')}
```

### Example 3: Labels
```
Find: "Total Students"
Replace: {t('teacher.dashboard.totalStudents')}
```

---

## 🚨 Common Mistakes to Avoid

❌ **Wrong:** `<h1>t('key')</h1>`  
✅ **Right:** `<h1>{t('key')}</h1>`

❌ **Wrong:** `t("key")` (double quotes in JSX)  
✅ **Right:** `t('key')` (single quotes)

❌ **Wrong:** Forgetting to import useTranslation  
✅ **Right:** Import at top of file

❌ **Wrong:** Not adding LanguageSelector  
✅ **Right:** Add to header section

---

## 📱 Where to Add LanguageSelector

### In Header Section:
```typescript
<header className="...">
  <div className="flex items-center justify-between px-6 py-4">
    <div className="flex items-center gap-4">
      <SidebarTrigger />
      <div>
        <h1>{t('nav.dashboard')}</h1>
      </div>
    </div>
    
    {/* Add here → */}
    <div className="flex items-center gap-4">
      <LanguageSelector />
      {/* other header items */}
    </div>
  </div>
</header>
```

---

## 🎨 Translation Key Naming Convention

```
namespace.section.key

Examples:
- teacher.dashboard.welcomeBack
- teacher.chat.studentMessages
- teacher.grades.quizAverage
- common.save
- nav.dashboard
```

---

## 💾 Files to Edit

```
✏️ Teacher Pages (6 files):
├── src/pages/TeacherDashboard.tsx
├── src/pages/TeacherChat.tsx
├── src/pages/TeacherGrades.tsx
├── src/pages/TeacherSettings.tsx
├── src/pages/TeacherStudents.tsx
└── src/pages/TeacherAssignments.tsx

✅ Translation Files (already done):
├── src/i18n/locales/en.json
└── src/i18n/locales/fr.json
```

---

## 🏃 Speed Run (Per Page)

1. **Open file** (30 seconds)
2. **Add imports** (30 seconds)
3. **Add hook** (15 seconds)
4. **Add LanguageSelector** (1 minute)
5. **Replace strings** (10-15 minutes)
6. **Test** (2 minutes)

**Total:** ~15 minutes per page

---

## 🎯 Priority Order

1. ⭐ TeacherDashboard (Most visible)
2. ⭐ TeacherAssignments (Most used)
3. ⭐ TeacherGrades (Most used)
4. TeacherChat (Important)
5. TeacherStudents (Medium)
6. TeacherSettings (Low traffic)

---

## 📞 Quick Help

### If text doesn't translate:
1. Check if key exists in en.json and fr.json
2. Check if useTranslation is imported
3. Check if t() hook is initialized
4. Check console for errors

### If LanguageSelector doesn't appear:
1. Check if component is imported
2. Check if it's added to JSX
3. Check if it's in the right location

### If switching doesn't work:
1. Check i18n config in App.tsx
2. Check browser console for errors
3. Try refreshing the page

---

## ✨ Success Indicators

You're done when:
- ✅ No hardcoded English text visible
- ✅ Language selector appears in header
- ✅ Clicking selector changes all text
- ✅ No console errors
- ✅ Both languages look good

---

**Print this page and keep it handy while implementing!** 📄

---

**Estimated Time:** 90 minutes for all 6 pages  
**Difficulty:** Easy (just follow the pattern)  
**Status:** Ready to start! 🚀
