import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Announcement {
  id: string;
  title: string;
  message: string;
  target_audience: string;
  created_at: string;
  is_read?: boolean;
}

export function NotificationBell() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchAnnouncements(user.id);
      }
    };
    init();

    // Subscribe to new announcements
    const channel = supabase.channel("announcements").on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
      if (userId) fetchAnnouncements(userId);
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const fetchAnnouncements = async (uid: string) => {
    try {
      // Get user role
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", uid).single();
      const role = profile?.role;

      // Fetch announcements for this user's role
      const { data: announcementsData, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .or(`target_audience.eq.all,target_audience.eq.${role === "student" ? "students" : role === "teacher" ? "teachers" : "all"}`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get read status
      const { data: reads } = await supabase.from("announcement_reads").select("announcement_id").eq("user_id", uid);
      const readIds = new Set(reads?.map(r => r.announcement_id) || []);

      const withReadStatus = (announcementsData || []).map(a => ({ ...a, is_read: readIds.has(a.id) }));
      setAnnouncements(withReadStatus);
      setUnreadCount(withReadStatus.filter(a => !a.is_read).length);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const markAsRead = async (announcementId: string) => {
    if (!userId) return;
    try {
      await supabase.from("announcement_reads").upsert({ announcement_id: announcementId, user_id: userId }, { onConflict: "announcement_id,user_id" });
      setAnnouncements(prev => prev.map(a => a.id === announcementId ? { ...a, is_read: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      const unread = announcements.filter(a => !a.is_read);
      await Promise.all(unread.map(a => supabase.from("announcement_reads").upsert({ announcement_id: a.id, user_id: userId }, { onConflict: "announcement_id,user_id" })));
      setAnnouncements(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">{unreadCount > 9 ? "9+" : unreadCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7"><Check className="h-3 w-3 mr-1" />Mark all read</Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {announcements.length === 0 ? (
            <div className="p-6 text-center text-gray-500"><Bell className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No notifications</p></div>
          ) : (
            <div className="divide-y">
              {announcements.map(a => (
                <div key={a.id} className={`p-3 hover:bg-gray-50 cursor-pointer ${!a.is_read ? "bg-blue-50/50" : ""}`} onClick={() => !a.is_read && markAsRead(a.id)}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${!a.is_read ? "text-blue-900" : "text-gray-900"}`}>{a.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{a.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(a.created_at)}</p>
                    </div>
                    {!a.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
