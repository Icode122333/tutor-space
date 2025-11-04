# Admin Login - Quick Guide

## ✅ What I Fixed:

1. **Added Admin Routes** to App.tsx
   - All 8 admin pages are now accessible
   - Routes: /admin/dashboard, /admin/users, etc.

2. **Added Auto-Redirect** in Auth.tsx
   - When admin logs in → automatically goes to /admin/dashboard
   - Shows "Welcome Admin!" message

## 🚀 How to Test:

### Step 1: Verify You're Admin
```sql
-- Run in Supabase SQL Editor
SELECT p.id, p.full_name, p.role, u.email 
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'muhirwaalex7@gmail.com';
```

**Expected result:** role should be `'admin'`

### Step 2: Login
1. Go to your app: `http://localhost:5173/auth`
2. Login with: `muhirwaalex7@gmail.com`
3. You should automatically be redirected to `/admin/dashboard`

### Step 3: If It Doesn't Work

**Check 1: Is role set correctly?**
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'muhirwaalex7@gmail.com');
```

**Check 2: Clear browser cache**
- Logout completely
- Clear browser cache/cookies
- Login again

**Check 3: Check browser console**
- Open DevTools (F12)
- Look for errors
- Check what role is being returned

**Check 4: Manual navigation**
- After login, manually go to: `http://localhost:5173/admin/dashboard`
- If this works, the issue is with the redirect logic

## 🎯 What Happens Now:

### When Admin Logs In:
1. ✅ Auth checks role
2. ✅ Sees role = 'admin'
3. ✅ Shows "Welcome Admin!" toast
4. ✅ Redirects to /admin/dashboard
5. ✅ Admin dashboard loads with stats

### When Teacher Logs In:
- Goes to /teacher/dashboard (as before)

### When Student Logs In:
- Goes to /student/dashboard (as before)

## 📊 Admin Dashboard Features:

Once logged in as admin, you'll see:
- **Total users, students, teachers**
- **Pending teacher approvals**
- **Course statistics**
- **User growth charts**
- **Quick action cards**
- **System health status**

## 🔧 Troubleshooting:

**Problem: Still going to student/teacher dashboard**
- Your role might not be set to 'admin'
- Run the UPDATE query above
- Logout and login again

**Problem: "Access denied" message**
- RLS policies might not be working
- Check if migration ran successfully
- Verify role in database

**Problem: 404 Not Found**
- Routes might not be loaded
- Restart your dev server
- Check App.tsx has admin routes

**Problem: Blank page**
- Check browser console for errors
- Verify all admin page files exist
- Check if recharts is installed: `npm install recharts`

## 🎉 Success Checklist:

- [ ] Migration ran successfully
- [ ] Role set to 'admin' in database
- [ ] Can login with admin email
- [ ] Automatically redirected to /admin/dashboard
- [ ] Can see admin sidebar
- [ ] Can see statistics on dashboard
- [ ] Can navigate to other admin pages

## 💡 Quick Commands:

**Verify admin status:**
```sql
SELECT role FROM profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'muhirwaalex7@gmail.com');
```

**Make someone admin:**
```sql
UPDATE profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'email@example.com');
```

**Remove admin (make teacher):**
```sql
UPDATE profiles SET role = 'teacher' WHERE id = (SELECT id FROM auth.users WHERE email = 'email@example.com');
```

---

**Everything should work now!** Login and you'll see the admin dashboard automatically. 🚀
