# 🎯 FINAL COMPLETE FIX - Do This Exactly

## The Problem
You're stuck in a loop because the profiles table query is failing with infinite recursion. This prevents the app from detecting you're an admin.

## The Solution (2 Steps)

### STEP 1: Fix Infinite Recursion (MUST DO FIRST!)

1. Open Supabase SQL Editor
2. Copy the ENTIRE contents of `SIMPLE_FIX.sql`
3. Paste and run it
4. Wait for "Success" message

### STEP 2: Set Yourself as Admin

1. Still in Supabase SQL Editor
2. Run this (replace with your email):

```sql
-- Add admin to enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'admin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'admin';
  END IF;
END $$;

-- Update your user to admin
UPDATE public.profiles 
SET 
  role = 'admin',
  onboarding_completed = true
WHERE email = 'muhirwaalex7@gmail.com';

-- Verify it worked
SELECT id, email, role, onboarding_completed 
FROM public.profiles 
WHERE email = 'muhirwaalex7@gmail.com';
```

3. You should see your user with `role: admin`

### STEP 3: Clear Browser and Test

1. Clear browser cache (or use Incognito mode)
2. Go to your app
3. Log in with your email/password
4. Should redirect to `/admin/dashboard` ✅

## Why This Order Matters

- If you set admin role BEFORE fixing recursion → queries still fail → can't detect admin
- If you fix recursion FIRST → queries work → admin detection works → success!

## Verify It Worked

After logging in, open browser console and run:

```javascript
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();
console.log('My role:', profile.role); // Should show "admin"
```

## If Still Not Working

Check browser console for errors. If you see:
- "infinite recursion" → SIMPLE_FIX.sql didn't run successfully
- "Access denied" → Role isn't set to admin in database
- "Profile fetch error" → RLS policies still broken

Run both scripts again in order.
