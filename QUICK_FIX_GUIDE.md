# Quick Fix Guide - Infinite Recursion Error

## 🚨 Problem
Students getting error when trying to enroll in courses:
```
infinite recursion detected in policy for relation "course_enrollments"
```

## ✅ Solution
Apply the RLS policy fix migration.

## 🔧 How to Fix (Choose One Method)

### Method 1: Supabase CLI (Fastest)
```bash
cd tutor-space
supabase db push
```

### Method 2: Supabase Dashboard
1. Go to your Supabase Dashboard
2. Click **SQL Editor**
3. Copy content from: `supabase/migrations/20250202000000_fix_rls_infinite_recursion.sql`
4. Paste and click **Run**

### Method 3: Direct SQL
Open the migration file and run it in your database.

## ✨ What This Fixes
- ✅ Students can now enroll in courses
- ✅ No more infinite recursion errors
- ✅ Faster database queries
- ✅ Better performance with indexes
- ✅ Cleaner, simpler RLS policies

## 🧪 Test After Fix
1. Go to Browse Courses page
2. Click "Enroll" on any course
3. Should work without errors!

## 📚 More Details
See `RLS_INFINITE_RECURSION_FIX.md` for complete technical documentation.

---

**Status:** Ready to Apply  
**Time to Fix:** ~2 minutes  
**Risk Level:** Low (Safe to apply)
