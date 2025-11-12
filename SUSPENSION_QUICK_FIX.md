# Quick Fix for Suspension Feature

## Problem
User is suspended but can still log in and doesn't see the suspension dialog.

## Solution

### Step 1: Run These Migrations in Order

In Supabase SQL Editor, run these files in order:

1. **First:** `20250205000002_suspension_functions.sql` (creates suspend/unsuspend functions)
2. **Second:** `20250205000003_ensure_suspension_works.sql` (ensures policies work)

### Step 2: Verify Suspension in Database

Run this query to check if user is actually suspended:

```sql
SELECT 
  email,
  full_name,
  is_suspended,
  suspension_reason
FROM public.profiles
WHERE email = 'user@example.com';  -- Replace with actual email
```

If `is_suspended` is `false`, the suspension didn't save. Try manually:

```sql
UPDATE public.profiles
SET 
  is_suspended = true,
  suspension_reason = 'Test suspension'
WHERE email = 'user@example.com';  -- Replace with actual email
```

### Step 3: Test as Suspended User

1. Log in as the suspended user
2. Open browser console (F12)
3. Look for this log: `Suspension check: { userId: ..., isSuspended: true, reason: ... }`
4. The suspension dialog should appear

### Step 4: If Dialog Still Doesn't Appear

**Check browser console for errors:**
- If you see RLS policy errors → Run migration step 1 & 2 again
- If you see "is_suspended" column doesn't exist → Run migration step 2

**Force a check:**
1. Hard refresh (Ctrl+Shift+R)
2. Or close and reopen browser
3. Dialog checks every 30 seconds automatically

### Step 5: Unsuspend the User

**Via Admin Panel:**
1. Go to Admin → Users
2. Find the suspended user
3. Click "Unsuspend"

**Via SQL:**
```sql
UPDATE public.profiles
SET 
  is_suspended = false,
  suspension_reason = NULL
WHERE email = 'user@example.com';
```

## Quick Test

Run this complete test in Supabase SQL Editor:

```sql
-- 1. Suspend a test user
UPDATE public.profiles
SET is_suspended = true, suspension_reason = 'Quick test'
WHERE email = 'test@example.com';

-- 2. Verify it worked
SELECT email, is_suspended, suspension_reason
FROM public.profiles
WHERE email = 'test@example.com';

-- 3. Log in as that user → should see dialog

-- 4. Unsuspend
UPDATE public.profiles
SET is_suspended = false, suspension_reason = NULL
WHERE email = 'test@example.com';

-- 5. Refresh page → dialog should disappear
```

## What Should Happen

✅ Suspended user sees a red dialog with suspension reason
✅ Dialog cannot be closed (only "Sign Out" button)
✅ Dialog checks every 30 seconds for status changes
✅ Admin can unsuspend from Users page
✅ All actions are logged in activity_logs

## Still Not Working?

Check the browser console logs. The component logs:
```
Suspension check: { userId: "...", isSuspended: true/false, reason: "..." }
```

If `isSuspended: false` but database shows `true`, there's an RLS policy issue.
