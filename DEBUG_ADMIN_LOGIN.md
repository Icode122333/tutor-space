# 🔍 Debug Admin Login Issue

## Problem
User is stuck in a loop between teacher/student dashboards and can't access admin dashboard.

## Step-by-Step Fix

### Step 1: Run the Admin Access Fix
1. Open Supabase SQL Editor
2. Copy and paste `ADMIN_ACCESS_FIX.sql`
3. **IMPORTANT**: Replace `muhirwaalex7@gmail.com` with your actual email
4. Run the script
5. Check the output - it should show your user with `role = 'admin'`

### Step 2: Clear Browser Data
1. Open browser DevTools (F12)
2. Go to Application tab → Storage
3. Click "Clear site data"
4. OR just use Incognito/Private window

### Step 3: Check Browser Console
1. Open browser console (F12)
2. Try logging in
3. Look for errors - specifically:
   - "Profile fetch error"
   - "infinite recursion"
   - Any Supabase errors

### Step 4: Verify Database State

Run this in Supabase SQL Editor:

```sql
-- Check your user's role
SELECT id, email, role, onboarding_completed 
FROM profiles 
WHERE email = 'your@email.com';

-- Check if admin enum value exists
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- Check profiles table policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';
```

### Step 5: Test Direct Navigation

After logging in, try directly navigating to:
```
http://localhost:5173/admin/dashboard
```

If you get redirected away, check the AdminDashboard.tsx file - it might have its own auth check.

## Common Issues

### Issue 1: Role is not 'admin' in database
**Solution**: Run the UPDATE query in Step 1

### Issue 2: Enum doesn't have 'admin' value
**Solution**: The script adds it automatically

### Issue 3: Profile query fails (infinite recursion)
**Solution**: Run `SIMPLE_FIX.sql` first, then `ADMIN_ACCESS_FIX.sql`

### Issue 4: Browser cache
**Solution**: Clear cache or use incognito mode

### Issue 5: AdminDashboard has its own auth check
**Solution**: Check if AdminDashboard.tsx redirects non-admins

## Quick Test

Run this in browser console after logging in:

```javascript
// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user?.id);

// Check profile
const { data: profile, error } = await supabase
  .from('profiles')
  .select('role, onboarding_completed')
  .eq('id', user?.id)
  .single();
  
console.log('Profile:', profile);
console.log('Error:', error);
```

If you see an error here, the infinite recursion issue is still present.

## Expected Flow

1. User logs in with email/password
2. Auth.tsx queries profiles table (line 66-71)
3. Gets role = 'admin'
4. Redirects to `/admin/dashboard` (line 78-82)
5. AdminDashboard loads and shows admin interface

## If Still Not Working

1. Share the browser console errors
2. Share the output of the SQL queries above
3. Check if you ran `SIMPLE_FIX.sql` successfully first
