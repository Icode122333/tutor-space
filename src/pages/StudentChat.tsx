import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare, Users, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CourseGroup {
  course_id: string;
  course_name: string;
  student_count: number;
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
  created_at: string;
}

export default function StudentChat() {
  const { user, profile } = useAuth();
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchCourseGroups();
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

  const fetchCourseGroups = async () => {
    const { data, error } = await supabase
      .from("course_enrollments")
      .select(`
        course_id,
        courses (
          id,
          title,
          whatsapp_group_link,
          profiles (
            full_name
          )
        )
      `)
      .eq("student_id", user?.id);

    if (error) {
      console.error("Error fetching course groups:", error);
    } else {
      const groups = data?.map((enrollment: any) => ({
        course_id: enrollment.courses.id,
        course_name: enrollment.courses.title,
        student_count: 0,
        whatsapp_link: enrollment.courses.whatsapp_group_link || null,
      })) || [];
      setCourseGroups(groups);
    }
  };

  const fetchConversations = async () => {
    if (!user?.id) {
      console.log("No user ID available");
      return;
    }

    console.log("Fetching conversations for user:", user.id);

    try {
      // Step 1: Get all enrolled courses with their teacher_id
      const { data: enrollments, error: enrollError } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("student_id", user.id);

      console.log("Enrollments:", enrollments, "Error:", enrollError);

      if (enrollError) {
        console.error("Error fetching enrollments:", enrollError);
        return;
      }

      if (!enrollments || enrollments.length === 0) {
        console.log("No enrollments found");
        setConversations([]);
        return;
      }

      // Step 2: Get courses with teacher_id
      const courseIds = enrollments.map(e => e.course_id);
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("id, teacher_id")
        .in("id", courseIds);

      console.log("Courses:", courses, "Error:", coursesError);

      if (coursesError) {
        console.error("Error fetching courses:", coursesError);
        return;
      }

      // Step 3: Get unique teacher IDs
      const teacherIds = [...new Set(courses?.map(c => c.teacher_id).filter(Boolean))];
      console.log("Teacher IDs:", teacherIds);

      if (teacherIds.length === 0) {
        console.log("No teachers found");
        setConversations([]);
        return;
      }

      // Step 4: Fetch teacher profiles using RPC or direct query
      const { data: teachers, error: teacherError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .in("id", teacherIds)
        .eq("role", "teacher");

      console.log("Teachers:", teachers, "Error:", teacherError);

      if (teacherError) {
        console.error("Error fetching teachers:", teacherError);
        // Continue anyway with empty teachers array
      }

      // Step 5: Fetch existing conversations directly from conversations table
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select(`
          id,
          student_id,
          teacher_id,
          created_at,
          updated_at
        `)
        .eq("student_id", user.id);

      console.log("Existing conversations:", conversations, "Error:", convError);

      // Fetch teacher details for existing conversations
      let existingConvs: any[] = [];
      if (conversations && conversations.length > 0) {
        const convTeacherIds = conversations.map(c => c.teacher_id);
        const { data: convTeachers } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", convTeacherIds);

        // Get last messages for each conversation
        const { data: lastMessages } = await supabase
          .from("direct_messages")
          .select("conversation_id, message_text, created_at, is_read, sender_id")
          .in("conversation_id", conversations.map(c => c.id))
          .order("created_at", { ascending: false });

        // Build conversation objects with details
        existingConvs = conversations.map(conv => {
          const teacher = convTeachers?.find(t => t.id === conv.teacher_id);
          const lastMsg = lastMessages?.find(m => m.conversation_id === conv.id);
          const unreadCount = lastMessages?.filter(
            m => m.conversation_id === conv.id && 
            !m.is_read && 
            m.sender_id !== user.id
          ).length || 0;

          return {
            id: conv.id,
            student_id: conv.student_id,
            teacher_id: conv.teacher_id,
            teacher_name: teacher?.full_name || 'Unknown Teacher',
            teacher_avatar: teacher?.avatar_url,
            last_message: lastMsg?.message_text || null,
            last_message_at: lastMsg?.created_at || null,
            unread_count: unreadCount,
          };
        });
      }

      console.log("Processed existing conversations:", existingConvs);

      // Step 6: Create conversations list
      const conversationsList: Conversation[] = [];
      const existingTeacherIds = new Set(existingConvs?.map(c => c.teacher_id) || []);

      // Add existing conversations first
      if (existingConvs) {
        conversationsList.push(...existingConvs);
      }

      // Add teachers without conversations
      teachers?.forEach((teacher: any) => {
        if (!existingTeacherIds.has(teacher.id)) {
          conversationsList.push({
            id: `new-${teacher.id}`,
            student_id: user.id,
            teacher_id: teacher.id,
            teacher_name: teacher.full_name || 'Unknown Teacher',
            teacher_avatar: teacher.avatar_url,
            last_message: null,
            last_message_at: null,
            unread_count: 0,
          });
        }
      });

      console.log("Final conversations list:", conversationsList);
      setConversations(conversationsList);
    } catch (error) {
      console.error("Unexpected error in fetchConversations:", error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;

    // If it's a new conversation (ID starts with 'new-'), don't fetch messages yet
    if (selectedConversation.id.startsWith('new-')) {
      setMessages([]);
      return;
    }

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
    if (!selectedConversation || selectedConversation.id.startsWith('new-')) return;

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

    let conversationId = selectedConversation.id;

    // If it's a new conversation, create it first
    if (conversationId.startsWith('new-')) {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          student_id: user?.id,
          teacher_id: selectedConversation.teacher_id,
        })
        .select()
        .single();

      if (convError) {
        toast.error("Failed to create conversation");
        return;
      }

      conversationId = newConv.id;
      
      // Update selected conversation with real ID
      setSelectedConversation({
        ...selectedConversation,
        id: conversationId,
      });
    }

    const { error } = await supabase.from("direct_messages").insert({
      conversation_id: conversationId,
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
    conv.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const nextGroup = () => {
    setCurrentGroupIndex((prev) => (prev + 1) % courseGroups.length);
  };

  const prevGroup = () => {
    setCurrentGroupIndex((prev) => (prev - 1 + courseGroups.length) % courseGroups.length);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-green-50 via-white to-green-100">
        <StudentSidebar />

        <div className="flex-1 flex flex-col p-6 gap-6">
          {/* Course Group Chat Widgets */}
          {courseGroups.length > 0 && (
            <div className="relative">
              <Card className="bg-gradient-to-r from-[#006d2c] to-[#008d3c] text-white border-0 shadow-2xl rounded-3xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5" />
                        <h3 className="font-bold text-lg">Course Group Chat</h3>
                      </div>
                      <p className="text-2xl font-bold mb-1">{courseGroups[currentGroupIndex]?.course_name}</p>
                      <p className="text-sm text-white/80 mb-4">
                        Connect and chat with students taking the same course
                      </p>
                      <Button
                        className="bg-white text-[#006d2c] hover:bg-gray-100 font-semibold"
                        onClick={() => {
                          const link = courseGroups[currentGroupIndex]?.whatsapp_link;
                          if (link) {
                            window.open(link, '_blank');
                          } else {
                            toast.error("No WhatsApp group link available for this course");
                          }
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Join Group Chat
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

              {courseGroups.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white shadow-lg"
                    onClick={prevGroup}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow-lg"
                    onClick={nextGroup}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Three-Column Chat Layout */}
          <Card className="flex-1 flex overflow-hidden shadow-2xl rounded-3xl">
            {/* Left Sidebar - Conversations List */}
            <div className="w-80 flex flex-col bg-[#006d2c]">
              <div className="p-4 border-b border-white/10">
                <h2 className="font-bold text-lg mb-3 flex items-center gap-2 text-white">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                  {conversations.length > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-white text-[#006d2c]">
                      {conversations.reduce((sum, conv) => sum + conv.unread_count, 0)} new
                    </Badge>
                  )}
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                  <Input
                    placeholder="Search"
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
                    <p className="text-sm">No conversations yet</p>
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
                            {conv.teacher_avatar ? (
                              <img src={conv.teacher_avatar} alt={conv.teacher_name} className="object-cover" />
                            ) : (
                              <AvatarFallback className="bg-white text-[#006d2c]">
                                {conv.teacher_name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#006d2c]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold truncate text-white">{conv.teacher_name}</h3>
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
                      {selectedConversation.teacher_avatar ? (
                        <img src={selectedConversation.teacher_avatar} alt={selectedConversation.teacher_name} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-[#006d2c] text-white">
                          {selectedConversation.teacher_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedConversation.teacher_name}</h3>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Online
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
                  <p>Choose a teacher from the list to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </SidebarProvider>
  );
}
