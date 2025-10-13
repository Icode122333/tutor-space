import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Conversation {
  id: string;
  student_id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_avatar: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  is_read: boolean;
  is_edited: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    role: string;
  };
}

interface Teacher {
  id: string;
  full_name: string;
}

export default function StudentChat() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && profile?.role === "student") {
      fetchConversations();
      fetchTeachers();
    }
  }, [user, profile]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      markMessagesAsRead();
      scrollToBottom();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from("conversations_with_details")
      .select("*")
      .eq("student_id", user?.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
    } else {
      setConversations(data || []);
      if (data && data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    }
  };

  const fetchTeachers = async () => {
    // Get teachers from courses the student is enrolled in
    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("course_id")
      .eq("student_id", user?.id);

    if (enrollments && enrollments.length > 0) {
      const courseIds = enrollments.map((e) => e.course_id);

      const { data: courses } = await supabase
        .from("courses")
        .select("teacher_id")
        .in("id", courseIds);

      if (courses && courses.length > 0) {
        const teacherIds = [...new Set(courses.map((c) => c.teacher_id))];

        const { data: teacherProfiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", teacherIds)
          .eq("role", "teacher");

        setTeachers(teacherProfiles || []);
      }
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;

    const { data, error } = await supabase
      .from("direct_messages")
      .select(`
        *,
        sender:profiles!direct_messages_sender_id_fkey(full_name, role)
      `)
      .eq("conversation_id", selectedConversation.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedConversation) return;

    await supabase
      .from("direct_messages")
      .update({ is_read: true })
      .eq("conversation_id", selectedConversation.id)
      .eq("is_read", false)
      .neq("sender_id", user?.id);

    fetchConversations();
  };

  const handleCreateConversation = async () => {
    if (!selectedTeacher) {
      toast.error("Please select a teacher");
      return;
    }

    // Check if conversation already exists
    const existing = conversations.find((c) => c.teacher_id === selectedTeacher);
    if (existing) {
      setSelectedConversation(existing);
      setShowNewChatDialog(false);
      toast.info("Conversation already exists");
      return;
    }

    const { data, error } = await supabase
      .from("direct_conversations")
      .insert({
        student_id: user?.id,
        teacher_id: selectedTeacher,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create conversation");
      console.error(error);
    } else {
      toast.success("Conversation created!");
      setShowNewChatDialog(false);
      setSelectedTeacher("");
      fetchConversations();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const { error } = await supabase.from("direct_messages").insert({
      conversation_id: selectedConversation.id,
      sender_id: user?.id,
      message_text: newMessage,
    });

    if (error) {
      toast.error("Failed to send message");
      console.error(error);
    } else {
      setNewMessage("");
      fetchMessages();
      fetchConversations();
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-black">Messages</h1>
            <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#006d2c] hover:bg-[#005523] text-white gap-2">
                  <Plus className="h-4 w-4" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                  <DialogDescription>Select a teacher to message</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowNewChatDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateConversation}
                    className="bg-[#006d2c] hover:bg-[#005523]"
                  >
                    Start Chat
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Chat Interface */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Conversations List */}
          <div className="w-80 bg-white border-r flex flex-col">
            <div className="p-4 border-b bg-[#006d2c]">
              <h2 className="font-semibold text-white">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Click "New Chat" to message a teacher</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b ${
                      selectedConversation?.id === conv.id ? "bg-gray-100" : ""
                    }`}
                  >
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarFallback className="bg-[#006d2c] text-white">
                        {conv.teacher_name?.substring(0, 2).toUpperCase() || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">{conv.teacher_name}</h3>
                        {conv.last_message_at && (
                          <span className="text-xs text-gray-500">
                            {getTimeAgo(conv.last_message_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600 truncate flex-1">
                          {conv.last_message || "No messages yet"}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge className="ml-2 bg-[#006d2c] text-white">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Middle Section - Active Chat */}
          {selectedConversation ? (
            <div className="flex-1 flex flex-col bg-gray-50">
              {/* Chat Header */}
              <div className="bg-white border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-[#006d2c] text-white">
                      {selectedConversation.teacher_name?.substring(0, 2).toUpperCase() || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.teacher_name}</h3>
                    <p className="text-sm text-gray-500">Teacher</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.sender_id === user?.id;
                  const senderName = message.sender?.full_name || "Unknown";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-md ${isOwnMessage ? "order-2" : "order-1"}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isOwnMessage
                              ? "bg-[#006d2c] text-white"
                              : "bg-white text-gray-900 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold">
                              {isOwnMessage ? "You" : senderName}
                            </span>
                            {message.is_edited && (
                              <span className="text-xs opacity-70">(edited)</span>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span
                              className={`text-xs ${
                                isOwnMessage ? "text-white/70" : "text-gray-500"
                              }`}
                            >
                              {getTimeAgo(message.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white border-t p-4">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Write a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="bg-[#006d2c] hover:bg-[#005523] text-white"
                    size="icon"
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No conversation selected
                </h3>
                <p className="text-gray-600">Select a conversation or start a new chat</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
