# Debug Suspension Feature

## Issue: User suspended but can still log in

### Step 1: Verify the RPC functions exist

Run this in Supabase SQL Editor:

```sql
-- Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('suspend_user', 'unsuspend_user');
```

**Expected result:** Should show 2 functions

If functions don't exist, run the migration:
```sql
-- Copy and run: tutor-space/supabase/migrations/20250205000002_suspension_functions.sql
```

### Step 2: Verify the suspension was saved

Run this in Supabase SQL Editor:

```sql
-- Check all suspended users
SELECT 
  id,
  email,
  full_name,
  role,
  is_suspended,
  suspension_reason,
  updated_at
FROM public.profiles
WHERE is_suspended = true;
```

**Expected result:** Should show the suspended user with `is_suspended = true`

If the user is NOT showing as suspended:
- The RPC function might have failed
- Check browser console for errors when you clicked "Suspend"
- Try manually suspending:

```sql
UPDATE public.profiles
SET 
  is_suspended = true,
  suspension_reason = 'Test suspension - manual',
  updated_at = NOW()
WHERE email = 'user@example.com';  -- Replace with actual email
```

### Step 3: Check browser console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for the log message: `Suspension check: { userId: ..., isSuspended: ..., reason: ... }`

**What to look for:**
- If `isSuspended: false` → The database value is not true
- If `isSuspended: true` → The dialog should appear
- If no log appears → The component isn't checking

### Step 4: Force a refresh

After suspending a user:
1. As the suspended user, **hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Or completely close and reopen the browser
3. The dialog should appear within 1-2 seconds

### Step 5: Check RLS policies

The suspension check needs to read the profiles table. Verify RLS allows this:

```sql
-- Check if user can read their own profile
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
  AND cmd = 'SELECT';
```

**Expected:** Should have a policy allowing users to SELECT their own profile

### Step 6: Test the RPC function directly

Run this as an admin in Supabase SQL Editor:

```sql
-- Get a user ID to test with
SELECT id, email, role FROM public.profiles WHERE role = 'student' LIMIT 1;

-- Try to suspend them (replace the UUID)
SELECT public.suspend_user(
  'USER_ID_HERE'::uuid,
  'Test suspension from SQL'
);

-- Check if it worked
SELECT is_suspended, suspension_reason 
FROM public.profiles 
WHERE id = 'USER_ID_HERE'::uuid;
```

### Common Issues:

1. **RPC function not created**
   - Solution: Run the migration file

2. **RLS blocking the read**
   - Solution: Ensure profiles table has SELECT policy for own profile

3. **Browser cache**
   - Solution: Hard refresh or clear cache

4. **Dialog not checking frequently enough**
   - Solution: The dialog checks every 30 seconds, or wait/refresh

5. **Admin trying to suspend another admin**
   - Solution: The function prevents this, check console for error

### Manual Test:

1. **Suspend via SQL:**
```sql
UPDATE public.profiles
SET is_suspended = true, suspension_reason = 'Manual test'
WHERE email = 'test@example.com';
```

2. **Log in as that user**
3. **Check console** for the log message
4. **Dialog should appear** immediately

5. **Unsuspend via SQL:**
```sql
UPDATE public.profiles
SET is_suspended = false, suspension_reason = NULL
WHERE email = 'test@example.com';
```

6. **Refresh page** - dialog should disappear
