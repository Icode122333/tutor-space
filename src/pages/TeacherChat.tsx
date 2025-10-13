import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare, ArrowLeft, ExternalLink } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Conversation {
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
  is_edited: boolean;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  whatsapp_link: string | null;
}

export default function TeacherChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchCourses();
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

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from("conversations_with_details")
      .select("*")
      .eq("teacher_id", user?.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
    } else {
      setConversations(data || []);
    }
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, whatsapp_link")
      .eq("teacher_id", user?.id);

    if (error) {
      console.error("Error fetching courses:", error);
    } else {
      setCourses(data || []);
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
      console.error(error);
    } else {
      setNewMessage("");
      fetchMessages();
      fetchConversations();
    }
  };

  const handleUpdateWhatsAppLink = async () => {
    if (!selectedCourse) {
      toast.error("Please select a course");
      return;
    }

    const { error } = await supabase
      .from("courses")
      .update({ whatsapp_link: whatsappLink || null })
      .eq("id", selectedCourse);

    if (error) {
      toast.error("Failed to update WhatsApp link");
      console.error(error);
    } else {
      toast.success("WhatsApp link updated!");
      setShowWhatsAppDialog(false);
      setWhatsappLink("");
      setSelectedCourse("");
      fetchCourses();
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <TeacherSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-black">Student Messages</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage conversations with your students
                  </p>
                </div>
              </div>
              <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Manage WhatsApp Links
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Manage WhatsApp Group Links</DialogTitle>
                    <DialogDescription>
                      Add or update WhatsApp group links for your courses
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="course">Select Course *</Label>
                      <select
                        id="course"
                        value={selectedCourse}
                        onChange={(e) => {
                          setSelectedCourse(e.target.value);
                          const course = courses.find((c) => c.id === e.target.value);
                          setWhatsappLink(course?.whatsapp_link || "");
                        }}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Choose a course...</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Group Link</Label>
                      <Input
                        id="whatsapp"
                        placeholder="https://chat.whatsapp.com/..."
                        value={whatsappLink}
                        onChange={(e) => setWhatsappLink(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Leave empty to remove the link
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowWhatsAppDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateWhatsAppLink}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Update Link
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
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Students will appear here when they message you</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b ${
                        selectedConversation?.id === conversation.id ? "bg-gray-100" : ""
                      }`}
                    >
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarFallback className="bg-[#006d2c] text-white">
                          {conversation.student_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm truncate">
                            {conversation.student_name}
                          </h3>
                          {conversation.last_message_at && (
                            <span className="text-xs text-gray-500">
                              {getTimeAgo(conversation.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {conversation.last_message || "No messages yet"}
                        </p>
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="mt-1">
                            {conversation.unread_count} new
                          </Badge>
                        )}
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
                <div className="bg-white border-b p-4 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-[#006d2c] text-white">
                      {selectedConversation.student_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.student_name}</h3>
                    <p className="text-sm text-gray-500">Student</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No messages yet</p>
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
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No conversation selected
                  </h3>
                  <p className="text-gray-600">
                    Select a student from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
