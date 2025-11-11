# 🎯 HOW TO FIX AUTH - SIMPLE STEPS

## The Problem
When users try to log in, they get "infinite recursion detected in policy for relation 'profiles'" error.

## Why It Happens
Multiple database tables have RLS policies that check the user's role by querying the `profiles` table. When a user logs in and tries to access their profile, these policies create a circular reference:

1. User logs in → tries to read their profile
2. RLS checks policies on profiles table
3. Other tables' policies (courses, enrollments, etc.) also get evaluated
4. Those policies query profiles table to check role
5. This triggers profiles policies again → INFINITE LOOP!

## The Fix (3 Simple Steps)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the Fix Script
1. Open the file: `tutor-space/SIMPLE_FIX.sql`
2. Copy the ENTIRE contents
3. Paste into Supabase SQL Editor
4. Click "Run" or press Ctrl+Enter

### Step 3: Test Login
1. Go to your app
2. Try logging in with any user (student, teacher, or admin)
3. Should work! ✅

## What the Script Does

1. **Removes problematic policies** that query the profiles table
2. **Keeps simple policies** on profiles (just checks auth.uid() = id)
3. **Fixes other tables** (courses, enrollments, etc.) to not query profiles
4. **Creates admin functions** that use SECURITY DEFINER to bypass RLS

## Expected Result

After running the script:
- ✅ Students can log in and see student dashboard
- ✅ Teachers can log in and see teacher dashboard  
- ✅ Admins can log in and see admin dashboard
- ✅ No more "infinite recursion" errors
- ✅ All features work normally

## If It Still Doesn't Work

1. **Check browser console** - Look for the exact error message
2. **Clear browser cache** - Sometimes old sessions cause issues
3. **Verify the script ran successfully** - Check for any SQL errors in Supabase
4. **Check your user's role** - Run this in Supabase SQL Editor:
   ```sql
   SELECT id, email, role FROM profiles WHERE email = 'your@email.com';
   ```

## Key Points

- The profiles table should ONLY have policies that check `auth.uid() = id`
- NO other table should have policies that query the profiles table
- Admin operations use RPC functions with SECURITY DEFINER
- Role checking is done in application code, not in RLS policies

---

**This is the simplest, most direct fix. Just run SIMPLE_FIX.sql and you're done!** 🎉
