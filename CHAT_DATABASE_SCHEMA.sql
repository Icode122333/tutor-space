-- ============================================
-- ENHANCED CHAT SYSTEM - DATABASE SCHEMA
-- ============================================
-- This file shows the complete database schema for reference
-- DO NOT RUN THIS FILE - Use the migration file instead:
-- tutor-space/supabase/migrations/20251013000000_enhanced_chat_system.sql
-- ============================================

-- ============================================
-- TABLE: group_chats
-- Purpose: Store chat groups created by teachers
-- ============================================
CREATE TABLE public.group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,                    -- Name of the chat group
  description TEXT,                            -- Optional description
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  whatsapp_link TEXT,                          -- Optional WhatsApp group link
  is_archived BOOLEAN DEFAULT false,           -- Soft delete for groups
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Example data:
-- {
--   "id": "123e4567-e89b-12d3-a456-426614174000",
--   "group_name": "Web Development Q&A",
--   "description": "Ask questions about HTML, CSS, JavaScript",
--   "teacher_id": "teacher-uuid-here",
--   "whatsapp_link": "https://chat.whatsapp.com/xyz",
--   "is_archived": false,
--   "created_at": "2025-10-13T10:00:00Z",
--   "updated_at": "2025-10-13T10:00:00Z"
-- }

-- ============================================
-- TABLE: group_members
-- Purpose: Track which users are in which groups
-- ============================================
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),      -- For unread message tracking
  UNIQUE(group_chat_id, user_id)               -- User can only be in group once
);

-- Example data:
-- {
--   "id": "member-uuid-1",
--   "group_chat_id": "123e4567-e89b-12d3-a456-426614174000",
--   "user_id": "student-uuid-1",
--   "role": "member",
--   "joined_at": "2025-10-13T10:05:00Z",
--   "last_read_at": "2025-10-13T11:30:00Z"
-- }

-- ============================================
-- TABLE: chat_messages
-- Purpose: Store all messages in chat groups
-- ============================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,                  -- The actual message content
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'announcement')),
  
  -- File attachment fields
  file_url TEXT,                               -- URL to uploaded file
  file_name TEXT,                              -- Original filename
  file_size INTEGER,                           -- File size in bytes
  
  -- Resolution tracking (for Q&A)
  is_resolved BOOLEAN DEFAULT false,           -- Has question been answered?
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  
  -- Threading
  reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  
  -- Edit tracking
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Example data:
-- {
--   "id": "msg-uuid-1",
--   "group_chat_id": "123e4567-e89b-12d3-a456-426614174000",
--   "sender_id": "student-uuid-1",
--   "message_text": "How do I center a div?",
--   "message_type": "text",
--   "file_url": null,
--   "file_name": null,
--   "file_size": null,
--   "is_resolved": true,
--   "resolved_by": "teacher-uuid-here",
--   "resolved_at": "2025-10-13T11:00:00Z",
--   "reply_to_id": null,
--   "is_edited": false,
--   "edited_at": null,
--   "created_at": "2025-10-13T10:30:00Z"
-- }

-- ============================================
-- TABLE: message_reactions
-- Purpose: Store emoji reactions on messages
-- ============================================
CREATE TABLE public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,                         -- Emoji character (e.g., "👍", "❤️")
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)           -- User can only react once with same emoji
);

-- Example data:
-- {
--   "id": "reaction-uuid-1",
--   "message_id": "msg-uuid-1",
--   "user_id": "teacher-uuid-here",
--   "emoji": "👍",
--   "created_at": "2025-10-13T10:31:00Z"
-- }

-- ============================================
-- TABLE: message_read_receipts
-- Purpose: Track who has read which messages
-- ============================================
CREATE TABLE public.message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)                  -- User can only read message once
);

