import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Users, MoreVertical, Edit2, Trash2, Smile } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChatGroup {
  id: string;
  group_name: string;
  description: string | null;
  whatsapp_link: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  message_text: string;
  sender_id: string;
  group_chat_id: string;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  is_resolved: boolean;
  reply_to_id: string | null;
  is_edited: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    role: string;
  };
}

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  profile?: {
    full_name: string;
    email: string;
    role: string;
  };
}

interface ConversationPreview extends ChatGroup {
  lastMessage?: string;
  lastMessageTime?: string;
  member_count?: number;
}

export default function StudentChat() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && profile?.role === "student") {
      fetchGroups();
    }
  }, [user, profile]);

  useEffect(() => {
    if (selectedGroup) {
      fetchMessages();
      fetchMembers();
      scrollToBottom();
    }
  }, [selectedGroup]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchGroups = async () => {
    // Get groups where user is a member
    const { data: memberData, error: memberError } = await supabase
      .from("group_members")
      .select("group_chat_id")
      .eq("user_id", user?.id);

    if (memberError) {
      console.error("Error fetching member groups:", memberError);
      return;
    }

    const groupIds = memberData?.map((m) => m.group_chat_id) || [];

    if (groupIds.length === 0) {
      setConversations([]);
      return;
    }

    const { data, error } = await supabase
      .from("group_chats")
      .select("*")
      .in("id", groupIds)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching groups:", error);
      return;
    }

    const groupsData = data || [];

    // Fetch last message and member count for each group
    const conversationsWithPreviews = await Promise.all(
      groupsData.map(async (group) => {
        const { data: lastMsg } = await supabase
          .from("chat_messages")
          .select("message_text, created_at")
          .eq("group_chat_id", group.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const { count } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_chat_id", group.id);

        return {
          ...group,
          lastMessage: lastMsg?.message_text || "No messages yet",
          lastMessageTime: lastMsg?.created_at || group.created_at,
          member_count: count || 0,
        };
      })
    );

    setConversations(conversationsWithPreviews);
    if (conversationsWithPreviews.length > 0 && !selectedGroup) {
      setSelectedGroup(conversationsWithPreviews[0]);
    }
  };

  const fetchMessages = async () => {
    if (!selectedGroup) return;

    const { data, error } = await supabase
      .from("chat_messages")
      .select(`
        *,
        sender:profiles!chat_messages_sender_id_fkey(full_name, role)
      `)
      .eq("group_chat_id", selectedGroup.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
  };

  const fetchMembers = async () => {
    if (!selectedGroup) return;

    const { data, error } = await supabase
      .from("group_members")
      .select(`
        *,
        profile:profiles!group_members_user_id_fkey(full_name, email, role)
      `)
      .eq("group_chat_id", selectedGroup.id);

    if (error) {
      console.error("Error fetching members:", error);
    } else {
      setMembers(data || []);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return;

    if (editingMessage) {
      // Update existing message
      const { error } = await supabase
        .from("chat_messages")
        .update({
          message_text: newMessage,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", editingMessage);

      if (error) {
        toast.error("Failed to update message");
        console.error(error);
      } else {
        setNewMessage("");
        setEditingMessage(null);
        fetchMessages();
      }
    } else {
      // Send new message
      const { error } = await supabase
        .from("chat_messages")
        .insert({
          group_chat_id: selectedGroup.id,
          sender_id: user?.id,
          message_text: newMessage,
          reply_to_id: replyingTo?.id || null,
        });

      if (error) {
        toast.error("Failed to send message");
        console.error(error);
      } else {
        setNewMessage("");
        setReplyingTo(null);
        fetchMessages();
        fetchGroups();
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      toast.error("Failed to delete message");
      console.error(error);
    } else {
      toast.success("Message deleted");
      fetchMessages();
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message.id);
    setNewMessage(message.message_text);
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
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
            <h1 className="text-2xl font-bold text-black">My Chat Groups</h1>
          </div>
        </header>

        {/* Chat Interface */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Conversation List */}
          <div className="w-80 bg-white border-r flex flex-col">
            <div className="p-4 border-b bg-[#006d2c]">
              <h2 className="font-semibold text-white">Groups</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>You're not in any groups yet.</p>
                  <p className="text-sm mt-2">Ask your teacher to add you to a group.</p>
                </div>
              ) : (
                conversations.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b ${
                      selectedGroup?.id === group.id ? "bg-gray-100" : ""
                    }`}
                  >
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarFallback className="bg-[#006d2c] text-white">
                        {group.group_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">{group.group_name}</h3>
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(group.lastMessageTime || group.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mb-1">{group.lastMessage}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {group.member_count} members
                        </Badge>
                        {group.whatsapp_link && (
                          <Badge variant="outline" className="text-xs">
                            WhatsApp
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
          {selectedGroup ? (
            <div className="flex-1 flex flex-col bg-gray-50">
              {/* Chat Header */}
              <div className="bg-white border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-[#006d2c] text-white">
                      {selectedGroup.group_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedGroup.group_name}</h3>
                    {selectedGroup.description && (
                      <p className="text-sm text-gray-500">{selectedGroup.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMembersDialog(true)}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Members
                  </Button>
                  {selectedGroup.whatsapp_link && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedGroup.whatsapp_link!, "_blank")}
                      className="text-[#006d2c] border-[#006d2c]"
                    >
                      Open WhatsApp
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.sender_id === user?.id;
                  const senderName = message.sender?.full_name || "Unknown";
                  const senderRole = message.sender?.role || "";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-md ${isOwnMessage ? "order-2" : "order-1"}`}>
                        {message.reply_to_id && (
                          <div className="text-xs text-gray-500 mb-1 ml-4 italic">
                            Replying to a message
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 relative group ${
                            isOwnMessage
                              ? "bg-[#006d2c] text-white"
                              : message.message_type === "announcement"
                              ? "bg-yellow-50 text-gray-900 border border-yellow-200"
                              : "bg-white text-gray-900 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold">
                              {senderName}
                              {senderRole === "teacher" && " (Teacher)"}
                            </span>
                            {message.is_resolved && (
                              <Badge variant="secondary" className="text-xs">
                                Resolved
                              </Badge>
                            )}
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

                          {/* Message Actions */}
                          <div className="absolute -top-2 right-2 hidden group-hover:flex items-center gap-1 bg-white shadow-lg rounded-lg p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleReplyToMessage(message)}
                            >
                              <span className="text-xs">↩️</span>
                            </Button>
                            {isOwnMessage && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleEditMessage(message)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-600"
                                  onClick={() => handleDeleteMessage(message.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
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
                {replyingTo && (
                  <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-gray-600">Replying to: </span>
                      <span className="font-medium">
                        {replyingTo.message_text.substring(0, 50)}...
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                      ✕
                    </Button>
                  </div>
                )}
                {editingMessage && (
                  <div className="mb-2 p-2 bg-blue-100 rounded-lg flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-blue-600">Editing message</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingMessage(null);
                        setNewMessage("");
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                )}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No group selected</h3>
                <p className="text-gray-600">Select a group to start chatting</p>
              </div>
            </div>
          )}
        </div>

        {/* Members Dialog */}
        <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Group Members</DialogTitle>
              <DialogDescription>
                {members.length} member{members.length !== 1 ? "s" : ""} in this group
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-[#006d2c] text-white">
                        {member.profile?.full_name?.substring(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {member.profile?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">{member.profile?.email}</p>
                    </div>
                  </div>
                  <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
