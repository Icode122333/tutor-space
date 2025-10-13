# 💬 Direct Messaging + WhatsApp Groups - Setup Guide

## 🎯 What You Get

### For Students:
1. **See all their teachers** (from enrolled courses)
2. **WhatsApp Group button** - Join teacher's WhatsApp group for class discussions
3. **Message button** - Start private 1-on-1 chat with teacher
4. **Unread count badges** - See how many unread messages

### For Teachers:
1. **See all students** who messaged them
2. **Manage WhatsApp links** - Add/update WhatsApp group links for each course
3. **Reply to students** - Private 1-on-1 conversations
4. **Unread count badges** - See which students need replies

## 🚀 Setup (3 Steps)

### Step 1: Run SQL Migration

In Supabase SQL Editor, paste and run this file:
```
tutor-space/supabase/migrations/20251013100000_direct_messaging_system.sql
```

This will:
- ✅ Add `whatsapp_link` column to courses table
- ✅ Create `conversations` table (student-teacher pairs)
- ✅ Create `direct_messages` table
- ✅ Set up security policies
- ✅ Create helpful views

### Step 2: Regenerate Types

```bash
npx supabase gen types typescript --project-id huknlixecscpyfficeom > src/integrations/supabase/types.ts
```

### Step 3: Restart Dev Server

```bash
npm run dev
```

## ✅ Done! Test It Out

### As Teacher:
1. Go to `/teacher/chat`
2. Click "Manage WhatsApp Links"
3. Select a course
4. Add WhatsApp group link
5. Save
6. Wait for students to message you

### As Student:
1. Go to `/student/chat`
2. See list of teachers
3. Click "WhatsApp Group" to join (if available)
4. Click "Message" to start private chat
5. Send a message

## 📊 Database Schema

```
courses
├── whatsapp_link (NEW)

conversations
├── id
├── student_id → profiles
├── teacher_id → profiles
└── UNIQUE(student_id, teacher_id)

direct_messages
├── id
├── conversation_id → conversations
├── sender_id → profiles
├── message_text
├── is_read
└── created_at
```

## 🎨 UI Features

### Student View
```
┌─────────────────────────────────────────┐
│  My Teachers                            │
├─────────────────────────────────────────┤
│  [👤] Prof. John Smith                  │
│       Web Development                   │
│       [Message] [WhatsApp Group]        │
├─────────────────────────────────────────┤
│  [👤] Dr. Sarah Johnson                 │
│       Data Science                      │
│       [Continue Chat 2] [WhatsApp]      │
└─────────────────────────────────────────┘
```

### Teacher View
```
┌─────────────────────────────────────────┐
│  Student Messages  [Manage WhatsApp]    │
├──────────────┬──────────────────────────┤
│              │  Alice Brown             │
│  Alice [3]   ├──────────────────────────┤
│  Bob         │  Alice: I have a         │
│  Carol       │  question...             │
│              │                          │
│              │  You: Sure, what is it?  │
│              │                          │
│              ├──────────────────────────┤
│              │  [Type message...]  [📤] │
└──────────────┴──────────────────────────┘
```

## 🔐 Security

- ✅ Students can only message teachers from enrolled courses
- ✅ Each conversation is private (only 2 people can see)
- ✅ Teachers can only see conversations with their students
- ✅ Users can only edit/delete their own messages

## 🎯 Use Cases

### WhatsApp Groups (External)
- Class announcements
- General discussions
- Quick questions
- Group study
- File sharing

### Direct Messages (In-App)
- Private questions
- Grade discussions
- Personal issues
- Assignment help
- One-on-one guidance

## 📝 How to Add WhatsApp Link

### As Teacher:
1. Create WhatsApp group externally
2. Get the invite link (https://chat.whatsapp.com/...)
3. In teacher chat, click "Manage WhatsApp Links"
4. Select your course
5. Paste the link
6. Click "Update Link"
7. Students will now see "WhatsApp Group" button

## 🔍 Troubleshooting

### Student can't see teachers
- Check if student is enrolled in courses
- Verify course_enrollments table

### WhatsApp button not showing
- Check if teacher added WhatsApp link
- Verify courses.whatsapp_link column exists

### Can't send messages
- Check if conversation was created
- Verify RLS policies
- Check browser console for errors

### Messages not showing
- Refresh the page
- Check conversation_id is correct
- Verify both users in conversation

## 🚀 Future Enhancements

- [ ] Real-time message updates
- [ ] Push notifications
- [ ] Typing indicators
- [ ] File attachments
- [ ] Voice messages
- [ ] Read receipts
- [ ] Message search
- [ ] Archive conversations

---

**Status**: ✅ Ready to use!
**Next**: Run the SQL migration and start chatting!
