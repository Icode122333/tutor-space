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
          <header className="border-b bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold">Welcome Back, {profile?.full_name || 'Peter'}!</h1>
                  <p className="text-sm text-muted-foreground">Let's boost your knowledge today and learn a new things</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile?.full_name?.charAt(0) || 'P'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              <div className="lg:col-span-2 space-y-6">
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate("/course/1")}
                    >
                      <CardContent className="p-6">
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-primary">IBM</span>
                        </div>
                        <h3 className="font-semibold mb-4">IBM Mastery: Build a Passive Income from...</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">3.2 hours taken</span>
                            <span className="text-muted-foreground">/ 10 hours</span>
                          </div>
                          <Progress value={32} />
                        </div>
                      </CardContent>
                    </Card>
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate("/course/2")}
                    >
                      <CardContent className="p-6">
                        <div className="mb-4">
                          <span className="text-3xl font-bold" style={{ color: '#4285F4' }}>Google</span>
                        </div>
                        <h3 className="font-semibold mb-4">Mastering Git & Vercel App Become Pro...</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">2.5 hours taken</span>
                            <span className="text-muted-foreground">/ 6 hours</span>
                          </div>
                          <Progress value={42} className="[&>div]:bg-orange-500" />
                        </div>
                      </CardContent>
                    </Card>
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
                    <div className="mt-4 space-y-2">
                      {scheduledClasses.length > 0 ? (
                        scheduledClasses.map((scheduledClass) => {
                          const classDate = new Date(scheduledClass.scheduled_time);
                          const timeString = classDate.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          });

                          return (
                            <Card key={scheduledClass.id} className="bg-accent/10 border-l-4 border-l-accent">
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <Badge className="bg-accent text-accent-foreground mb-2">Live Class</Badge>
                                    <h4 className="font-semibold text-sm">{scheduledClass.title}</h4>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {scheduledClass.courses?.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {classDate.toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })} at {timeString}
                                    </p>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={() => window.open(scheduledClass.meet_link, '_blank')}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No upcoming classes scheduled
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StudentDashboard;
