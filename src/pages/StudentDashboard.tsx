import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Bell, Star, MoreVertical, FileText, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchScheduledClasses();
    }
  }, [profile]);

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <StudentSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-card px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <SidebarTrigger />
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl font-bold truncate">Welcome Back, {profile?.full_name || 'Peter'}!</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Let's boost your knowledge today and learn a new things</p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-4">
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <Search className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile?.full_name?.charAt(0) || 'P'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Premium Banner */}
                <Card className="border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground overflow-hidden relative">
                  <CardContent className="p-8">
                    <div className="relative z-10">
                      <h2 className="text-3xl font-bold mb-2">Unlock premium access</h2>
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                        ))}
                      </div>
                      <p className="mb-6 opacity-90">to a world of knowledge at your fingertips!</p>
                      <Button variant="secondary" size="lg">Get Premium</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* My Courses */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">My Courses</h2>
                    <Button variant="link">See all</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Course Card 1 */}
                    <div 
                      className="group cursor-pointer"
                      onClick={() => navigate("/course/1")}
                    >
                      <div className="relative overflow-hidden rounded-xl bg-white border-2 border-gray-200 hover:border-[#006d2c] transition-all duration-300 hover:shadow-xl">
                        <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="h-20 w-20 text-white/30" />
                          </div>
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-[#006d2c] text-white hover:bg-[#005523]">
                              Beginner
                            </Badge>
                          </div>
                        </div>
                        <div className="p-5">
                          <h4 className="font-bold text-black mb-3 line-clamp-2 text-lg">IBM Mastery: Build a Passive Income</h4>
                          <div className="space-y-2 mb-3">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>3.2 hours taken</span>
                              <span>/ 10 hours</span>
                            </div>
                            <Progress value={32} className="h-2" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">32% Complete</span>
                            <span className="text-[#006d2c] font-bold text-sm">Continue</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Course Card 2 */}
                    <div 
                      className="group cursor-pointer"
                      onClick={() => navigate("/course/2")}
                    >
                      <div className="relative overflow-hidden rounded-xl bg-white border-2 border-gray-200 hover:border-[#006d2c] transition-all duration-300 hover:shadow-xl">
                        <div className="relative h-48 bg-gradient-to-br from-orange-400 to-orange-600 overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="h-20 w-20 text-white/30" />
                          </div>
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-[#006d2c] text-white hover:bg-[#005523]">
                              Intermediate
                            </Badge>
                          </div>
                        </div>
                        <div className="p-5">
                          <h4 className="font-bold text-black mb-3 line-clamp-2 text-lg">Mastering Git & Vercel App Become Pro</h4>
                          <div className="space-y-2 mb-3">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>2.5 hours taken</span>
                              <span>/ 6 hours</span>
                            </div>
                            <Progress value={42} className="h-2" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">42% Complete</span>
                            <span className="text-[#006d2c] font-bold text-sm">Continue</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lesson */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Lesson</h2>
                    <Button variant="link">See all</Button>
                  </div>
                  <div className="space-y-3">
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">Essay: Write an essay on design principles</h3>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                              <span>Mastering Git & Vercel</span>
                              <span>•</span>
                              <span>Ms. Gynda</span>
                              <span>•</span>
                              <Badge variant="secondary">Theory</Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline">Start</Button>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">CSS Selector</h3>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                              <span>HTML/CSS Mastery</span>
                              <span>•</span>
                              <span>Mr. Reynold</span>
                              <span>•</span>
                              <Badge variant="secondary">Theory</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={80} className="w-16" />
                          <span className="text-sm font-medium text-primary">80%</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">Quiz: Autolayout Figma Test</h3>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                              <span>Mastering Figma</span>
                              <span>•</span>
                              <span>Ms. Dyana</span>
                              <span>•</span>
                              <Badge variant="secondary">Theory</Badge>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-500 text-white">Done</Badge>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Class Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md border-0"
                    />
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Upcoming Classes</h3>
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

                            <div className="relative p-5 flex gap-4">
                              {/* Date Badge */}
                              <div className={`flex-shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br ${gradient} flex flex-col items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <span className="text-xs font-semibold opacity-90">{monthName}</span>
                                <span className="text-3xl font-bold leading-none">{dayNumber}</span>
                                <span className="text-xs font-medium opacity-90">{dayName}</span>
                              </div>

                              {/* Class Details */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-[#006d2c] transition-colors">
                                  {scheduledClass.title}
                                </h4>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                                  {scheduledClass.courses?.title}
                                </p>
                                
                                {/* Time and Duration */}
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1.5 text-gray-700">
                                    <Calendar className="h-4 w-4 text-[#006d2c]" />
                                    <span className="font-medium">{timeString}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <svg className="h-4 w-4 text-[#006d2c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>90 min</span>
                                  </div>
                                </div>

                                {/* Time until class */}
                                {hoursUntil >= 0 && (
                                  <div className="mt-2 text-xs text-gray-500">
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
                              <div className="flex-shrink-0 flex items-center">
                                <Button
                                  size="sm"
                                  className="bg-[#006d2c] hover:bg-[#005523] text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                                >
                                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                          <Calendar className="h-8 w-8 text-gray-400" />
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
