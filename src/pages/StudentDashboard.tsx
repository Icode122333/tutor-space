import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, CalendarDays, Clock, ChevronLeft, ChevronRight, Award } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { GradesTable } from "@/components/GradesTable";
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/LanguageSelector";
import { JoinCohortDialog } from "@/components/JoinCohortDialog";
import { CourseCard } from "@/components/CourseCard";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [studentId, setStudentId] = useState<string | null>(null);
  const [showJoinCohortDialog, setShowJoinCohortDialog] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const sliderImages = [
    "/images/Gemini_Generated_Image_lrwgaxlrwgaxlrwg.png",
    "/images/Gemini_Generated_Image_zg4uzxzg4uzxzg4u.png"
  ];

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
    }
  }, [profile]);

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 6000); // Change slide every 6 seconds

    return () => clearInterval(interval);
  }, [sliderImages.length]);

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
        navigate("/onboarding", { replace: true });
        return;
      }

      if (profileData.role !== "student") {
        navigate("/teacher/dashboard", { replace: true });
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
                    {t('dashboard.hello')}, {profile?.full_name?.split(' ').pop() || t('onboarding.student')} 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.welcomeBack')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <LanguageSelector />
                <div className="relative hidden sm:block">
                  <input
                    type="text"
                    placeholder={t('common.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-3 pr-10 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006D2C]/20 w-48"
                  />
                  <Search className="h-4 w-4 text-[#006D2C] absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <NotificationBell />
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
                {/* Banner Slider - Takes 2 columns */}
                <div className="lg:col-span-2">
                  <div className="relative overflow-hidden rounded-2xl min-h-[280px] shadow-lg bg-gray-900">
                    {/* Background Image Slider */}
                    {sliderImages.map((image, index) => (
                      <div
                        key={index}
                        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                        style={{
                          opacity: currentSlide === index ? 1 : 0,
                          zIndex: currentSlide === index ? 1 : 0,
                        }}
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                          style={{
                            backgroundImage: `url(${image})`,
                            filter: 'brightness(0.7) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                          }}
                        />
                        {/* Dark overlay for better text readability */}
                        <div className="absolute inset-0 bg-black/50"></div>
                      </div>
                    ))}

                    {/* Content - Different for each slide */}
                    <div className="relative z-10 px-4 py-2.5 min-h-[280px] flex items-center">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                        {/* Slide 1 Content - Learn with us */}
                        {currentSlide === 0 && (
                          <div className="flex-1 text-white animate-in fade-in slide-in-from-left-4 duration-700">
                            <h2 className="text-2xl sm:text-4xl font-bold mb-2 leading-tight tracking-wide drop-shadow-md">
                              Learn with us
                            </h2>
                            <p className="text-xl sm:text-2xl font-semibold mb-4 tracking-wide drop-shadow-md">
                              whenever you are
                            </p>
                            <Button
                              onClick={() => navigate("/courses")}
                              className="bg-[#006D2C] hover:bg-[#005523] text-white font-semibold px-6 py-2.5 rounded-full flex items-center gap-2 text-base w-fit shadow-lg"
                            >
                              Browse Courses
                              <BookOpen className="w-5 h-5" />
                            </Button>
                          </div>
                        )}

                        {/* Slide 2 Content - Cohort */}
                        {currentSlide === 1 && (
                          <div className="flex-1 text-white animate-in fade-in slide-in-from-left-4 duration-700">
                            <h2 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight tracking-wide drop-shadow-md">
                              {t('dashboard.goFarWithTeam')}
                            </h2>
                            <p className="text-xl sm:text-2xl font-semibold mb-4 tracking-wide drop-shadow-md">
                              {t('dashboard.startWithCohort')}
                            </p>
                            <Button
                              onClick={() => setShowJoinCohortDialog(true)}
                              className="bg-white text-[#006D2C] hover:bg-gray-100 font-semibold px-6 py-2.5 rounded-full flex items-center gap-2 text-base w-fit shadow-lg"
                            >
                              {t('dashboard.joinNow')}
                              <div className="w-6 h-6 rounded-full bg-[#006D2C] flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Slide indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                      {sliderImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`h-2 rounded-full transition-all shadow-md ${
                            currentSlide === index 
                              ? 'bg-white w-8' 
                              : 'bg-white/50 hover:bg-white/75 w-2'
                          }`}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
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
                          {[
                            t('schedule.mo'),
                            t('schedule.tu'),
                            t('schedule.we'),
                            t('schedule.th'),
                            t('schedule.fr'),
                            t('schedule.sat'),
                            t('schedule.su')
                          ].map((day) => (
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
                        { bg: 'bg-gray-900', icon: 'bg-gray-900', label: t('dashboard.course') },
                        { bg: 'bg-cyan-500', icon: 'bg-cyan-500', label: t('dashboard.tutoring') }
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
                          <p className="text-sm text-gray-600">{t('dashboard.noUpcomingClasses')}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>

              {/* My Courses Section - Full Width Below */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">{t('courses.myCourses')}</h2>
                  {enrolledCourses.length > 0 && (
                    <Badge variant="secondary" className="text-sm">
                      {enrolledCourses.length} {enrolledCourses.length === 1 ? t('dashboard.course') : t('dashboard.courses')}
                    </Badge>
                  )}
                </div>

                {(() => {
                  // Filter courses based on search query
                  const filteredCourses = enrolledCourses.filter((enrollment) => {
                    const course = enrollment.courses;
                    return course.title.toLowerCase().startsWith(searchQuery.toLowerCase());
                  });

                  if (filteredCourses.length > 0) {
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredCourses.map((enrollment, index) => {
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
                          const columnIndex = index % 4; // Calculate which column (0-3) for 4-column grid

                          return (
                            <CourseCard
                              key={course.id}
                              course={course}
                              onClick={() => navigate(`/course/${course.id}`)}
                              gradient={gradient}
                              showTeacher={true}
                              columnIndex={columnIndex}
                              isEnrolled={true}
                            />
                          );
                        })}
                      </div>
                    );
                  } else if (searchQuery && enrolledCourses.length > 0) {
                    // Show "no results" message when searching but no matches
                    return (
                      <Card className="border-2 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                          <p className="text-sm text-gray-600 text-center">
                            No courses match "{searchQuery}"
                          </p>
                        </CardContent>
                      </Card>
                    );
                  } else {
                    // Show "no courses enrolled" message
                    return (
                      <Card className="border-2 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <BookOpen className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">{t('dashboard.noCourses')}</h3>
                          <p className="text-sm text-gray-600 text-center mb-4">
                            {t('dashboard.notEnrolled')}
                          </p>
                          <Button onClick={() => navigate("/courses")} className="bg-[#006d2c] hover:bg-[#005523]">
                            {t('dashboard.browseCourses')}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  }
                })()}
              </div>

              {/* Quiz Scores/Marks Section */}
              {studentId && enrolledCourses.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-100 rounded-full p-2">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{t('dashboard.myQuizScores')}</h2>
                      <p className="text-sm text-muted-foreground">{t('dashboard.trackQuizPerformance')}</p>
                    </div>
                  </div>
                  <GradesTable studentId={studentId} showFilters={false} />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <JoinCohortDialog
        open={showJoinCohortDialog}
        onOpenChange={setShowJoinCohortDialog}
      />
    </SidebarProvider>
  );
};

export default StudentDashboard;
