# i18n Implementation Guide - English to French

## ✅ Phase 1: Setup (COMPLETED)

### What's Been Done:
1. ✅ Installed i18n libraries (`i18next`, `react-i18next`, `i18next-browser-languagedetector`)
2. ✅ Created translation structure:
   - `src/i18n/config.ts` - i18n configuration
   - `src/i18n/locales/en.json` - English translations
   - `src/i18n/locales/fr.json` - French translations
3. ✅ Created `LanguageSelector` component
4. ✅ Integrated i18n into App.tsx
5. ✅ Translated Auth page as example

### Translation Categories Covered:
- ✅ Common UI elements (buttons, actions, etc.)
- ✅ Navigation items
- ✅ Authentication
- ✅ Dashboard
- ✅ Courses
- ✅ Assignments
- ✅ Grades
- ✅ Chat
- ✅ Schedule
- ✅ Students
- ✅ Settings
- ✅ Certificates
- ✅ Onboarding
- ✅ Errors
- ✅ Validation

## 📋 Phase 2: Full Translation Implementation

### How to Use i18n in Your Components:

#### 1. Import the hook:
```typescript
import { useTranslation } from 'react-i18next';
```

#### 2. Use in component:
```typescript
const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      <Button>{t('common.save')}</Button>
    </div>
  );
};
```

#### 3. With fallback:
```typescript
<p>{t('some.key', 'Default text if key not found')}</p>
```

#### 4. With variables:
```typescript
// In translation file: "minLength": "Minimum length is {{min}} characters"
<p>{t('validation.minLength', { min: 6 })}</p>
```

### Adding the Language Selector to Pages:

Add to any page header:
```typescript
import { LanguageSelector } from "@/components/LanguageSelector";

// In your component JSX:
<LanguageSelector />
```

### Pages to Translate:

#### High Priority (User-Facing):
- [ ] `src/pages/Index.tsx` - Landing page
- [ ] `src/pages/SignUp.tsx` - Sign up page
- [x] `src/pages/Auth.tsx` - Login page (DONE)
- [ ] `src/pages/StudentDashboard.tsx`
- [ ] `src/pages/TeacherDashboard.tsx`
- [ ] `src/pages/StudentSettings.tsx`
- [ ] `src/pages/TeacherSettings.tsx`
- [ ] `src/pages/About.tsx`
- [ ] `src/pages/Contact.tsx`

#### Medium Priority:
- [ ] `src/pages/CourseDetail.tsx`
- [ ] `src/pages/BrowseCourses.tsx`
- [ ] `src/pages/MyCourses.tsx`
- [ ] `src/pages/StudentAssignments.tsx`
- [ ] `src/pages/TeacherAssignments.tsx`
- [ ] `src/pages/StudentScores.tsx`
- [ ] `src/pages/TeacherGrades.tsx`
- [ ] `src/pages/StudentChat.tsx`
- [ ] `src/pages/TeacherChat.tsx`
- [ ] `src/pages/StudentSchedule.tsx`
- [ ] `src/pages/TeacherSchedule.tsx`

#### Lower Priority:
- [ ] `src/pages/StudentCertificates.tsx`
- [ ] `src/pages/Exhibition.tsx`
- [ ] `src/pages/PrivacyPolicy.tsx`
- [ ] `src/pages/StudentOnboarding.tsx`
- [ ] `src/pages/TeacherOnboarding.tsx`

### Components to Translate:
- [ ] `src/components/StudentSidebar.tsx`
- [ ] `src/components/TeacherSidebar.tsx`
- [ ] `src/components/AssignmentUploadWidget.tsx`
- [ ] `src/components/CapstoneSubmission.tsx`
- [ ] `src/components/GradesTable.tsx`
- [ ] `src/components/QuizTaker.tsx`
- [ ] Toast messages throughout the app

### Example Translation Pattern:

**Before:**
```typescript
<h1>Welcome to Dashboard</h1>
<Button>Save Changes</Button>
<p>No courses available</p>
```

**After:**
```typescript
const { t } = useTranslation();

<h1>{t('dashboard.welcome')} {t('nav.dashboard')}</h1>
<Button>{t('settings.saveChanges')}</Button>
<p>{t('courses.noCourses')}</p>
```

### Adding New Translations:

If you need a translation key that doesn't exist:

1. Add to `src/i18n/locales/en.json`:
```json
{
  "mySection": {
    "myKey": "My English Text"
  }
}
```

2. Add to `src/i18n/locales/fr.json`:
```json
{
  "mySection": {
    "myKey": "Mon Texte Français"
  }
}
```

3. Use in component:
```typescript
{t('mySection.myKey')}
```

### Testing:

1. Run your dev server: `npm run dev`
2. Open the app in browser
3. Use the language selector to switch between English and French
4. Verify all text changes appropriately
5. Check that the language preference persists on page reload (stored in localStorage)

### Common Translation Keys Reference:

```typescript
// Buttons & Actions
t('common.save')
t('common.cancel')
t('common.delete')
t('common.edit')
t('common.submit')
t('common.back')
t('common.loading')

// Navigation
t('nav.home')
t('nav.dashboard')
t('nav.courses')
t('nav.assignments')
t('nav.settings')

// Auth
t('auth.signIn')
t('auth.signUp')
t('auth.email')
t('auth.password')

// Courses
t('courses.myCourses')
t('courses.browseCourses')
t('courses.noCourses')

// Assignments
t('assignments.myAssignments')
t('assignments.submitAssignment')
t('assignments.dueDate')

// Errors
t('errors.somethingWentWrong')
t('errors.pageNotFound')
```

### Tips:

1. **Keep keys organized** - Use nested objects for related translations
2. **Be consistent** - Use the same key for the same text across pages
3. **Test both languages** - Always verify French translations display correctly
4. **Handle plurals** - Use i18next plural features for count-based text
5. **Dynamic content** - Use interpolation for variables in translations

### Language Persistence:

The selected language is automatically saved to localStorage and will persist across:
- Page refreshes
- Browser sessions
- Different pages in the app

### Next Steps:

1. Start with high-priority pages (Index, SignUp, Dashboards)
2. Add LanguageSelector to page headers where appropriate
3. Replace hardcoded strings with `t()` function calls
4. Test each page in both languages
5. Add any missing translation keys as you go

## 🎯 Quick Start for Next Page:

```typescript
// 1. Import at top of file
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/LanguageSelector";

// 2. In component
const MyPage = () => {
  const { t } = useTranslation();
  
  // 3. Replace strings
  return (
    <div>
      <LanguageSelector />
      <h1>{t('dashboard.welcome')}</h1>
      {/* ... rest of component */}
    </div>
  );
};
```

## 📝 Notes:

- All translation files use JSON format
- Keys are case-sensitive
- Use dot notation to access nested keys
- The system automatically detects browser language on first visit
- Users can manually switch languages anytime
