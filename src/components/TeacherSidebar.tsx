import { Home, Calendar, MessageSquare, Video, BookOpen, FolderOpen, Settings, CreditCard, GraduationCap, Users, FileText, Award } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/teacher/dashboard", icon: Home },
  { title: "My Courses", url: "/teacher/courses", icon: BookOpen },
  { title: "Students", url: "/teacher/students", icon: Users },
  { title: "Assignments", url: "/teacher/assignments", icon: FileText },
  { title: "Grades", url: "/teacher/grades", icon: Award },
  { title: "Schedule", url: "/teacher/schedule", icon: Calendar },
  { title: "Chat Group", url: "/teacher/chat", icon: MessageSquare },
  { title: "Live Class", url: "/teacher/live", icon: Video },
  { title: "All Courses", url: "/teacher/all-courses", icon: FolderOpen },
  { title: "Settings", url: "/teacher/settings", icon: Settings },
  { title: "Subscription", url: "/teacher/subscription", icon: CreditCard },
];

export function TeacherSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-2 px-4 py-6">
            <GraduationCap className="h-8 w-8 text-primary" />
            {!collapsed && <span className="text-xl font-bold">DataPlus Learning</span>}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-accent/50"
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="p-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Premium Support</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Get dedicated support for your teaching needs
              </p>
              <Button size="sm" className="w-full">
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
