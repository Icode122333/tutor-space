import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Bell, Plus, Users, BookOpen, ClipboardList, TrendingUp, Calendar as CalendarIcon, Edit, Trash2, MoreVertical, Layers, PlayCircle } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [courses, setCourses] = useState<any[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('No user found, redirecting to auth');
        navigate("/auth");
        return;
      }

      if (profile) {
        // Check if onboarding is completed
        if (!profile.onboarding_completed) {
          console.log('Onboarding not completed, redirecting to teacher onboarding');
          toast.info("Please complete your profile setup");
          navigate("/teacher/onboarding");
          return;
        }

        // Check if teacher is approved
        if (profile.role === "teacher" && !profile.teacher_approved) {
          console.log('Teacher not approved yet, redirecting to pending approval');
          navigate("/teacher/pending-approval");
          return;
        }

        if (profile.role !== "teacher") {
          console.log('User is not a teacher, redirecting to student dashboard');
          navigate("/student/dashboard");
          return;
        }

        // Fetch teacher's courses
        fetchCourses();
        fetchScheduledClasses();
      }
    }
  }, [user, profile, loading, navigate]);

  const fetchScheduledClasses = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("scheduled_classes")
      .select(`
        *,
        courses (
          id,
          title,
          teacher_id
        )
      `)
      .gte("scheduled_time", new Date().toISOString())
      .order("scheduled_time", { ascending: true });

    if (error) {
      console.error("Error fetching scheduled classes:", error);
    } else {
      // Filter to only show classes for teacher's courses
      const teacherClasses = data?.filter(sc => sc.courses?.teacher_id === user.id) || [];
      setScheduledClasses(teacherClasses);
    }
  };

  const fetchCourses = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("courses")
      .select(`
        *,
        course_enrollments(count)
      `)
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching courses:", error);
    } else {
      // Add enrollment count and fetch chapter/lesson counts
      const coursesWithDetails = await Promise.all(
        (data || []).map(async (course) => {
          // Get chapter count
          const { count: chapterCount } = await supabase
            .from("course_chapters")
            .select("*", { count: 'exact', head: true })
            .eq("course_id", course.id);

          // Get lesson count
          const { data: chapters } = await supabase
            .from("course_chapters")
            .select("id")
            .eq("course_id", course.id);

          let lessonCount = 0;
          if (chapters) {
            for (const chapter of chapters) {
              const { count } = await supabase
                .from("course_lessons")
                .select("*", { count: 'exact', head: true })
                .eq("chapter_id", chapter.id);
              lessonCount += count || 0;
            }
          }

          return {
            ...course,
            enrolled_count: course.course_enrollments?.[0]?.count || 0,
            chapter_count: chapterCount || 0,
            lesson_count: lessonCount,
          };
        })
      );
      setCourses(coursesWithDetails);
    }
  };

  const handleDeleteCourse = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (error) {
      toast.error("Failed to delete course");
      console.error("Error deleting course:", error);
    } else {
      toast.success("Course deleted successfully");
      fetchCourses();
    }
  };

  const handleEditCourse = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/create-course?edit=${courseId}`);
  };



  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <TeacherSidebar />

        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <header className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 mb-4">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold">Welcome Back, {profile?.full_name || 'Teacher'}!</h1>
                  <p className="text-sm text-muted-foreground">Here's what's happening with your courses today</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search courses..."
                    className="pl-10 pr-4 py-2 rounded-lg border bg-background w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">5</span>
                </Button>
                <Avatar>
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>{profile?.full_name?.substring(0, 2).toUpperCase() || 'TC'}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-2">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                    <BookOpen className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{courses.length}</div>
                    <p className="text-xs text-muted-foreground">Active courses</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0)}</div>
                    <p className="text-xs text-muted-foreground">Enrolled students</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
                    <PlayCircle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{courses.reduce((sum, c) => sum + (c.lesson_count || 0), 0)}</div>
                    <p className="text-xs text-muted-foreground">Across all courses</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
                    <Layers className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{courses.reduce((sum, c) => sum + (c.chapter_count || 0), 0)}</div>
                    <p className="text-xs text-muted-foreground">Across all courses</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  {/* Create Course Button */}
                  <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">Ready to create a new course?</h3>
                          <p className="text-sm text-muted-foreground">Share your knowledge with students worldwide</p>
                        </div>
                        <Button size="lg" className="gap-2" onClick={() => navigate("/create-course")}>
                          <Plus className="h-4 w-4" />
                          Create Course
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* My Courses - Management Section */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>My Courses</CardTitle>
                          <CardDescription>Manage and edit your courses</CardDescription>
                        </div>
                        {courses.length > 0 && (
                          <Badge variant="secondary" className="text-sm">
                            {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {courses.length === 0 ? (
                        <div className="text-center py-12">
                          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
                          <p className="text-gray-600 mb-6">Create your first course to get started</p>
                          <Button onClick={() => navigate("/create-course")} className="bg-[#006d2c] hover:bg-[#005523]">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Course
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {courses.map((course) => (
                            <Card
                              key={course.id}
                              className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-[#006d2c] cursor-pointer"
                              onClick={() => navigate(`/course/${course.id}`)}
                            >
                              <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                  {/* Course Thumbnail */}
                                  <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-[#006d2c] to-[#004d20]">
                                    {course.thumbnail_url ? (
                                      <img
                                        src={course.thumbnail_url}
                                        alt={course.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <BookOpen className="h-10 w-10 text-white/30" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Course Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                      <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-[#006d2c] transition-colors">
                                          {course.title}
                                        </h4>
                                        <Badge variant="outline" className="text-xs">
                                          {course.level || 'Beginner'}
                                        </Badge>
                                      </div>
                                      
                                      {/* Actions Menu */}
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={(e) => handleEditCourse(course.id, e)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Course
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/create-course?edit=${course.id}&addChapter=true`);
                                          }}>
                                            <Layers className="h-4 w-4 mr-2" />
                                            Add Chapter
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/course/${course.id}`);
                                          }}>
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            View Course
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem 
                                            onClick={(e) => handleDeleteCourse(course.id, e)}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Course
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>

                                    {/* Course Stats */}
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                      <div className="flex items-center gap-1.5">
                                        <Layers className="h-4 w-4 text-blue-500" />
                                        <span>{course.chapter_count || 0} Chapters</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <PlayCircle className="h-4 w-4 text-purple-500" />
                                        <span>{course.lesson_count || 0} Lessons</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Users className="h-4 w-4 text-green-500" />
                                        <span>{course.enrolled_count || 0} Students</span>
                                      </div>
                                      {course.price && (
                                        <div className="flex items-center gap-1.5 ml-auto">
                                          <span className="text-[#006d2c] font-bold text-lg">${course.price}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex gap-2 mt-3">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => handleEditCourse(course.id, e)}
                                        className="text-xs"
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/create-course?edit=${course.id}&addChapter=true`);
                                        }}
                                        className="text-xs"
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Content
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/course/${course.id}`);
                                        }}
                                        className="text-xs bg-[#006d2c] hover:bg-[#005523]"
                                      >
                                        View Course
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Calendar */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Calendar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                        modifiers={{
                          scheduled: scheduledClasses.map(sc => new Date(sc.scheduled_time))
                        }}
                        modifiersStyles={{
                          scheduled: {
                            backgroundColor: '#ef4444',
                            color: 'white',
                            borderRadius: '50%',
                            fontWeight: 'bold'
                          }
                        }}
                      />
                    </CardContent>
                  </Card>

                  {/* Upcoming Classes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Upcoming Classes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                          <span className="text-xs font-medium text-muted-foreground">MON</span>
                          <span className="text-lg font-bold">15</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-sm mb-1">Web Dev - React Basics</h5>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            <span>10:00 AM - 11:30 AM</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                          <span className="text-xs font-medium text-muted-foreground">TUE</span>
                          <span className="text-lg font-bold">16</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-sm mb-1">Data Science - Python</h5>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            <span>2:00 PM - 3:30 PM</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                          <span className="text-xs font-medium text-muted-foreground">WED</span>
                          <span className="text-lg font-bold">17</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-sm mb-1">ML - Neural Networks</h5>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            <span>4:00 PM - 5:30 PM</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TeacherDashboard;
