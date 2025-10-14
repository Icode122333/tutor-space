import { BookOpen, Calendar, MessageSquare, Award, GraduationCap, BookMarked, Settings, CreditCard, Home, Plus } from "lucide-react";
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
  { title: "Certificates", url: "/student/certificates", icon: Award },
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

          {!collapsed && (
            <>
              <SidebarGroup className="mt-4 space-y-1">
                <Collapsible open={allCoursesOpen} onOpenChange={setAllCoursesOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-white/5 rounded-lg">
                    <span>ALL COURSES</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${allCoursesOpen ? "" : "-rotate-90"}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent className="px-2">
                      <SidebarMenu className="space-y-1">
                        {allCourses.map((course) => (
                          <SidebarMenuItem key={course.id}>
                            <div className="flex items-center justify-between gap-2 px-3 py-2">
                              <NavLink
                                to={`/course/${course.id}`}
                                className="flex items-center gap-2 flex-1 text-sm text-gray-300 hover:text-white transition-colors truncate"
                              >
                                <BookOpen className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{course.title}</span>
                              </NavLink>
                              {!enrolledCourseIds.has(course.id) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-white/10"
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

              <SidebarGroup className="mt-4 space-y-1">
                <Collapsible open={myCoursesOpen} onOpenChange={setMyCoursesOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-white/5 rounded-lg">
                    <span>MY COURSES</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${myCoursesOpen ? "" : "-rotate-90"}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent className="px-2">
                      {myCourses.length > 0 ? (
                        <SidebarMenu className="space-y-1">
                          {myCourses.map((course) => (
                            <SidebarMenuItem key={course.id}>
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={`/course/${course.id}`}
                                  className={({ isActive }) =>
                                    isActive
                                      ? "bg-[#006d2c] text-white font-medium rounded-xl px-3 py-2 flex items-center gap-3"
                                      : "text-gray-300 hover:bg-white/10 hover:text-white rounded-xl px-3 py-2 flex items-center gap-3"
                                  }
                                >
                                  <BookMarked className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate text-sm">{course.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      ) : (
                        <div className="px-3 py-4 text-center">
                          <BookOpen className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">No courses yet</p>
                          <p className="text-xs text-gray-500 mt-1">Enroll in a course</p>
                        </div>
                      )}
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
