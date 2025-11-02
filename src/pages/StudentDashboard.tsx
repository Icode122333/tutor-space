import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, BookOpen, CalendarDays, Clock, User, ChevronLeft, ChevronRight, Award, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { GradesTable } from "@/components/GradesTable";
import AssignmentUploadWidget from "@/components/AssignmentUploadWidget";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [studentId, setStudentId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    const getStudentId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setStudentId(user.id);
    };
    getStudentId();
    checkUser();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchScheduledClasses();
      fetchEnrolledCourses();
      fetchAssignments();
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
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get enrolled courses
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("student_id", user.id);

      const courseIds = enrollments?.map(e => e.course_id) || [];

      if (courseIds.length === 0) {
        setAssignments([]);
        return;
      }

      // Get capstone projects for enrolled courses
      const { data: capstones, error } = await supabase
        .from("capstone_projects")
        .select(`
          id,
          title,
          description,
          due_date,
          course_id,
          courses (
            title
          )
        `)
        .in("course_id", courseIds);

      if (error) throw error;

      // Get submissions for these capstones
      const capstoneIds = capstones?.map(c => c.id) || [];
      const { data: submissions } = await supabase
        .from("capstone_submissions")
        .select("*")
        .eq("student_id", user.id)
        .in("capstone_project_id", capstoneIds);

      // Map assignments with submission status
      const assignmentsData = (capstones || []).map((capstone: any) => {
        const submission = submissions?.find(s => s.capstone_project_id === capstone.id);
        return {
          id: capstone.id,
          title: capstone.title,
          description: capstone.description,
          due_date: capstone.due_date,
          course_title: capstone.courses.title,
          course_id: capstone.course_id,
          submission: submission ? {
            id: submission.id,
            submitted_at: submission.submitted_at,
            grade: submission.grade,
            feedback: submission.feedback
          } : null
        };
      });

      setAssignments(assignmentsData);
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
    }
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
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Top Section - Cohort Banner and Calendar/Upcoming Classes Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cohort Banner - Takes 2 columns */}
                <div className="lg:col-span-2">
                  <div className="relative overflow-hidden rounded-2xl bg-[#006D2C] px-4 py-2.5 min-h-[280px] flex items-center">
                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                      <div className="flex-1 text-white">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight tracking-wide">
                          If you want to go far go with team
                        </h2>
                        <p className="text-xl sm:text-2xl font-semibold mb-4 tracking-wide">
                          Start with cohort
                        </p>
                        <Button
                          onClick={() => navigate("/courses")}
                          className="bg-white text-[#006D2C] hover:bg-gray-100 font-semibold px-6 py-2.5 rounded-full flex items-center gap-2 text-base w-fit"
                        >
                          Join Now
                          <div className="w-6 h-6 rounded-full bg-[#006D2C] flex items-center justify-center">
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
                          className="w-56 sm:w-64 lg:w-80 h-auto object-contain"
                        />
                      </div>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                  </div>
                </div>

                {/* Right Sidebar - Calendar Widget and Upcoming Classes - Takes 1 column */}
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
                                    className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${isToday
                                      ? 'bg-purple-500 text-white'
                                      : hasClasses
                                        ? 'bg-red-500 text-white'
                                        : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                                      }`}
                                  >
                                    {date.getDate()}
                                  </div>
                                  {hasClasses && !isToday && (
                                    <div className="flex gap-0.5 mt-1">
                                      {classesOnDate.slice(0, 2).map((_, idx) => (
                                        <div
                                          key={idx}
                                          className={`w-1 h-1 rounded-full bg-red-500`}
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
                </div>
              </div>

              {/* My Courses Section - Full Width Below */}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                              {/* Level */}
                              <div className="flex items-center justify-between mb-3">
                                <span
                                  className={`text-sm font-semibold ${level === "Beginner"
                                    ? "text-green-600"
                                    : level === "Intermediate"
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                    }`}
                                >
                                  {level}
                                </span>
                                <span className="text-xs text-gray-500">Enrolled</span>
                              </div>

                              {/* Course Title */}
                              <h3 className="font-bold text-gray-900 mb-4 line-clamp-2 min-h-[3rem] text-base">
                                {course.title}
                              </h3>

                              {/* View Button */}
                              <Button
                                className="w-full bg-[#006D2C] hover:bg-[#005523] text-white rounded-full font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/course/${course.id}`);
                                }}
                              >
                                View
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

              {/* My Assignments Section */}
              {studentId && enrolledCourses.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 rounded-full p-2">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">My Assignments</h2>
                      <p className="text-sm text-muted-foreground">View and submit your course assignments</p>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                        <FileText className="h-4 w-4 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{assignments.length}</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {assignments.filter(a => !a.submission).length}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                        <Upload className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {assignments.filter(a => a.submission).length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Assignments List */}
                  {assignments.length === 0 ? (
                    <Card className="border-2 border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
                        <p className="text-sm text-gray-600 text-center mb-4">
                          You don't have any assignments. Enroll in courses to get started!
                        </p>
                        <Button onClick={() => navigate("/courses")} className="bg-[#006d2c] hover:bg-[#005523]">
                          Browse Courses
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {assignments.map((assignment) => (
                        <Card key={assignment.id} className={`hover:shadow-lg transition-shadow ${
                          assignment.submission ? 'border-green-200' : 'border-orange-200'
                        }`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold mb-1">{assignment.title}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{assignment.course_title}</p>
                                {assignment.due_date && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>Due: {new Date(assignment.due_date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}</span>
                                  </div>
                                )}
                              </div>
                              {assignment.submission ? (
                                <Badge className="bg-green-500">
                                  <Upload className="h-3 w-3 mr-1" />
                                  Submitted
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-orange-500 border-orange-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {assignment.description}
                            </p>

                            {assignment.submission ? (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">
                                  Submitted: {new Date(assignment.submission.submitted_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                {assignment.submission.grade !== null && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-green-900">Grade</span>
                                      <span className="text-xl font-bold text-green-600">
                                        {assignment.submission.grade}/100
                                      </span>
                                    </div>
                                    {assignment.submission.feedback && (
                                      <div className="mt-2">
                                        <p className="text-xs font-semibold text-green-900 mb-1">Feedback:</p>
                                        <p className="text-xs text-green-800">{assignment.submission.feedback}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="border-t pt-4">
                                <p className="text-sm font-semibold mb-3">Upload Your Submission</p>
                                <AssignmentUploadWidget
                                  studentId={studentId}
                                  capstoneProjectId={assignment.id}
                                  onUploaded={fetchAssignments}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quiz Scores/Marks Section */}
              {studentId && enrolledCourses.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-100 rounded-full p-2">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">My Quiz Scores</h2>
                      <p className="text-sm text-muted-foreground">Track your quiz performance and marks</p>
                    </div>
                  </div>
                  <GradesTable studentId={studentId} showFilters={false} />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StudentDashboard;
