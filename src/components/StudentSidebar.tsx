import { BookOpen, Calendar, MessageSquare, Award, GraduationCap, BookMarked, Settings, CreditCard, Home } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const generalItems = [
  { title: "Dashboard", url: "/student/dashboard", icon: Home },
  { title: "Schedule", url: "/student/schedule", icon: Calendar },
  { title: "Chat Group", url: "/student/chat", icon: MessageSquare },
  { title: "Certificates", url: "/student/certificates", icon: Award },
];

const courseItems = [
  { title: "All Courses", url: "/courses", icon: BookOpen },
  { title: "My Courses", url: "/student/my-courses", icon: BookMarked },
];

const otherItems = [
  { title: "Setting", url: "/student/settings", icon: Settings },
  { title: "Subscription", url: "/student/subscription", icon: CreditCard },
];

export function StudentSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="m-4">
      <div className="h-full bg-[#133223] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <SidebarContent className="bg-transparent flex-1 overflow-y-auto scrollbar-hide">
          <div className="flex items-center gap-2 px-4 py-4">
            <GraduationCap className="h-7 w-7 text-[#006d2c]" />
            {!collapsed && <span className="text-lg font-bold text-white">DataPlus Learning</span>}
          </div>

          <SidebarGroup className="space-y-1">
            <SidebarGroupContent className="px-2">
              <SidebarMenu className="space-y-1">
                {generalItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          isActive
                            ? "bg-[#006d2c] text-white font-medium rounded-xl px-3 py-2.5 flex items-center gap-3"
                            : "text-gray-300 hover:bg-white/10 hover:text-white rounded-xl px-3 py-2.5 flex items-center gap-3"
                        }
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-4 space-y-1">
            <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              COURSES
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <SidebarMenu className="space-y-1">
                {courseItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          isActive
                            ? "bg-[#006d2c] text-white font-medium rounded-xl px-3 py-2.5 flex items-center gap-3"
                            : "text-gray-300 hover:bg-white/10 hover:text-white rounded-xl px-3 py-2.5 flex items-center gap-3"
                        }
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-4 space-y-1">
            <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              OTHER
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <SidebarMenu className="space-y-1">
                {otherItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          isActive
                            ? "bg-[#006d2c] text-white font-medium rounded-xl px-3 py-2.5 flex items-center gap-3"
                            : "text-gray-300 hover:bg-white/10 hover:text-white rounded-xl px-3 py-2.5 flex items-center gap-3"
                        }
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {!collapsed && (
            <div className="mt-auto px-4 pb-6">
              <Card className="bg-[#006d2c] text-white border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2">24/7 Support</h3>
                  <p className="text-sm mb-4 opacity-90">for Student Success</p>
                  <div className="flex gap-1 justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <Button variant="secondary" size="sm" className="w-full bg-white text-[#006d2c] hover:bg-gray-100">
                    Get Premium
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
