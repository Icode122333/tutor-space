# Chat System - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Apply Database Migration (2 minutes)

#### Option A: Using Supabase CLI (Recommended)
```bash
cd tutor-space
supabase db push
```

#### Option B: Using Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire content from:
   `tutor-space/supabase/migrations/20251013000000_enhanced_chat_system.sql`
6. Paste into the SQL editor
7. Click "Run" button

### Step 2: Regenerate TypeScript Types (1 minute)

```bash
# If using local Supabase
supabase gen types typescript --local > src/integrations/supabase/types.ts

# If using remote Supabase
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.

### Step 3: Restart Dev Server (30 seconds)

```bash
npm run dev
```

## ✅ Verify Installation

### Check Database Tables
1. Go to Supabase Dashboard
2. Click "Table Editor"
3. You should see these new tables:
   - ✅ group_chats
   - ✅ group_members
   - ✅ chat_messages
   - ✅ message_reactions
   - ✅ message_read_receipts

### Test Teacher Chat
1. Login as a teacher
2. Navigate to `/teacher/chat`
3. Click "Create Group"
4. Fill in group name (required)
5. Add description and WhatsApp link (optional)
6. Click "Create Group"
7. Send a test message
8. Try editing the message (hover and click edit icon)
9. Try replying to the message (hover and click reply icon)

### Test Student Chat
1. Login as a student (different browser or incognito)
2. Navigate to `/student/chat`
3. You should see "You're not in any groups yet"
4. Go back to teacher account
5. Add the student to a group (you'll need to implement this UI or do it manually in database)
6. Refresh student chat page
7. Student should now see the group
8. Send a message as student
9. See it appear in teacher chat

## 🔧 Manual Member Addition (Temporary)

Until you build the "Add Members" UI, add students manually:

### Using Supabase Dashboard
1. Go to Table Editor
2. Open `group_members` table
3. Click "Insert" → "Insert row"
4. Fill in:
   - `group_chat_id`: Copy from group_chats table
   - `user_id`: Copy student's ID from profiles table
   - `role`: Select "member"
5. Click "Save"

### Using SQL
```sql
INSERT INTO group_members (group_chat_id, user_id, role)
VALUES (
  'your-group-id-here',
  'student-user-id-here',
  'member'
);
```

## 📱 Access the Chat

### Teacher Chat
- URL: `/teacher/chat`
- Or add a link in TeacherSidebar:
```tsx
<SidebarMenuItem>
  <SidebarMenuButton asChild>
    <Link to="/teacher/chat">
      <MessageSquare className="mr-2 h-4 w-4" />
      Chat
    </Link>
  </SidebarMenuButton>
</SidebarMenuItem>
```

### Student Chat
- URL: `/student/chat`
- Or add a link in StudentDashboard navigation

## 🎯 Common Tasks

### Create a Group
1. Click "Create Group" button
2. Enter group name (required)
3. Add description (optional but recommended)
4. Add WhatsApp link (optional)
5. Click "Create Group"

### Send a Message
1. Select a group from the left sidebar
2. Type your message in the text area at the bottom
3. Press Enter to send (Shift+Enter for new line)

### Edit a Message
1. Hover over your own message
2. Click the edit icon (pencil)
3. Modify the text
4. Press Enter to save

### Reply to a Message
1. Hover over any message
2. Click the reply icon (↩️)
3. Type your reply
4. Press Enter to send

### Mark as Resolved (Teacher Only)
1. Find a student's question
2. Click "Resolve" button below the message
3. Message will show a green checkmark

### View Members
1. Click "Members" button in the chat header
2. See all group members with their roles
3. Click outside to close

### Edit Group (Teacher Only)
1. Click the three dots (⋮) in the chat header
2. Select "Edit Group"
3. Update name, description, or WhatsApp link
4. Click "Update Group"

### Archive Group (Teacher Only)
1. Click the three dots (⋮) in the chat header
2. Select "Archive Group"
3. Confirm the action
4. Group will be hidden from the list

## 🐛 Troubleshooting

### "Table does not exist" error
**Solution**: Apply the migration (Step 1)

### TypeScript errors in IDE
**Solution**: Regenerate types (Step 2) and restart IDE

### "Permission denied" error
**Solution**: 
1. Make sure you're logged in
2. Check your role in the profiles table
3. Verify RLS policies are created

### Messages not showing
**Solution**:
1. Check if user is a member of the group
2. Open browser console for errors
3. Verify the group_members table has the correct entries

### Can't send messages
**Solution**:
1. Make sure you're a member of the group
2. Check if the text area is empty
3. Look for errors in browser console

## 📚 Next Steps

### Immediate
1. ✅ Apply migration
2. ✅ Test basic chat functionality
3. ⬜ Build "Add Members" UI for teachers
4. ⬜ Add chat links to navigation menus

### Short-term
1. ⬜ Implement file upload
2. ⬜ Add emoji reactions UI
3. ⬜ Add real-time subscriptions
4. ⬜ Show unread message counts

### Long-term
1. ⬜ Push notifications
2. ⬜ Message search
3. ⬜ Voice/video messages
4. ⬜ Chat analytics

## 📖 Documentation

- **Full Documentation**: `CHAT_SYSTEM_SUMMARY.md`
- **Migration Guide**: `CHAT_MIGRATION_README.md`
- **Database Schema**: `CHAT_DATABASE_SCHEMA.sql`

## 💡 Tips

1. **Use Shift+Enter** for multi-line messages
2. **Hover over messages** to see action buttons
3. **Add descriptions** to groups so students know the purpose
4. **Use WhatsApp integration** for urgent communications
5. **Mark questions as resolved** to keep track of answered questions
6. **Archive old groups** instead of deleting them

## 🎉 You're Ready!

Your chat system is now set up and ready to use. Start by creating a group and inviting students!

---

**Need Help?** Check the troubleshooting section or review the full documentation.