-- Example data:
-- {
--   "id": "receipt-uuid-1",
--   "message_id": "msg-uuid-1",
--   "user_id": "student-uuid-2",
--   "read_at": "2025-10-13T10:35:00Z"
-- }

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_group_chats_teacher_id ON public.group_chats(teacher_id);
CREATE INDEX idx_group_chats_created_at ON public.group_chats(created_at DESC);
CREATE INDEX idx_group_members_group_chat_id ON public.group_members(group_chat_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_chat_messages_group_chat_id ON public.chat_messages(group_chat_id);
CREATE INDEX idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX idx_message_read_receipts_message_id ON public.message_read_receipts(message_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_group_chats_updated_at
  BEFORE UPDATE ON public.group_chats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-add teacher as admin when creating group
CREATE OR REPLACE FUNCTION public.add_teacher_as_group_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_chat_id, user_id, role)
  VALUES (NEW.id, NEW.teacher_id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER add_teacher_as_admin_trigger
  AFTER INSERT ON public.group_chats
  FOR EACH ROW
  EXECUTE FUNCTION public.add_teacher_as_group_admin();

-- Update group's updated_at when new message is sent
CREATE OR REPLACE FUNCTION public.update_group_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.group_chats
  SET updated_at = NOW()
  WHERE id = NEW.group_chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_on_message_trigger
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_on_new_message();

-- ============================================
-- VIEWS
-- ============================================

-- View for group chats with statistics
CREATE OR REPLACE VIEW public.group_chats_with_stats AS
SELECT 
  gc.*,
  COUNT(DISTINCT gm.user_id) as member_count,
  (
    SELECT cm.message_text
    FROM public.chat_messages cm
    WHERE cm.group_chat_id = gc.id
    ORDER BY cm.created_at DESC
    LIMIT 1
  ) as last_message,
  (
    SELECT cm.created_at
    FROM public.chat_messages cm
    WHERE cm.group_chat_id = gc.id
    ORDER BY cm.created_at DESC
    LIMIT 1
  ) as last_message_at
FROM public.group_chats gc
LEFT JOIN public.group_members gm ON gc.id = gm.group_chat_id
GROUP BY gc.id;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

-- group_chats policies
CREATE POLICY "Teachers can view their own groups"
  ON public.group_chats FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Group members can view their groups"
  ON public.group_chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_chat_id = group_chats.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create groups"
  ON public.group_chats FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Teachers can update their own groups"
  ON public.group_chats FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own groups"
  ON public.group_chats FOR DELETE
  USING (auth.uid() = teacher_id);

-- group_members policies
CREATE POLICY "Group members can view members of their groups"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_chat_id = group_members.group_chat_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can add members to their groups"
  ON public.group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_chats
      WHERE id = group_chat_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can remove members from their groups"
  ON public.group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_chats
      WHERE id = group_chat_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Members can update their own membership (last_read_at)"
  ON public.group_members FOR UPDATE
  USING (auth.uid() = user_id);

-- chat_messages policies
CREATE POLICY "Group members can view messages in their groups"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_chat_id = chat_messages.group_chat_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_chat_id = chat_messages.group_chat_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Senders can update their own messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = sender_id);

CREATE POLICY "Teachers can update messages in their groups (for resolving)"
  ON public.chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_chats
      WHERE id = group_chat_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Senders can delete their own messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- message_reactions policies
CREATE POLICY "Group members can view reactions"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      JOIN public.group_members gm ON cm.group_chat_id = gm.group_chat_id
      WHERE cm.id = message_reactions.message_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can add reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      JOIN public.group_members gm ON cm.group_chat_id = gm.group_chat_id
      WHERE cm.id = message_reactions.message_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own reactions"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- message_read_receipts policies
CREATE POLICY "Group members can view read receipts"
  ON public.message_read_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      JOIN public.group_members gm ON cm.group_chat_id = gm.group_chat_id
      WHERE cm.id = message_read_receipts.message_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own read receipts"
  ON public.message_read_receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SAMPLE QUERIES
-- ============================================

-- Get all groups for a teacher
-- SELECT * FROM group_chats WHERE teacher_id = 'teacher-uuid' AND is_archived = false;

-- Get all groups for a student
-- SELECT gc.* FROM group_chats gc
-- JOIN group_members gm ON gc.id = gm.group_chat_id
-- WHERE gm.user_id = 'student-uuid' AND gc.is_archived = false;

-- Get all messages in a group with sender info
-- SELECT cm.*, p.full_name, p.role
-- FROM chat_messages cm
-- JOIN profiles p ON cm.sender_id = p.id
-- WHERE cm.group_chat_id = 'group-uuid'
-- ORDER BY cm.created_at ASC;

-- Get unread message count for a user in a group
-- SELECT COUNT(*) FROM chat_messages cm
-- WHERE cm.group_chat_id = 'group-uuid'
-- AND cm.created_at > (
--   SELECT last_read_at FROM group_members
--   WHERE group_chat_id = 'group-uuid' AND user_id = 'user-uuid'
-- );

-- Get all reactions for a message
-- SELECT mr.emoji, COUNT(*) as count, 
--        ARRAY_AGG(p.full_name) as users
-- FROM message_reactions mr
-- JOIN profiles p ON mr.user_id = p.id
-- WHERE mr.message_id = 'message-uuid'
-- GROUP BY mr.emoji;

-- ============================================
-- END OF SCHEMA
-- ============================================
