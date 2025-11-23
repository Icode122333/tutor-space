# Redirect Loop Fix - Root Cause Analysis and Solution

## Problem Analysis

### Symptoms
- Infinite redirect loop between `/teacher/dashboard` and `/student/dashboard`
- Console shows: "User is not a teacher, redirecting to student dashboard" repeatedly
- User gets stuck and cannot access their dashboard

### Root Cause
The issue was in the **StudentOnboarding** component's completion logic:

```typescript
// WRONG - Queries role from database after update
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

if (profile?.role === "teacher") {
  navigate("/teacher/dashboard");
} else {
  navigate("/student/dashboard");
}
```

**Why this caused the loop:**
1. User signs up as "student" → goes to StudentOnboarding
2. StudentOnboarding completes and queries the role
3. If there's ANY database inconsistency (trigger defaults, race condition, etc.), role might be "teacher"
4. Redirects to `/teacher/dashboard`
5. TeacherDashboard checks role, sees "student", redirects to `/student/dashboard`
6. StudentDashboard might redirect back → **LOOP**

## The Solution

### Principle: Trust the Onboarding Type
- **StudentOnboarding** should ALWAYS redirect to `/student/dashboard`
- **TeacherOnboarding** should ALWAYS redirect to `/teacher/pending-approval`
- The onboarding page itself indicates the user's intended role

### Changes Made

#### 1. StudentOnboarding.tsx

**Before:**
```typescript
// Queried role and conditionally redirected
if (profile.role === "teacher") {
  navigate("/teacher/dashboard");
} else {
  navigate("/student/dashboard");
}
```

**After:**
```typescript
// Always redirect to student dashboard
navigate("/student/dashboard", { replace: true });
```

**Added Role Validation on Mount:**
```typescript
const checkUserAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    navigate("/auth");
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile) {
    // If already completed, redirect to appropriate dashboard
    if (profile.onboarding_completed) {
      navigate(profile.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard", { replace: true });
      return;
    }

    // If teacher trying to access student onboarding, redirect to teacher onboarding
    if (profile.role === "teacher") {
      navigate("/teacher/onboarding", { replace: true });
      return;
    }
  }
};
```

#### 2. TeacherOnboarding.tsx

**Added Role Validation on Mount:**
```typescript
const checkUserAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    navigate("/auth");
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile) {
    // If already completed, redirect appropriately
    if (profile.onboarding_completed) {
      if (profile.role === "teacher") {
        navigate("/teacher/pending-approval", { replace: true });
      } else {
        navigate("/student/dashboard", { replace: true });
      }
      return;
    }

    // If student trying to access teacher onboarding, redirect to student onboarding
    if (profile.role === "student") {
      navigate("/onboarding", { replace: true });
      return;
    }
  }
};
```

#### 3. Dashboard Redirects

**Both dashboards now use `replace: true`:**
```typescript
// StudentDashboard
if (profileData.role !== "student") {
  navigate("/teacher/dashboard", { replace: true });
  return;
}

// TeacherDashboard
if (profile.role !== "teacher") {
  navigate("/student/dashboard", { replace: true });
  return;
}
```

## Flow Diagram

### Correct Flow (After Fix)

```
Sign Up as Student
  ↓
/onboarding (StudentOnboarding)
  ↓
[Validates: Is user a student?]
  ├─ Yes → Continue onboarding
  └─ No → Redirect to /teacher/onboarding
  ↓
Complete Onboarding
  ↓
ALWAYS → /student/dashboard
  ↓
[StudentDashboard validates role]
  ├─ Student → Show dashboard ✓
  └─ Teacher → Redirect to /teacher/dashboard
```

```
Sign Up as Teacher
  ↓
/teacher/onboarding (TeacherOnboarding)
  ↓
[Validates: Is user a teacher?]
  ├─ Yes → Continue onboarding
  └─ No → Redirect to /onboarding
  ↓
Complete Onboarding
  ↓
ALWAYS → /teacher/pending-approval
  ↓
[After approval]
  ↓
/teacher/dashboard
```

## Key Improvements

### 1. **Deterministic Redirects**
- Onboarding pages no longer query role to decide redirect
- They redirect based on their own type (Student → student dashboard, Teacher → teacher approval)

### 2. **Role Validation on Mount**
- Prevents wrong users from accessing wrong onboarding
- Redirects completed users to their dashboard
- Catches role mismatches early

### 3. **Replace Navigation**
- All redirects use `{ replace: true }`
- Prevents history buildup
- Stops back button issues

### 4. **Database Update Verification**
- Waits 500ms after update
- Verifies `onboarding_completed` is true
- Throws error if update failed

## Testing Checklist

- [ ] Sign up as student → completes onboarding → lands on student dashboard
- [ ] Sign up as teacher → completes onboarding → lands on pending approval
- [ ] Student with completed onboarding → accessing /onboarding → redirects to dashboard
- [ ] Teacher with completed onboarding → accessing /teacher/onboarding → redirects to approval/dashboard
- [ ] Student accessing /teacher/onboarding → redirects to /onboarding
- [ ] Teacher accessing /onboarding → redirects to /teacher/onboarding
- [ ] No redirect loops occur
- [ ] Back button works correctly
- [ ] Role persists across sessions

## Prevention

To prevent similar issues in the future:

1. **Never query role to decide redirect in onboarding** - Trust the onboarding type
2. **Always validate role on component mount** - Catch mismatches early
3. **Use `replace: true` for auth redirects** - Prevent history issues
4. **Verify database updates before redirecting** - Ensure data consistency
5. **Add comprehensive logging** - Debug issues faster

## Files Modified

1. `src/pages/StudentOnboarding.tsx`
   - Removed conditional role-based redirect
   - Added role validation on mount
   - Always redirects to student dashboard

2. `src/pages/TeacherOnboarding.tsx`
   - Added role validation on mount
   - Handles completed onboarding redirects

3. `src/pages/StudentDashboard.tsx`
   - Added `replace: true` to all navigations

4. `src/pages/TeacherDashboard.tsx`
   - Added `replace: true` to all navigations
