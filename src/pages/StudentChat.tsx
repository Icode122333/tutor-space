import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare, ExternalLink, Sparkles, Clock, CheckCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
      .order("created_at", { ascending: true});

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

  const startConversation = async (teacherId: string, teacherName: string) => {
    let conversation = conversations.find((c) => c.teacher_id === teacherId);

    if (!conversation) {
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
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <StudentSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-green-100 px-6 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-[#006d2c]" />
                  <h1 className="text-2xl font-bold text-[#006d2c]">
                    My Teachers
                  </h1>
                </div>
                <p className="text-sm text-gray-600 mt-1">Connect with your instructors</p>
              </div>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Teachers/Conversations List */}
            <div className="w-96 bg-white border-r border-green-100 flex flex-col overflow-hidden">
              <div className="p-4 bg-[#006d2c]">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Active Conversations
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {teachers.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-[#006d2c]" />
                    </div>
                    <p className="text-gray-600 font-medium">No teachers yet</p>
                    <p className="text-sm text-gray-500 mt-2">Enroll in a course to connect</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {teachers.map((teacher) => {
                      const conversation = conversations.find((c) => c.teacher_id === teacher.teacher_id);
                      const unreadCount = conversation?.unread_count || 0;
                      const isSelected = selectedConversation?.teacher_id === teacher.teacher_id;

                      return (
                        <button
                          key={`${teacher.teacher_id}-${teacher.course_id}`}
                          onClick={() => startConversation(teacher.teacher_id, teacher.teacher_name)}
                          className={`w-full p-4 rounded-xl text-left ${
                            isSelected
                              ? "bg-[#006d2c] shadow-lg"
                              : "bg-white hover:bg-green-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                <AvatarFallback className={`text-lg font-bold ${
                                  isSelected ? "bg-white text-[#006d2c]" : "bg-[#006d2c] text-white"
                                }`}>
                                  {teacher.teacher_name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#006d2c] rounded-full flex items-center justify-center shadow-lg">
                                  <span className="text-xs font-bold text-white">{unreadCount}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className={`font-semibold truncate ${
                                  isSelected ? "text-white" : "text-gray-900"
                                }`}>
                                  {teacher.teacher_name}
                                </h3>
                                {conversation?.last_message_at && (
                                  <span className={`text-xs flex items-center gap-1 ${
                                    isSelected ? "text-white/80" : "text-gray-500"
                                  }`}>
                                    <Clock className="h-3 w-3" />
                                    {getTimeAgo(conversation.last_message_at)}
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm truncate ${
                                isSelected ? "text-white/90" : "text-gray-600"
                              }`}>
                                {teacher.course_name}
                              </p>
                              {conversation?.last_message && (
                                <p className={`text-xs mt-1 truncate ${
                                  isSelected ? "text-white/70" : "text-gray-500"
                                }`}>
                                  {conversation.last_message}
                                </p>
                              )}
                              {teacher.whatsapp_link && (
                                <Badge 
                                  variant="secondary" 
                                  className={`mt-2 text-xs ${
                                    isSelected ? "bg-white/20 text-white" : "bg-green-100 text-[#006d2c]"
                                  }`}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  WhatsApp
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            {selectedConversation ? (
              <div className="flex-1 flex flex-col bg-white">
                {/* Chat Header */}
                <div className="bg-white border-b border-green-100 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-[#006d2c]">
                        <AvatarFallback className="bg-[#006d2c] text-white text-lg font-bold">
                          {selectedConversation.teacher_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-gray-900">{selectedConversation.teacher_name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-[#006d2c] rounded-full"></span>
                          Teacher
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#006d2c] text-white">
                        {messages.length} messages
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 scrollbar-hide">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <Card className="p-8 text-center bg-white border-2 border-dashed border-green-200">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                          <MessageSquare className="h-10 w-10 text-[#006d2c]" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Start the conversation!</h3>
                        <p className="text-sm text-gray-600">Send your first message to {selectedConversation.teacher_name}</p>
                      </Card>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isOwnMessage = message.sender_id === user?.id;
                      const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          {!isOwnMessage && showAvatar && (
                            <Avatar className="h-8 w-8 border-2 border-white">
                              <AvatarFallback className="bg-[#006d2c] text-white text-xs">
                                {selectedConversation.teacher_name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!isOwnMessage && !showAvatar && <div className="w-8" />}
                          
                          <div className={`max-w-md ${isOwnMessage ? "order-2" : "order-1"}`}>
                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                isOwnMessage
                                  ? "bg-[#006d2c] text-white rounded-br-sm"
                                  : "bg-white text-gray-900 rounded-bl-sm border border-green-100"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message_text}</p>
                              <div className="flex items-center justify-between mt-2 gap-2">
                                <span
                                  className={`text-xs flex items-center gap-1 ${
                                    isOwnMessage ? "text-white/70" : "text-gray-500"
                                  }`}
                                >
                                  <Clock className="h-3 w-3" />
                                  {getTimeAgo(message.created_at)}
                                </span>
                                {isOwnMessage && message.is_read && (
                                  <CheckCheck className="h-4 w-4 text-white/70" />
                                )}
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
                <div className="bg-white border-t border-green-100 p-4 shadow-lg">
                  <div className="flex items-end gap-3">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 min-h-[44px] max-h-32 resize-none border-green-200 focus:border-[#006d2c] focus:ring-[#006d2c]"
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
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <Card className="p-12 text-center bg-white border-2 border-green-200">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageSquare className="h-12 w-12 text-[#006d2c]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Select a teacher to chat</h3>
                  <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
