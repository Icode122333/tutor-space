import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/LanguageSelector";

const StudentSchedule = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

    if (error) {
      console.error("Error fetching scheduled classes:", error);
    } else {
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("student_id", user.id);

      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
      const filteredClasses = data?.filter(c => enrolledCourseIds.includes(c.course_id)) || [];
      
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
    return <LoadingSpinner />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <StudentSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-card px-6 py-4 rounded-2xl shadow-lg mx-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold">{t('schedule.classSchedule')}</h1>
                  <p className="text-sm text-muted-foreground">{t('schedule.viewManageClasses')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <LanguageSelector />
                <Avatar className="h-12 w-12 rounded-full shadow-lg border-2 border-white">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile?.full_name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 order-2 lg:order-1">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{t('schedule.upcomingClasses')}</CardTitle>
                        {scheduledClasses.length > 0 && (
                          <Badge className="bg-primary">
                            {scheduledClasses.length} {scheduledClasses.length === 1 ? t('schedule.class') : t('schedule.classes')}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
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

                            const timeUntil = classDate.getTime() - now.getTime();
                            const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
                            const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
                            const isStartingSoon = hoursUntil === 0 && minutesUntil <= 30 && minutesUntil > 0;

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
                                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-200 hover:border-primary transition-all duration-300 hover:shadow-lg cursor-pointer"
                                onClick={() => window.open(scheduledClass.meet_link, '_blank')}
                              >
                                {isStartingSoon && (
                                  <div className="absolute top-3 right-3 z-10">
                                    <Badge className="bg-red-500 text-white animate-pulse">
                                      {t('schedule.startingSoon')}
                                    </Badge>
                                  </div>
                                )}

                                {(isToday || isTomorrow) && !isStartingSoon && (
                                  <div className="absolute top-3 right-3 z-10">
                                    <Badge className="bg-primary text-white">
                                      {isToday ? t('schedule.today') : t('schedule.tomorrow')}
                                    </Badge>
                                  </div>
                                )}

                                <div className="relative p-5 flex gap-4">
                                  <div className={`flex-shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br ${gradient} flex flex-col items-center justify-center text-white shadow-lg`}>
                                    <span className="text-xs font-semibold opacity-90">{monthName}</span>
                                    <span className="text-3xl font-bold leading-none">{dayNumber}</span>
                                    <span className="text-xs font-medium opacity-90">{dayName}</span>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">
                                      {scheduledClass.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                                      {scheduledClass.courses?.title}
                                    </p>
                                    
                                    <div className="flex items-center gap-4 text-sm">
                                      <div className="flex items-center gap-1.5 text-gray-700">
                                        <CalendarIcon className="h-4 w-4 text-primary" />
                                        <span className="font-medium">{timeString}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-gray-600">
                                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>90 {t('schedule.min')}</span>
                                      </div>
                                    </div>

                                    {hoursUntil >= 0 && (
                                      <div className="mt-2 text-xs text-gray-500">
                                        {isStartingSoon ? (
                                          <span className="text-red-600 font-semibold">{t('schedule.startsIn')} {minutesUntil} {t('schedule.minutes')}</span>
                                        ) : hoursUntil === 0 ? (
                                          <span>{t('schedule.startsIn')} {minutesUntil} {t('schedule.minutes')}</span>
                                        ) : hoursUntil < 24 ? (
                                          <span>{t('schedule.startsIn')} {hoursUntil}{t('schedule.hours')} {minutesUntil}m</span>
                                        ) : (
                                          <span>{Math.floor(hoursUntil / 24)} {t('schedule.days')}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-shrink-0 flex items-center">
                                    <Button
                                      size="sm"
                                      className="bg-primary hover:bg-primary/90 text-white"
                                    >
                                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      {t('schedule.join')}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                              <CalendarIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium mb-1">{t('schedule.noUpcomingClasses')}</p>
                            <p className="text-sm text-gray-500">{t('schedule.scheduleIsClear')}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1 order-1 lg:order-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('schedule.calendar')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border-0"
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
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StudentSchedule;
