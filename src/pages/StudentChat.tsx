import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare, ArrowLeft, ExternalLink } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Teacher {
  teacher_id: string;
  teacher_name: string;
  teacher_avatar: string | null;
  course_id: string;
  course_name: string;
  whatsapp_link: string | null;
}

interface Conversation {
  id: string;
  student_id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_avatar: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  is_read: boolean;
  is_edited: boolean;
  created_at: string;
}

export default function StudentChat() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [view, setView] = useState<"teachers" | "chat">("teachers");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchTeachers();
      fetchConversations();
    }
  }, [user]);

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

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from("student_teachers_with_whatsapp")
      .select("*")
      .eq("student_id", user?.id);

    if (error) {
      console.error("Error fetching teachers:", error);
    } else {
      setTeachers(data || []);
    }
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
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;

    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
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

    fetchConversations(); // Refresh to update unread counts
  };

  const startConversation = async (teacherId: string, teacherName: string) => {
    // Check if conversation already exists
    let conversation = conversations.find((c) => c.teacher_id === teacherId);

    if (!conversation) {
      // Create new conversation
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          student_id: user?.id,
          teacher_id: teacherId,
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to start conversation");
        console.error(error);
        return;
      }

      conversation = {
        ...data,
        teacher_name: teacherName,
        teacher_avatar: null,
        last_message: null,
        last_message_at: null,
        unread_count: 0,
      };

      await fetchConversations();
    }

    setSelectedConversation(conversation);
    setView("chat");
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

  const handleBackToTeachers = () => {
    setView("teachers");
    setSelectedConversation(null);
  };

  if (view === "chat" && selectedConversation) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Chat Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackToTeachers}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarFallback className="bg-[#006d2c] text-white">
                {selectedConversation.teacher_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-bold text-black">{selectedConversation.teacher_name}</h1>
              <p className="text-sm text-gray-500">Teacher</p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No messages yet</p>
              <p className="text-sm text-gray-500 mt-2">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;
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
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t p-4">
          <div className="flex items-end gap-3">
            <Textarea
              placeholder="Write a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              rows={1}
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-black">My Teachers</h1>
        <p className="text-sm text-gray-600 mt-1">Message your teachers or join WhatsApp groups</p>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Teachers List */}
        <div className="space-y-4">
          {teachers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No teachers found</p>
              <p className="text-sm text-gray-500 mt-2">Enroll in a course to see your teachers</p>
            </div>
          ) : (
            teachers.map((teacher) => {
              const conversation = conversations.find((c) => c.teacher_id === teacher.teacher_id);
              const unreadCount = conversation?.unread_count || 0;

              return (
                <div
                  key={`${teacher.teacher_id}-${teacher.course_id}`}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-[#006d2c] text-white text-lg">
                          {teacher.teacher_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {teacher.teacher_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{teacher.course_name}</p>
                        {conversation?.last_message && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                            {conversation.last_message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Button
                        onClick={() => startConversation(teacher.teacher_id, teacher.teacher_name)}
                        className="bg-[#006d2c] hover:bg-[#005523] text-white"
                        size="sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {conversation ? "Continue Chat" : "Message"}
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {unreadCount}
                          </Badge>
                        )}
                      </Button>
                      {teacher.whatsapp_link && (
                        <Button
                          onClick={() => window.open(teacher.whatsapp_link!, "_blank")}
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          WhatsApp Group
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Active Conversations Section */}
        {conversations.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Conversations</h2>
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    setView("chat");
                  }}
                  className="w-full bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-[#006d2c] text-white">
                        {conversation.teacher_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {conversation.teacher_name}
                        </h3>
                        {conversation.last_message_at && (
                          <span className="text-xs text-gray-500">
                            {getTimeAgo(conversation.last_message_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message || "No messages yet"}
                      </p>
                    </div>
                    {conversation.unread_count > 0 && (
                      <Badge variant="destructive">{conversation.unread_count}</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
