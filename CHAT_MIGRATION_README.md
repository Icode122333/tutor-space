# Enhanced Chat System - Migration Guide

## Overview
This migration enhances the chat system with comprehensive features including:
- Independent group chats (not tied to courses)
- Group member management with roles (admin, moderator, member)
- Message reactions and read receipts
- File attachments support
- Message editing and deletion
- Reply to messages
- Mark messages as resolved
- WhatsApp integration
- Archive groups

## Database Changes

### New Tables
1. **group_chats** (recreated with new structure)
   - `id`, `group_name`, `description`, `teacher_id`, `whatsapp_link`, `is_archived`
   - Independent of courses, created by teachers

2. **group_members**
   - Tracks who's in each group
   - Supports roles: admin, moderator, member
   - Tracks last_read_at for unread message counts

3. **chat_messages** (recreated with enhanced features)
   - `message_type`: text, file, image, announcement
   - `file_url`, `file_name`, `file_size` for attachments
   - `is_resolved`, `resolved_by`, `resolved_at` for Q&A tracking
   - `reply_to_id` for threaded conversations
   - `is_edited`, `edited_at` for edit tracking

4. **message_reactions**
   - Emoji reactions on messages

5. **message_read_receipts**
   - Track who has read each message

### Views
- **group_chats_with_stats**: Provides member count and last message info

### Triggers
- Auto-add teacher as admin when creating group
- Update group's updated_at when new message is sent

## How to Apply Migration

### Step 1: Apply the SQL Migration
```bash
# If using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy content from: tutor-space/supabase/migrations/20251013000000_enhanced_chat_system.sql
# 3. Run the SQL
```

### Step 2: Regenerate TypeScript Types
```bash
# Generate new types from database
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Or if using remote database:
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

### Step 3: Restart Development Server
```bash
npm run dev
```

## Features Implemented

### Teacher Chat Features
✅ Create independent chat groups
✅ Add group description
✅ Edit group details
✅ Archive groups
✅ View group members with roles
✅ Send messages with Enter (Shift+Enter for new line)
✅ Edit own messages
✅ Delete own messages
✅ Reply to messages
✅ Mark student questions as resolved
✅ WhatsApp group integration
✅ Real-time message updates
✅ Auto-scroll to latest message
✅ Message timestamps with "time ago" format
✅ Visual distinction for teacher vs student messages
✅ Announcement message type support

### Student Chat Features (To be implemented)
- View groups they're members of
- Send messages
- React to messages with emojis
- Reply to messages
- Edit/delete own messages
- View read receipts
- Upload file attachments

## Database Schema

### group_chats
```sql
CREATE TABLE public.group_chats (
  id UUID PRIMARY KEY,
  group_name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  whatsapp_link TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### group_members
```sql
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY,
  group_chat_id UUID NOT NULL REFERENCES group_chats(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_chat_id, user_id)
);
```

### chat_messages
```sql
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY,
  group_chat_id UUID NOT NULL REFERENCES group_chats(id),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  reply_to_id UUID REFERENCES chat_messages(id),
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security (RLS Policies)

All tables have Row Level Security enabled with appropriate policies:
- Teachers can manage their own groups
- Group members can view and send messages in their groups
- Users can only edit/delete their own messages
- Teachers can mark any message as resolved in their groups
- Read receipts and reactions are visible to group members

## Next Steps

1. Apply the migration
2. Regenerate types
3. Test the teacher chat interface
4. Implement student chat page
5. Add file upload functionality
6. Add emoji reactions UI
7. Implement real-time subscriptions for live updates
8. Add push notifications for new messages

## Troubleshooting

### TypeScript Errors
If you see TypeScript errors about missing table types:
1. Make sure migration is applied
2. Regenerate types: `supabase gen types typescript`
3. Restart your IDE/dev server

### RLS Policy Errors
If users can't access data:
1. Check user is authenticated
2. Verify user's role in profiles table
3. Check RLS policies in Supabase dashboard

### Migration Conflicts
If migration fails due to existing tables:
1. The migration drops and recreates tables
2. **WARNING**: This will delete existing chat data
3. Backup data before applying if needed
