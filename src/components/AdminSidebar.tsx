import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  Flag,
  BarChart3,
  Settings,
  FileText,
  Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminSidebarProps {
  pendingTeachers?: number;
  pendingCourses?: number;
  flaggedContent?: number;
}

export function AdminSidebar({ 
  pendingTeachers = 0, 
  pendingCourses = 0,
  flaggedContent = 0 
}: AdminSidebarProps) {
  const location = useLocation();

  const menuItems = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          url: "/admin/dashboard",
        },
      ],
    },
    {
      title: "User Management",
      items: [
        {
          title: "All Users",
          icon: Users,
          url: "/admin/users",
        },
        {
          title: "Teacher Approvals",
          icon: UserCheck,
          url: "/admin/teacher-approvals",
          badge: pendingTeachers,
        },
        {
          title: "Students",
          icon: GraduationCap,
          url: "/admin/students",
        },
      ],
    },
    {
      title: "Content",
      items: [
        {
          title: "Courses",
          icon: BookOpen,
          url: "/admin/courses",
          badge: pendingCourses,
        },
        {
          title: "Moderation",
          icon: Flag,
          url: "/admin/moderation",
          badge: flaggedContent,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          title: "Analytics",
          icon: BarChart3,
          url: "/admin/analytics",
        },
        {
          title: "Activity Logs",
          icon: FileText,
          url: "/admin/logs",
        },
        {
          title: "Settings",
          icon: Settings,
          url: "/admin/settings",
        },
      ],
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">DataPlus Learning</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          {item.badge && item.badge > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
