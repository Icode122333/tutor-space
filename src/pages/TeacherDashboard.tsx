import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Bell, ShoppingCart, Plus, Users, BookOpen, ClipboardList, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
        return;
      }

      if (profile && profile.role !== "teacher") {
        navigate("/student/dashboard");
        return;
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
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
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">3</span>
                </Button>
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

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  {/* Create Course Button */}
                  <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">Ready to create a new course?</h3>
                          <p className="text-sm text-muted-foreground">Share your knowledge with students worldwide</p>
                        </div>
                        <Button size="lg" className="gap-2">
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
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                            WD
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">Web Development Bootcamp</h4>
                                <p className="text-sm text-muted-foreground">124 students enrolled</p>
                              </div>
                              <Badge>Active</Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Course Progress</span>
                                <span className="font-medium">78%</span>
                              </div>
                              <Progress value={78} />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                            DS
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">Data Science Fundamentals</h4>
                                <p className="text-sm text-muted-foreground">89 students enrolled</p>
                              </div>
                              <Badge>Active</Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Course Progress</span>
                                <span className="font-medium">56%</span>
                              </div>
                              <Progress value={56} />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xl">
                            ML
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">Machine Learning Basics</h4>
                                <p className="text-sm text-muted-foreground">67 students enrolled</p>
                              </div>
                              <Badge variant="secondary">Draft</Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Course Progress</span>
                                <span className="font-medium">34%</span>
                              </div>
                              <Progress value={34} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
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
