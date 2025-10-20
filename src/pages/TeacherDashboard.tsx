import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Bell, Plus, Users, BookOpen, ClipboardList, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [courses, setCourses] = useState<any[]>([]);

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

        if (profile.role !== "teacher") {
          console.log('User is not a teacher, redirecting to student dashboard');
          navigate("/student/dashboard");
          return;
        }

        // Fetch teacher's courses
        fetchCourses();
      }
    }
  }, [user, profile, loading, navigate]);

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
      // Add enrollment count to each course
      const coursesWithCount = data?.map(course => ({
        ...course,
        enrolled_count: course.course_enrollments?.[0]?.count || 0
      })) || [];
      setCourses(coursesWithCount);
    }
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
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">+2 from last month</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">487</div>
                    <p className="text-xs text-muted-foreground">+23 from last month</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                    <ClipboardList className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">18</div>
                    <p className="text-xs text-muted-foreground">Assignments to grade</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">87%</div>
                    <p className="text-xs text-muted-foreground">+5% from last month</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  {/* Create Course Button */}
                  <Card className="bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-background border-purple-500/20 hover:border-purple-500/40 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1 text-purple-900">Ready to create a new course?</h3>
                          <p className="text-sm text-muted-foreground mb-3">Share your knowledge with students worldwide</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs">
                              📹 Video Lessons
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              📝 Quizzes
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              📊 Progress Tracking
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              🏆 Capstone Projects
                            </Badge>
                          </div>
                        </div>
                        <Button size="lg" className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={() => navigate("/create-course")}>
                          <Plus className="h-4 w-4" />
                          Create Course
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* My Courses */}
                  <Card>
                    <CardHeader>
                      <CardTitle>My Active Courses</CardTitle>
                      <CardDescription>Courses you're currently teaching</CardDescription>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          {courses.map((course) => (
                            <div
                              key={course.id}
                              className="group cursor-pointer"
                              onClick={() => navigate(`/course/${course.id}`)}
                            >
                              <div className="relative overflow-hidden rounded-xl bg-white border-2 border-gray-200 hover:border-[#006d2c] transition-all duration-300 hover:shadow-xl">
                                <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                                  {course.thumbnail_url ? (
                                    <img
                                      src={course.thumbnail_url}
                                      alt={course.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#006d2c] to-[#004d20]">
                                      <BookOpen className="h-20 w-20 text-white/30" />
                                    </div>
                                  )}
                                  <div className="absolute top-3 right-3">
                                    <Badge className="bg-[#006d2c] text-white hover:bg-[#005523]">
                                      {course.level || 'Beginner'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="p-5">
                                  <h4 className="font-bold text-black mb-3 line-clamp-2 text-lg">{course.title}</h4>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Users className="h-4 w-4" />
                                      <span>{course.enrolled_count || 0} students</span>
                                    </div>
                                    {course.price && (
                                      <span className="text-[#006d2c] font-bold">${course.price}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
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
