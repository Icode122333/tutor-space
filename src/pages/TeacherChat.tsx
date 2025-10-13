import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Plus, Check, CheckCheck, Paperclip, Smile, MoreVertical, Archive, Users, Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface ChatGroup {
  id: string;
  group_name: string;
  description: string | null;
  whatsapp_link: string | null;
  is_archived: boolean;
  created_at: string;
  teacher_id: string;
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
  resolved_by: string | null;
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
  joined_at: string;
  profile?: {
    full_name: string;
    email: string;
    role: string;
  };
}

interface ConversationPreview extends ChatGroup {
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  member_count?: number;
}

export default function TeacherChat() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupWhatsApp, setNewGroupWhatsApp] = useState("");
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && profile?.role === "teacher") {
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
    const { data, error } = await supabase
      .from("group_chats")
      .select("*")
      .eq("teacher_id", user?.id)
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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    const { error } = await supabase
      .from("group_chats")
      .insert({
        group_name: newGroupName,
        description: newGroupDescription || null,
        whatsapp_link: newGroupWhatsApp || null,
        teacher_id: user?.id,
      });

    if (error) {
      toast.error("Failed to create group");
      console.error(error);
    } else {
      toast.success("Group created successfully!");
      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupWhatsApp("");
      setShowCreateDialog(false);
      fetchGroups();
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup || !newGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    const { error } = await supabase
      .from("group_chats")
      .update({
        group_name: newGroupName,
        description: newGroupDescription || null,
        whatsapp_link: newGroupWhatsApp || null,
      })
      .eq("id", selectedGroup.id);

    if (error) {
      toast.error("Failed to update group");
      console.error(error);
    } else {
      toast.success("Group updated successfully!");
      setShowEditDialog(false);
      fetchGroups();
    }
  };

  const handleArchiveGroup = async () => {
    if (!selectedGroup) return;

    const { error } = await supabase
      .from("group_chats")
      .update({ is_archived: true })
      .eq("id", selectedGroup.id);

    if (error) {
      toast.error("Failed to archive group");
      console.error(error);
    } else {
      toast.success("Group archived successfully!");
      setSelectedGroup(null);
      fetchGroups();
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

  const handleMarkResolved = async (messageId: string) => {
    const { error } = await supabase
      .from("chat_messages")
      .update({
        is_resolved: true,
        resolved_by: user?.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) {
      toast.error("Failed to mark as resolved");
      console.error(error);
    } else {
      toast.success("Marked as resolved");
      fetchMessages();
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
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
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
                <h1 className="text-2xl font-bold text-black">Chat Groups</h1>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#006d2c] hover:bg-[#005523] text-white gap-2">
                    <Plus className="h-4 w-4" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Chat Group</DialogTitle>
                    <DialogDescription>
                      Create a group chat for your students to ask questions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Group Name *</Label>
                      <Input
                        id="groupName"
                        placeholder="e.g., Web Development Q&A"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the group purpose..."
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Group Link (Optional)</Label>
                      <Input
                        id="whatsapp"
                        placeholder="https://chat.whatsapp.com/..."
                        value={newGroupWhatsApp}
                        onChange={(e) => setNewGroupWhatsApp(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateGroup} className="bg-[#006d2c] hover:bg-[#005523]">
                      Create Group
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                {conversations.map((group) => (
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
                        <span className="text-xs text-gray-500">{getTimeAgo(group.lastMessageTime || group.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mb-1">{group.lastMessage}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {group.member_count} members
                        </Badge>
                        {group.whatsapp_link && (
                          <Badge variant="outline" className="text-xs">WhatsApp</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
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
                      <p className="text-sm text-gray-500">{messages.length} messages</p>
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
                        onClick={() => window.open(selectedGroup.whatsapp_link!, '_blank')}
                        className="text-[#006d2c] border-[#006d2c]"
                      >
                        Open WhatsApp
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setNewGroupName(selectedGroup.group_name);
                          setNewGroupDescription(selectedGroup.description || "");
                          setNewGroupWhatsApp(selectedGroup.whatsapp_link || "");
                          setShowEditDialog(true);
                        }}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Group
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleArchiveGroup} className="text-red-600">
                          <Archive className="h-4 w-4 mr-2" />
                          Archive Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                                <Check className="h-3 w-3 text-green-600" />
                              )}
                              {message.is_edited && (
                                <span className="text-xs opacity-70">(edited)</span>
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                            {message.file_url && (
                              <div className="mt-2 p-2 bg-black/10 rounded flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                <a
                                  href={message.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline"
                                >
                                  {message.file_name || "Download file"}
                                </a>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs ${isOwnMessage ? "text-white/70" : "text-gray-500"}`}>
                                {getTimeAgo(message.created_at)}
                              </span>
                              <div className="flex items-center gap-2">
                                {!isOwnMessage && !message.is_resolved && (
                                  <button
                                    onClick={() => handleMarkResolved(message.id)}
                                    className={`text-xs hover:underline ${isOwnMessage ? "text-white/90" : "text-[#006d2c]"}`}
                                  >
                                    Resolve
                                  </button>
                                )}
                              </div>
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
                        <span className="font-medium">{replyingTo.message_text.substring(0, 50)}...</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                      >
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
                  <p className="text-gray-600">Select a group or create a new one to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Members Dialog */}
        <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Group Members</DialogTitle>
              <DialogDescription>
                {members.length} member{members.length !== 1 ? 's' : ''} in this group
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-[#006d2c] text-white">
                        {member.profile?.full_name?.substring(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{member.profile?.full_name || "Unknown"}</p>
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

        {/* Edit Group Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>
                Update group information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editGroupName">Group Name *</Label>
                <Input
                  id="editGroupName"
                  placeholder="e.g., Web Development Q&A"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  placeholder="Brief description of the group purpose..."
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editWhatsapp">WhatsApp Group Link (Optional)</Label>
                <Input
                  id="editWhatsapp"
                  placeholder="https://chat.whatsapp.com/..."
                  value={newGroupWhatsApp}
                  onChange={(e) => setNewGroupWhatsApp(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateGroup} className="bg-[#006d2c] hover:bg-[#005523]">
                Update Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
}
