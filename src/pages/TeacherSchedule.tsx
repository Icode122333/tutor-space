import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Video, Clock, Users, Calendar as CalendarIcon, Plus, ExternalLink, Trash2, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const TeacherSchedule = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [courses, setCourses] = useState<any[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    course_id: "",
    title: "",
    description: "",
    scheduled_time: "",
    meet_link: "",
  });

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
      fetchCourses();
      fetchScheduledClasses();
    }
  }, [user, profile, loading, navigate]);

  const fetchCourses = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching courses:", error);
    } else {
      setCourses(data || []);
    }
  };

  const fetchScheduledClasses = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("scheduled_classes")
      .select(`
        *,
        courses (
          title
        )
      `)
      .eq("teacher_id", user.id)
      .gte("scheduled_time", new Date().toISOString())
      .order("scheduled_time", { ascending: true });

    if (error) {
      console.error("Error fetching scheduled classes:", error);
    } else {
      setScheduledClasses(data || []);
    }
  };

  const handleScheduleClass = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !scheduleForm.course_id || !scheduleForm.title || !scheduleForm.scheduled_time || !scheduleForm.meet_link) {
      toast.error("Please fill all required fields");
      return;
    }

    const { error } = await supabase
      .from("scheduled_classes")
      .insert({
        course_id: scheduleForm.course_id,
        teacher_id: user.id,
        title: scheduleForm.title,
        description: scheduleForm.description,
        scheduled_time: scheduleForm.scheduled_time,
        meet_link: scheduleForm.meet_link,
      });

    if (error) {
      toast.error("Failed to schedule class");
      console.error(error);
    } else {
      toast.success("Class scheduled successfully!");
      setScheduleForm({
        course_id: "",
        title: "",
        description: "",
        scheduled_time: "",
        meet_link: "",
      });
      setShowForm(false);
      fetchScheduledClasses();
    }
  };

  const handleDeleteClass = async (classId: string) => {
    const { error } = await supabase
      .from("scheduled_classes")
      .delete()
      .eq("id", classId);

    if (error) {
      toast.error("Failed to delete class");
    } else {
      toast.success("Class deleted successfully");
      fetchScheduledClasses();
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-green-50 via-white to-green-100">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-3xl font-bold text-black">Class Schedule</h1>
                  <p className="text-sm text-gray-600">Manage your online classes and meetings</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>{profile?.full_name?.substring(0, 2).toUpperCase() || 'TC'}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Action Button */}
              <div className="flex justify-end">
                <Button 
                  size="lg" 
                  className="gap-2 bg-[#006d2c] hover:bg-[#005523] text-white"
                  onClick={() => setShowForm(!showForm)}
                >
                  <Plus className="h-5 w-5" />
                  Schedule New Class
                </Button>
              </div>

              {/* Schedule Form */}
              {showForm && (
                <Card className="border-2 border-[#006d2c]/20 shadow-xl">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-[#006d2c]/10 flex items-center justify-center">
                        <Video className="h-6 w-6 text-[#006d2c]" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-black">Schedule Online Class</h2>
                        <p className="text-gray-600">Create a new live session with Google Meet</p>
                      </div>
                    </div>

                    <form onSubmit={handleScheduleClass} className="space-y-5">
                      <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="course" className="text-sm font-semibold text-gray-700">Select Course *</Label>
                          <Select
                            value={scheduleForm.course_id}
                            onValueChange={(value) => setScheduleForm({ ...scheduleForm, course_id: value })}
                          >
                            <SelectTrigger className="h-12 border-gray-300">
                              <SelectValue placeholder="Choose a course" />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Class Title *</Label>
                          <Input
                            id="title"
                            value={scheduleForm.title}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                            placeholder="e.g., Introduction to React Hooks"
                            className="h-12 border-gray-300"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                        <Textarea
                          id="description"
                          value={scheduleForm.description}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                          placeholder="Describe what will be covered in this class"
                          rows={3}
                          className="border-gray-300"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="scheduled_time" className="text-sm font-semibold text-gray-700">Date & Time *</Label>
                          <Input
                            id="scheduled_time"
                            type="datetime-local"
                            value={scheduleForm.scheduled_time}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_time: e.target.value })}
                            className="h-12 border-gray-300"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="meet_link" className="text-sm font-semibold text-gray-700">Google Meet Link *</Label>
                          <Input
                            id="meet_link"
                            type="url"
                            value={scheduleForm.meet_link}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, meet_link: e.target.value })}
                            placeholder="https://meet.google.com/xxx-xxxx-xxx"
                            className="h-12 border-gray-300"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="bg-[#006d2c] hover:bg-[#005523] text-white px-8">
                          Schedule Class
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Scheduled Classes List */}
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-2xl font-bold text-black mb-4">Upcoming Classes</h2>
                  
                  {scheduledClasses.length === 0 ? (
                    <Card className="border-2 border-dashed border-gray-300">
                      <CardContent className="p-12 text-center">
                        <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes scheduled</h3>
                        <p className="text-gray-600 mb-6">Start by scheduling your first online class</p>
                        <Button onClick={() => setShowForm(true)} className="bg-[#006d2c] hover:bg-[#005523]">
                          <Plus className="h-4 w-4 mr-2" />
                          Schedule Class
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    scheduledClasses.map((classItem) => (
                      <Card key={classItem.id} className="border-l-4 border-l-[#006d2c] hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-lg bg-[#006d2c]/10 flex items-center justify-center">
                                  <Video className="h-6 w-6 text-[#006d2c]" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-black">{classItem.title}</h3>
                                  <p className="text-sm text-gray-600">{classItem.courses?.title}</p>
                                </div>
                              </div>
                              
                              {classItem.description && (
                                <p className="text-gray-700 mb-4 ml-15">{classItem.description}</p>
                              )}

                              <div className="flex flex-wrap gap-4 ml-15">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <CalendarIcon className="h-4 w-4 text-[#006d2c]" />
                                  <span>{format(new Date(classItem.scheduled_time), "MMM dd, yyyy")}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="h-4 w-4 text-[#006d2c]" />
                                  <span>{format(new Date(classItem.scheduled_time), "hh:mm a")}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(classItem.meet_link, '_blank')}
                                className="gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Join
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteClass(classItem.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-15">
                            <Badge className="bg-[#006d2c]/10 text-[#006d2c] hover:bg-[#006d2c]/20">
                              Scheduled
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Calendar Sidebar */}
                <div className="space-y-6">
                  <Card className="border-2 border-gray-200">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-black mb-4">Calendar</h3>
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-[#006d2c]/20 bg-gradient-to-br from-[#006d2c]/5 to-white">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-black mb-4">Quick Stats</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total Classes</span>
                          <span className="text-2xl font-bold text-[#006d2c]">{scheduledClasses.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">This Week</span>
                          <span className="text-2xl font-bold text-[#006d2c]">
                            {scheduledClasses.filter(c => {
                              const classDate = new Date(c.scheduled_time);
                              const weekFromNow = new Date();
                              weekFromNow.setDate(weekFromNow.getDate() + 7);
                              return classDate <= weekFromNow;
                            }).length}
                          </span>
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

export default TeacherSchedule;
