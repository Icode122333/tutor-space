# Debug Role Issue

## Problem
When signing up as a teacher, users are getting student role instead.

## Test Steps

1. Open browser console
2. Sign up as teacher with email/password
3. Check these console logs in SignUp.tsx and AuthCallback.tsx
4. After signup, run this in browser console:

```javascript
// Check current user metadata
const { data: { user } } = await supabase.auth.getUser();
console.log('User metadata:', user.user_metadata);
console.log('Role in metadata:', user.user_metadata?.role);

// Check profile in database
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
console.log('Profile role:', profile.role);
```

## Possible Issues

1. **Trigger runs before metadata is saved** - The database trigger fires immediately when user is created, but metadata might not be set yet
2. **Metadata key mismatch** - Trigger looks for `raw_user_meta_data->>'role'` but it might be stored differently
3. **Race condition** - Profile created by trigger with wrong role before AuthCallback can fix it

## Solution

We need to either:
- Fix the trigger to correctly read the role from metadata
- OR disable the trigger and let AuthCallback create the profile manually
- OR update the profile role after creation if it's wrong
