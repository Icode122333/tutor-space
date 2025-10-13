-- Direct Messaging System Migration
-- This creates a 1-on-1 chat system between teachers and students
-- Plus WhatsApp group links per course

-- Drop the old group chat tables
DROP TABLE IF EXISTS public.message_read_receipts CASCADE;
DROP TABLE IF EXISTS public.message_reactions CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.group_chats CASCADE;
DROP VIEW IF EXISTS public.group_chats_with_stats CASCADE;

-- Add WhatsApp link to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS whatsapp_group_link TEXT;

-- Create direct_conversations table (1-on-1 chats)
CREATE TABLE public.direct_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, teacher_id)
);

-- Create direct_messages table
CREATE TABLE public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for direct_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.direct_conversations FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = teacher_id);

CREATE POLICY "Students can create conversations with teachers"
  ON public.direct_conversations FOR INSERT
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student') AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = teacher_id AND role = 'teacher')
  );

-- RLS Policies for direct_messages
CREATE POLICY "Conversation participants can view messages"
  ON public.direct_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.direct_conversations
      WHERE id = conversation_id
      AND (student_id = auth.uid() OR teacher_id = auth.uid())
    )
  );

CREATE POLICY "Conversation participants can send messages"
  ON public.direct_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.direct_conversations
      WHERE id = conversation_id
      AND (student_id = auth.uid() OR teacher_id = auth.uid())
    )
  );

CREATE POLICY "Senders can update their own messages"
  ON public.direct_messages FOR UPDATE
  USING (auth.uid() = sender_id);

CREATE POLICY "Senders can delete their own messages"
  ON public.direct_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Create indexes
CREATE INDEX idx_direct_conversations_student_id ON public.direct_conversations(student_id);
CREATE INDEX idx_direct_conversations_teacher_id ON public.direct_conversations(teacher_id);
CREATE INDEX idx_direct_conversations_updated_at ON public.direct_conversations(updated_at DESC);
CREATE INDEX idx_direct_messages_conversation_id ON public.direct_messages(conversation_id);
CREATE INDEX idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_created_at ON public.direct_messages(created_at DESC);
CREATE INDEX idx_direct_messages_is_read ON public.direct_messages(is_read);

-- Trigger to update conversation updated_at
CREATE TRIGGER update_direct_conversations_updated_at
  BEFORE UPDATE ON public.direct_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update conversation when new message is sent
CREATE OR REPLACE FUNCTION public.update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.direct_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message_trigger
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_on_new_message();

-- View for conversations with last message and unread count
CREATE OR REPLACE VIEW public.conversations_with_details AS
SELECT 
  dc.*,
  sp.full_name as student_name,
  sp.avatar_url as student_avatar,
  tp.full_name as teacher_name,
  tp.avatar_url as teacher_avatar,
  (
    SELECT dm.message_text
    FROM public.direct_messages dm
    WHERE dm.conversation_id = dc.id
    ORDER BY dm.created_at DESC
    LIMIT 1
  ) as last_message,
  (
    SELECT dm.created_at
    FROM public.direct_messages dm
    WHERE dm.conversation_id = dc.id
    ORDER BY dm.created_at DESC
    LIMIT 1
  ) as last_message_at,
  (
    SELECT COUNT(*)
    FROM public.direct_messages dm
    WHERE dm.conversation_id = dc.id
    AND dm.is_read = false
    AND dm.sender_id != auth.uid()
  ) as unread_count
FROM public.direct_conversations dc
JOIN public.profiles sp ON dc.student_id = sp.id
JOIN public.profiles tp ON dc.teacher_id = tp.id;
