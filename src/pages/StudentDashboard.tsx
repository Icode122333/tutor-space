import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, BookOpen, CalendarDays, Clock, User, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/LoadingSpinner";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchScheduledClasses();
      fetchEnrolledCourses();
    }
  }, [profile]);

  const fetchEnrolledCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("course_enrollments")
      .select(`
        *,
        courses (
          id,
          title,
          description,
          thumbnail_url,
          teacher_id,
          profiles (
            full_name
          )
        )
      `)
      .eq("student_id", user.id);

    if (error) {
      console.error("Error fetching enrolled courses:", error);
    } else {
      setEnrolledCourses(data || []);
      // Fetch progress for each course
      if (data) {
        fetchCoursesProgress(user.id, data.map(d => d.courses.id));
      }
    }
  };

  const fetchCoursesProgress = async (studentId: string, courseIds: string[]) => {
    const progressMap: Record<string, number> = {};
    
    for (const courseId of courseIds) {
      try {
        const { data, error } = await supabase
          .rpc("calculate_course_progress", {
            p_student_id: studentId,
            p_course_id: courseId,
          });

        if (!error && data && data.length > 0) {
          progressMap[courseId] = data[0].progress_percentage || 0;
        }
      } catch (err) {
        console.error(`Error fetching progress for course ${courseId}:`, err);
      }
    }
    
    setCourseProgress(progressMap);
  };

  const fetchScheduledClasses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log("Fetching scheduled classes for user:", user.id);

    const { data, error } = await supabase
      .from("scheduled_classes")
      .select(`
        *,
        courses (
          title
        )
      `)
      .gte("scheduled_time", new Date().toISOString())
      .order("scheduled_time", { ascending: true });

    console.log("Scheduled classes query result:", { data, error });

    if (error) {
      console.error("Error fetching scheduled classes:", error);
    } else {
      // Filter to only show classes for enrolled courses
      const { data: enrollments, error: enrollError } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("student_id", user.id);

      console.log("Enrollments:", { enrollments, enrollError });

      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
      console.log("Enrolled course IDs:", enrolledCourseIds);
      
      const filteredClasses = data?.filter(c => enrolledCourseIds.includes(c.course_id)) || [];
      console.log("Filtered scheduled classes:", filteredClasses);
      
      setScheduledClasses(filteredClasses);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // Check if onboarding is completed
      if (!profileData.onboarding_completed) {
        toast.info("Please complete your profile setup");
        navigate("/onboarding");
        return;
      }

      if (profileData.role !== "student") {
        navigate("/teacher/dashboard");
        return;
      }

      setProfile(profileData);
    } catch (error: any) {
      toast.error(error.message);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background gap-4">
        <StudentSidebar />
        
        <div className="flex-1 flex flex-col py-4 pr-4">
          <header className="border bg-card px-4 sm:px-6 py-3 rounded-2xl shadow-sm mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <SidebarTrigger />
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold truncate leading-tight">
                    Hello, {profile?.full_name?.split(' ').pop() || 'Student'} 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Welcome back!</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative hidden sm:block">
                  <input
                    type="text"
                    placeholder="Search"
                    className="pl-3 pr-10 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006D2C]/20 w-48"
                  />
                  <Search className="h-4 w-4 text-[#006D2C] absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <Button variant="ghost" size="icon" className="hover:bg-[#006D2C]/10">
                  <Bell className="h-5 w-5 text-[#006D2C]" />
                </Button>
                <Avatar className="h-9 w-9 border-2 border-[#006D2C]">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="User Avatar" className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-[#006D2C] text-white">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              <div className="lg:col-span-2 space-y-6">
                {/* Cohort Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-[#006D2C] p-4 sm:p-6">
                  <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1 text-white">
                      <h2 className="text-xl sm:text-2xl font-bold mb-1 leading-tight tracking-wide">
                        If you want to go far go with team
                      </h2>
                      <p className="text-lg sm:text-xl font-semibold mb-4 tracking-wide">
                        Start with cohort
                      </p>
                      <Button 
                        onClick={() => navigate("/courses")}
                        className="bg-white text-[#006D2C] hover:bg-gray-100 font-semibold px-5 py-2 rounded-full flex items-center gap-2 text-sm"
                      >
                        Join Now
                        <div className="w-5 h-5 rounded-full bg-[#006D2C] flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Button>
                    </div>
                    <div className="flex-shrink-0">
                      <img 
                        src="/images/main widget.webp" 
                        alt="Team collaboration" 
                        className="w-40 sm:w-52 h-auto object-contain"
                      />
                    </div>
                  </div>
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                </div>

                {/* My Courses */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">My Courses</h2>
                    {enrolledCourses.length > 0 && (
                      <Badge variant="secondary" className="text-sm">
                        {enrolledCourses.length} {enrolledCourses.length === 1 ? 'Course' : 'Courses'}
                      </Badge>
                    )}
                  </div>
                  
                  {enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {enrolledCourses.map((enrollment, index) => {
                        const course = enrollment.courses;
                        const gradients = [
                          'from-blue-500 to-purple-600',
                          'from-green-500 to-teal-600',
                          'from-orange-500 to-red-600',
                          'from-pink-500 to-rose-600',
                          'from-indigo-500 to-blue-600',
                          'from-yellow-500 to-orange-600',
                        ];
                        const gradient = gradients[index % gradients.length];
                        const levels = ["Beginner", "Intermediate", "Advanced"];
                        const level = levels[index % levels.length];

                        return (
                          <Card
                            key={course.id}
                            className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-[#006d2c] cursor-pointer rounded-2xl"
                            onClick={() => navigate(`/course/${course.id}`)}
                          >
                            <CardContent className="p-4">
                              {/* Course Image */}
                              <div className={`relative h-48 bg-gradient-to-br ${gradient} overflow-hidden rounded-2xl mb-4 shadow-md`}>
                                {course.thumbnail_url ? (
                                  <img
                                    src={course.thumbnail_url}
                                    alt={course.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 rounded-2xl"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <BookOpen className="h-16 w-16 text-white/30" />
                                  </div>
                                )}
                                {/* Bookmark Icon */}
                                <div className="absolute top-3 right-3">
                                  <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                                    <svg
                                      className="w-4 h-4 text-gray-700"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              {/* Course Info */}
                              <div>
                                {/* Level and Progress */}
                                <div className="flex items-center justify-between mb-3">
                                  <span
                                    className={`text-sm font-semibold ${
                                      level === "Beginner"
                                        ? "text-green-600"
                                        : level === "Intermediate"
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {level}
                                  </span>
                                  {courseProgress[course.id] !== undefined && (
                                    <div className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                                      <TrendingUp className="h-3 w-3" />
                                      {Math.round(courseProgress[course.id])}%
                                    </div>
                                  )}
                                </div>

                                {/* Course Title */}
                                <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3rem] text-base">
                                  {course.title}
                                </h3>

                                {/* Progress Bar */}
                                {courseProgress[course.id] !== undefined && (
                                  <div className="mb-4">
                                    <Progress 
                                      value={courseProgress[course.id]} 
                                      className="h-2"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">
                                      {courseProgress[course.id] === 0 ? 'Start learning' : 
                                       courseProgress[course.id] === 100 ? 'Completed! 🎉' : 
                                       'Keep going!'}
                                    </p>
                                  </div>
                                )}

                                {/* View Button */}
                                <Button
                                  className="w-full bg-[#006D2C] hover:bg-[#005523] text-white rounded-full font-medium"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/course/${course.id}`);
                                  }}
                                >
                                  {courseProgress[course.id] === 100 ? 'Review Course' : 
                                   courseProgress[course.id] > 0 ? 'Continue Learning' : 'Start Course'}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="border-2 border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <BookOpen className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Courses Yet</h3>
                        <p className="text-sm text-gray-600 text-center mb-4">
                          You haven't enrolled in any courses yet. Start learning today!
                        </p>
                        <Button onClick={() => navigate("/courses")} className="bg-[#006d2c] hover:bg-[#005523]">
                          Browse Courses
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Right Sidebar - Calendar Widget */}
              <div className="space-y-4">
                {/* Calendar Card - One Week View */}
                <Card className="border-2">
                  <CardContent className="p-4">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newDate = new Date(currentMonth);
                          newDate.setDate(newDate.getDate() - 7);
                          setCurrentMonth(newDate);
                        }}
                        className="h-7 w-7"
                      >
                        <ChevronLeft className="h-4 w-4 text-gray-600" />
                      </Button>
                      
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 text-gray-600" />
                        <span className="font-semibold text-sm text-gray-900">
                          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newDate = new Date(currentMonth);
                          newDate.setDate(newDate.getDate() + 7);
                          setCurrentMonth(newDate);
                        }}
                        className="h-7 w-7"
                      >
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      </Button>
                    </div>

                    {/* Calendar Grid - One Week */}
                    <div className="space-y-2">
                      {/* Day Headers */}
                      <div className="grid grid-cols-7 gap-1">
                        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sat', 'Su'].map((day) => (
                          <div key={day} className="text-center text-xs font-medium text-gray-500">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Week Days */}
                      <div className="grid grid-cols-7 gap-1">
                        {(() => {
                          const today = new Date();
                          const currentDay = currentMonth.getDay();
                          const monday = new Date(currentMonth);
                          monday.setDate(currentMonth.getDate() - ((currentDay + 6) % 7));
                          
                          const weekDays = [];
                          
                          for (let i = 0; i < 7; i++) {
                            const date = new Date(monday);
                            date.setDate(monday.getDate() + i);
                            const isToday = date.toDateString() === today.toDateString();
                            
                            // Check if this date has scheduled classes from database
                            const classesOnDate = scheduledClasses.filter(sc => {
                              const classDate = new Date(sc.scheduled_time);
                              return classDate.toDateString() === date.toDateString();
                            });
                            
                            const hasClasses = classesOnDate.length > 0;
                            
                            weekDays.push(
                              <div key={i} className="flex flex-col items-center">
                                <div
                                  className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                                    isToday
                                      ? 'bg-purple-500 text-white'
                                      : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                                  }`}
                                >
                                  {date.getDate()}
                                </div>
                                {hasClasses && (
                                  <div className="flex gap-0.5 mt-1">
                                    {classesOnDate.slice(0, 2).map((_, idx) => (
                                      <div 
                                        key={idx} 
                                        className={`w-1 h-1 rounded-full ${
                                          idx === 0 ? 'bg-red-500' : 'bg-cyan-500'
                                        }`} 
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          
                          return weekDays;
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Classes */}
                <div className="space-y-3">
                  {scheduledClasses.slice(0, 2).map((scheduledClass, index) => {
                    const classDate = new Date(scheduledClass.scheduled_time);
                    const dateStr = classDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                    const timeStr = classDate.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: false 
                    });
                    const endTime = new Date(classDate.getTime() + 60 * 60000);
                    const endTimeStr = endTime.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: false 
                    });

                    const colors = [
                      { bg: 'bg-gray-900', icon: 'bg-gray-900', label: 'Course' },
                      { bg: 'bg-cyan-500', icon: 'bg-cyan-500', label: 'Tutoring' }
                    ];
                    const color = colors[index % colors.length];

                    return (
                      <Card
                        key={scheduledClass.id}
                        className="border-2 hover:border-[#006d2c] transition-all cursor-pointer group"
                        onClick={() => navigate("/student/schedule")}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 rounded-full ${color.bg} flex items-center justify-center flex-shrink-0`}>
                              <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 mb-1">{color.label}</p>
                              <h4 className="font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-[#006d2c] transition-colors">
                                {scheduledClass.title}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  <span>{dateStr}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{timeStr}-{endTimeStr}</span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#006d2c] transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {scheduledClasses.length === 0 && (
                    <Card className="border-2 border-dashed">
                      <CardContent className="p-8 text-center">
                        <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-600">No upcoming classes</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Upcoming Classes</h3>
                    {scheduledClasses.length > 0 && (
                      <Badge className="bg-[#006d2c] text-white">
                        {scheduledClasses.length} {scheduledClasses.length === 1 ? 'class' : 'classes'}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {scheduledClasses.length > 0 ? (
                      scheduledClasses.map((scheduledClass, index) => {
                        const classDate = new Date(scheduledClass.scheduled_time);
                        const now = new Date();
                        const isToday = classDate.toDateString() === now.toDateString();
                        const isTomorrow = classDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();
                        const dayName = classDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                        const monthName = classDate.toLocaleDateString('en-US', { month: 'short' });
                        const dayNumber = classDate.getDate();
                        const timeString = classDate.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        });
                        const endTime = new Date(classDate.getTime() + 90 * 60000);
                        const endTimeString = endTime.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        });

                        // Calculate time until class
                        const timeUntil = classDate.getTime() - now.getTime();
                        const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
                        const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
                        const isStartingSoon = hoursUntil === 0 && minutesUntil <= 30 && minutesUntil > 0;

                        // Gradient colors based on index
                        const gradients = [
                          'from-blue-500 to-purple-600',
                          'from-green-500 to-teal-600',
                          'from-orange-500 to-red-600',
                          'from-pink-500 to-rose-600',
                          'from-indigo-500 to-blue-600',
                        ];
                        const gradient = gradients[index % gradients.length];

                        return (
                          <div
                            key={scheduledClass.id}
                            className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-200 hover:border-[#006d2c] transition-all duration-300 hover:shadow-2xl cursor-pointer"
                            onClick={() => window.open(scheduledClass.meet_link, '_blank')}
                          >
                            {/* Animated background gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                            
                            {/* Starting soon pulse animation */}
                            {isStartingSoon && (
                              <div className="absolute top-3 right-3 z-10">
                                <div className="relative">
                                  <Badge className="bg-red-500 text-white animate-pulse">
                                    Starting Soon!
                                  </Badge>
                                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                                </div>
                              </div>
                            )}

                            {/* Today/Tomorrow badge */}
                            {(isToday || isTomorrow) && !isStartingSoon && (
                              <div className="absolute top-3 right-3 z-10">
                                <Badge className="bg-[#006d2c] text-white">
                                  {isToday ? 'Today' : 'Tomorrow'}
                                </Badge>
                              </div>
                            )}

                            <div className="relative p-3 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-4">
                              {/* Date Badge */}
                              <div className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br ${gradient} flex flex-col items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <span className="text-xs font-semibold opacity-90">{monthName}</span>
                                <span className="text-2xl sm:text-3xl font-bold leading-none">{dayNumber}</span>
                                <span className="text-xs font-medium opacity-90">{dayName}</span>
                              </div>

                              {/* Class Details */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base group-hover:text-[#006d2c] transition-colors">
                                  {scheduledClass.title}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-1">
                                  {scheduledClass.courses?.title}
                                </p>
                                
                                {/* Time and Duration */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                                  <div className="flex items-center gap-1.5 text-gray-700">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-[#006d2c]" />
                                    <span className="font-medium">{timeString}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <svg className="h-3 w-3 sm:h-4 sm:w-4 text-[#006d2c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>90 min</span>
                                  </div>
                                </div>

                                {/* Time until class */}
                                {hoursUntil >= 0 && (
                                  <div className="mt-1 sm:mt-2 text-xs text-gray-500">
                                    {isStartingSoon ? (
                                      <span className="text-red-600 font-semibold">Starts in {minutesUntil} minutes</span>
                                    ) : hoursUntil === 0 ? (
                                      <span>Starts in {minutesUntil} minutes</span>
                                    ) : hoursUntil < 24 ? (
                                      <span>Starts in {hoursUntil}h {minutesUntil}m</span>
                                    ) : (
                                      <span>In {Math.floor(hoursUntil / 24)} days</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Join Button */}
                              <div className="flex-shrink-0 flex items-center sm:items-start">
                                <Button
                                  size="sm"
                                  className="bg-[#006d2c] hover:bg-[#005523] text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 w-full sm:w-auto text-xs sm:text-sm"
                                >
                                  <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  Join
                                </Button>
                              </div>
                            </div>

                            {/* Bottom accent line */}
                            <div className={`h-1 bg-gradient-to-r ${gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                          <CalendarDays className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium mb-1">No upcoming classes</p>
                        <p className="text-sm text-gray-500">Your schedule is clear for now</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StudentDashboard;
