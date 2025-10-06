import { BookOpen, Calendar, MessageSquare, Video, GraduationCap, BookMarked, Settings, CreditCard, Home, Plus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const generalItems = [
  { title: "Dashboard", url: "/student/dashboard", icon: Home },
  { title: "Schedule", url: "/student/schedule", icon: Calendar },
  { title: "Chat Group", url: "/student/chat", icon: MessageSquare },
  { title: "Live Class", url: "/student/live-class", icon: Video },
];

type Course = {
  id: string;
  title: string;
  thumbnail_url: string | null;
};

const otherItems = [
  { title: "Setting", url: "/student/settings", icon: Settings },
  { title: "Subscription", url: "/student/subscription", icon: CreditCard },
];

export function StudentSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { toast } = useToast();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [allCoursesOpen, setAllCoursesOpen] = useState(true);
  const [myCoursesOpen, setMyCoursesOpen] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch all courses
    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select("id, title, thumbnail_url")
      .order("created_at", { ascending: false });

    if (coursesError) {
      console.error("Error fetching courses:", coursesError);
      return;
    }

    // Fetch enrolled courses
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from("course_enrollments")
      .select("course_id, courses(id, title, thumbnail_url)")
      .eq("student_id", user.id);

    if (enrollmentsError) {
      console.error("Error fetching enrollments:", enrollmentsError);
      return;
    }

    const enrolledIds = new Set(enrollmentsData?.map(e => e.course_id) || []);
    const enrolledCourses = enrollmentsData?.map(e => e.courses).filter(Boolean) as Course[];

    setAllCourses(coursesData || []);
    setMyCourses(enrolledCourses || []);
    setEnrolledCourseIds(enrolledIds);
  };

  const handleEnroll = async (courseId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to enroll",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("course_enrollments")
      .insert({
        student_id: user.id,
        course_id: courseId,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Successfully enrolled in course",
    });

    // Refresh courses
    fetchCourses();
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="pt-6">
        <div className={`px-6 mb-8 flex items-center gap-2 ${collapsed ? "justify-center px-2" : ""}`}>
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          {!collapsed && <span className="text-xl font-bold">Rwanda.</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>GENERAL</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted/50"
                        }`
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

        {!collapsed && (
          <>
            <SidebarGroup>
              <Collapsible open={allCoursesOpen} onOpenChange={setAllCoursesOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/50 rounded-lg">
                  <span>ALL COURSES</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${allCoursesOpen ? "" : "-rotate-90"}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {allCourses.map((course) => (
                        <SidebarMenuItem key={course.id}>
                          <div className="flex items-center justify-between gap-2 px-3 py-2">
                            <NavLink
                              to={`/course/${course.id}`}
                              className="flex items-center gap-2 flex-1 text-sm text-muted-foreground hover:text-primary transition-colors truncate"
                            >
                              <BookOpen className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{course.title}</span>
                            </NavLink>
                            {!enrolledCourseIds.has(course.id) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleEnroll(course.id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>

            <SidebarGroup>
              <Collapsible open={myCoursesOpen} onOpenChange={setMyCoursesOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/50 rounded-lg">
                  <span>MY COURSES</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${myCoursesOpen ? "" : "-rotate-90"}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {myCourses.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          No enrolled courses
                        </div>
                      ) : (
                        myCourses.map((course) => (
                          <SidebarMenuItem key={course.id}>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={`/course/${course.id}`}
                                className={({ isActive }) =>
                                  `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                                    isActive
                                      ? "bg-primary/10 text-primary font-medium"
                                      : "text-muted-foreground hover:bg-muted/50"
                                  }`
                                }
                              >
                                <BookMarked className="h-4 w-4" />
                                <span className="truncate">{course.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          </>
        )}

        {collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="sr-only">COURSES</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/student/all-courses" className="flex items-center justify-center">
                      <BookOpen className="h-5 w-5" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/student/my-courses" className="flex items-center justify-center">
                      <BookMarked className="h-5 w-5" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>OTHER</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted/50"
                        }`
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

        {!collapsed && (
          <div className="mt-auto px-4 pb-6">
            <Card className="bg-primary text-primary-foreground border-0">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-2">24/7 Support</h3>
                <p className="text-sm mb-4 opacity-90">for Student Success</p>
                <div className="flex gap-1 justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-accent">★</span>
                  ))}
                </div>
                <Button variant="secondary" size="sm" className="w-full">
                  Get Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
