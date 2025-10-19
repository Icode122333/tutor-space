import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare, Users, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface TeacherCourse {
  course_id: string;
  course_name: string;
  student_count: number;
  whatsapp_link: string | null;
}

interface StudentConversation {
  id: string;
  student_id: string;
  teacher_id: string;
  student_name: string;
  student_avatar: string | null;
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
  created_at: string;
}

export default function TeacherChat() {
  const { user, profile } = useAuth();
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourse[]>([]);
  const [conversations, setConversations] = useState<StudentConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<StudentConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCourseIndex, setCurrentCourseIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchTeacherCourses();
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      markMessagesAsRead();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTeacherCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        id,
        title,
        whatsapp_group_link
      `)
      .eq("teacher_id", user?.id);

    if (error) {
      console.error("Error fetching teacher courses:", error);
    } else {
      const courses = data?.map((course: any) => ({
        course_id: course.id,
        course_name: course.title,
        student_count: 0,
        whatsapp_link: course.whatsapp_group_link || null,
      })) || [];
      setTeacherCourses(courses);
    }
  };

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        student_id,
        teacher_id,
        updated_at,
        profiles!conversations_student_id_fkey (
          full_name,
          avatar_url
        ),
        direct_messages (
          message_text,
          created_at,
          sender_id,
          is_read
        )
      `)
      .eq("teacher_id", user?.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
    } else {
      const formattedConversations = data?.map((conv: any) => {
        const lastMessage = conv.direct_messages?.[conv.direct_messages.length - 1];
        const unreadCount = conv.direct_messages?.filter(
          (msg: any) => !msg.is_read && msg.sender_id !== user?.id
        ).length || 0;

        return {
          id: conv.id,
          student_id: conv.student_id,
          teacher_id: conv.teacher_id,
          student_name: conv.profiles?.full_name || "Unknown Student",
          student_avatar: conv.profiles?.avatar_url || null,
          last_message: lastMessage?.message_text || null,
          last_message_at: lastMessage?.created_at || null,
          unread_count: unreadCount,
        };
      }) || [];
      setConversations(formattedConversations);
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

    fetchConversations();
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
    } else {
      setNewMessage("");
      fetchMessages();
      fetchConversations();
    }
  };

  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.student_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const nextCourse = () => {
    setCurrentCourseIndex((prev) => (prev + 1) % teacherCourses.length);
  };

  const prevCourse = () => {
    setCurrentCourseIndex((prev) => (prev - 1 + teacherCourses.length) % teacherCourses.length);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-green-50 via-white to-green-100">
        <TeacherSidebar />

        <div className="flex-1 flex flex-col p-6 gap-6">
          {/* Teacher Course Management Widget */}
          {teacherCourses.length > 0 && (
            <div className="relative">
              <Card className="bg-gradient-to-r from-[#006d2c] to-[#008d3c] text-white border-0 shadow-2xl rounded-3xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5" />
                        <h3 className="font-bold text-lg">Course Group Management</h3>
                      </div>
                      <p className="text-2xl font-bold mb-1">{teacherCourses[currentCourseIndex]?.course_name}</p>
                      <p className="text-sm text-white/80 mb-4">
                        Manage your course group chat and communicate with students
                      </p>
                      <Button
                        className="bg-white text-[#006d2c] hover:bg-gray-100 font-semibold"
                        onClick={() => {
                          const link = teacherCourses[currentCourseIndex]?.whatsapp_link;
                          if (link) {
                            window.open(link, '_blank');
                          } else {
                            toast.error("No WhatsApp group link set for this course");
                          }
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Open Group Chat
                      </Button>
                    </div>
                    <div className="hidden md:block">
                      <img
                        src="/images/whatsapp illustration.webp"
                        alt="Chat illustration"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {teacherCourses.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white shadow-lg"
                    onClick={prevCourse}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow-lg"
                    onClick={nextCourse}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Three-Column Chat Layout */}
          <Card className="flex-1 flex overflow-hidden shadow-2xl rounded-3xl">
            {/* Left Sidebar - Student Conversations List */}
            <div className="w-80 flex flex-col bg-[#006d2c]">
              <div className="p-4 border-b border-white/10">
                <h2 className="font-bold text-lg mb-3 flex items-center gap-2 text-white">
                  <MessageSquare className="h-5 w-5" />
                  Student Messages
                  {conversations.length > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-white text-[#006d2c]">
                      {conversations.reduce((sum, conv) => sum + conv.unread_count, 0)} new
                    </Badge>
                  )}
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                  <Input
                    placeholder="Search students"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-white/60">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No student messages yet</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 border-b border-white/10 hover:bg-white/10 transition-colors text-left ${
                        selectedConversation?.id === conv.id ? "bg-white/20" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-white/20">
                            {conv.student_avatar ? (
                              <img src={conv.student_avatar} alt={conv.student_name} className="object-cover" />
                            ) : (
                              <AvatarFallback className="bg-white text-[#006d2c]">
                                {conv.student_name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#006d2c]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold truncate text-white">{conv.student_name}</h3>
                            {conv.last_message_at && (
                              <span className="text-xs text-white/60">
                                {formatDate(conv.last_message_at)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-white/80 truncate">
                            {conv.last_message || "No messages yet"}
                          </p>
                          {conv.unread_count > 0 && (
                            <Badge className="mt-1 bg-white text-[#006d2c]">{conv.unread_count}</Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Middle Section - Chat Area */}
            {selectedConversation ? (
              <div className="flex-1 flex flex-col bg-white">
                {/* Chat Header */}
                <div className="p-4 border-b bg-white flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {selectedConversation.student_avatar ? (
                        <img src={selectedConversation.student_avatar} alt={selectedConversation.student_name} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-[#006d2c] text-white">
                          {selectedConversation.student_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedConversation.student_name}</h3>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Student
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-white">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isOwnMessage = message.sender_id === user?.id;
                        const showDate =
                          index === 0 ||
                          formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);

                        return (
                          <div key={message.id}>
                            {showDate && (
                              <div className="flex justify-center my-4">
                                <span className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full">
                                  {formatDate(message.created_at)}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-md ${isOwnMessage ? "order-2" : "order-1"}`}>
                                <div
                                  className={`rounded-2xl px-4 py-2 shadow-md ${
                                    isOwnMessage
                                      ? "bg-green-500 text-white rounded-br-none"
                                      : "bg-blue-500 text-white rounded-bl-none"
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                                  <span className="text-xs opacity-70 mt-1 block text-right">
                                    {formatTime(message.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-white shadow-lg">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Message"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 rounded-full border-gray-300 focus:border-[#006d2c] focus:ring-[#006d2c]"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-full h-10 w-10"
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-24 w-24 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                  <p>Choose a student from the list to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </SidebarProvider>
  );
}
