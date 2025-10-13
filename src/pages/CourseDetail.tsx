import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, PlayCircle, FileText, Video, ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import VideoPlayer from "@/components/VideoPlayer";
import PDFViewer from "@/components/PDFViewer";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  teacher_id: string;
  price: number;
  requirements: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  duration: number;
  order_index: number;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);

  useEffect(() => {
    const fetchCourse = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching course:", error);
        toast.error("Failed to load course");
      } else {
        setCourse(data);
      }
    };

    const fetchChapters = async () => {
      const { data: chaptersData, error: chaptersError } = await supabase
        .from("course_chapters")
        .select("*")
        .eq("course_id", id)
        .order("order_index");

      if (chaptersError) {
        console.error("Error fetching chapters:", chaptersError);
        return;
      }

      // Fetch lessons for each chapter
      const chaptersWithLessons = await Promise.all(
        chaptersData.map(async (chapter) => {
          const { data: lessonsData, error: lessonsError } = await supabase
            .from("course_lessons")
            .select("*")
            .eq("chapter_id", chapter.id)
            .order("order_index");

          if (lessonsError) {
            console.error("Error fetching lessons:", lessonsError);
            return { ...chapter, lessons: [] };
          }

          return { ...chapter, lessons: lessonsData };
        })
      );

      setChapters(chaptersWithLessons);
      
      // Open first chapter by default and select first lesson
      if (chaptersWithLessons.length > 0) {
        setOpenChapters(new Set([chaptersWithLessons[0].id]));
        if (chaptersWithLessons[0].lessons.length > 0) {
          setSelectedLesson(chaptersWithLessons[0].lessons[0]);
        }
      }
    };

    const fetchEnrolledCount = async () => {
      const { count } = await supabase
        .from("course_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("course_id", id);
      setEnrolledCount(count || 0);
    };

    const fetchScheduledClasses = async () => {
      const { data, error } = await supabase
        .from("scheduled_classes")
        .select("*")
        .eq("course_id", id)
        .gte("scheduled_time", new Date().toISOString())
        .order("scheduled_time", { ascending: true });

      if (error) {
        console.error("Error fetching scheduled classes:", error);
      } else {
        setScheduledClasses(data || []);
      }
    };

    if (id) {
      fetchCourse();
      fetchChapters();
      fetchEnrolledCount();
      fetchScheduledClasses();
    }
    
    setLoading(false);
  }, [id]);

  const toggleChapter = (chapterId: string) => {
    const newOpen = new Set(openChapters);
    if (newOpen.has(chapterId)) {
      newOpen.delete(chapterId);
    } else {
      newOpen.add(chapterId);
    }
    setOpenChapters(newOpen);
  };

  const getTotalDuration = () => {
    return chapters.reduce((total, chapter) => {
      return total + chapter.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
    }, 0);
  };

  const getTotalLessons = () => {
    return chapters.reduce((total, chapter) => total + chapter.lessons.length, 0);
  };

  const handleEnroll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("course_enrollments")
        .insert({ course_id: id, student_id: user.id });

      if (error) throw error;

      toast.success("Successfully enrolled in course!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Course not found</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <StudentSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-card px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Course Details</h1>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            {/* Hero Section - Udemy Style */}
            <div className="bg-[#f9c676]">
              <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h1 className="text-4xl font-bold mb-4 text-gray-900">{course.title}</h1>
                    <p className="text-lg mb-6 text-gray-700 line-clamp-3">{course.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-900">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                        <span className="font-bold">4.7</span>
                        <span className="text-sm text-gray-700">average course rating</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <span className="font-semibold">{enrolledCount.toLocaleString()}</span>
                        <span className="text-sm text-gray-700">learners already enrolled</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <Button 
                        size="lg" 
                        className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                        onClick={handleEnroll}
                      >
                        Get started
                      </Button>
                      <span className="text-2xl font-bold text-gray-900">${course.price || 199.97}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Users className="h-4 w-4" />
                      <span>{enrolledCount.toLocaleString()} learners already enrolled</span>
                    </div>
                  </div>

                  {/* Floating Thumbnail */}
                  <div className="relative">
                    {course.thumbnail_url ? (
                      <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white p-8">
                        <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-[#f9c676] to-[#f4b860]">
                          <PlayCircle className="h-24 w-24 text-white/50" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column - Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Course Content - Udemy Style */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold">Course content</h2>
                      <Button variant="link" className="text-purple-600">Expand all chapters</Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                      {chapters.length} chapters • {getTotalLessons()} lectures • {Math.floor(getTotalDuration() / 60)}h {getTotalDuration() % 60}m total length
                    </p>
                    <div className="space-y-2">
                      {chapters.map((chapter, index) => (
                        <Collapsible
                          key={chapter.id}
                          open={openChapters.has(chapter.id)}
                          onOpenChange={() => toggleChapter(chapter.id)}
                          className="border rounded-lg"
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={openChapters.has(chapter.id) ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                              </svg>
                              <div className="text-left flex-1">
                                <div className="font-semibold text-gray-900">
                                  Chapter {index + 1}: {chapter.title}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {chapter.lessons.length} lectures • {chapter.lessons.reduce((sum, l) => sum + (l.duration || 0), 0)}min
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="border-t">
                            <div className="divide-y">
                              {chapter.lessons.map((lesson) => (
                                <div key={lesson.id} className="bg-white">
                                  <button
                                    onClick={() => setSelectedLesson(selectedLesson?.id === lesson.id ? null : lesson)}
                                    className={`flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors text-left ${
                                      selectedLesson?.id === lesson.id ? "bg-gray-100" : ""
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      {lesson.content_type === "video" ? (
                                        <Video className="h-5 w-5 text-gray-600" />
                                      ) : (
                                        <FileText className="h-5 w-5 text-gray-600" />
                                      )}
                                      <span className="text-sm text-gray-700">{lesson.title}</span>
                                    </div>
                                    {lesson.duration && (
                                      <span className="text-sm text-gray-600">{String(Math.floor(lesson.duration / 60)).padStart(2, '0')}:{String(lesson.duration % 60).padStart(2, '0')}</span>
                                    )}
                                  </button>
                                  
                                  {/* Video/PDF Player inside dropdown */}
                                  {selectedLesson?.id === lesson.id && (
                                    <div className="p-6 bg-gray-50 border-t">
                                      {lesson.content_type === "video" ? (
                                        <VideoPlayer url={lesson.content_url} title={lesson.title} />
                                      ) : lesson.content_type === "pdf" ? (
                                        <PDFViewer url={lesson.content_url} title={lesson.title} />
                                      ) : (
                                        <div className="aspect-video bg-white rounded-lg flex items-center justify-center border">
                                          <FileText className="h-16 w-16 text-gray-400" />
                                        </div>
                                      )}
                                      {lesson.description && (
                                        <p className="mt-4 text-sm text-gray-600">{lesson.description}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </Card>

                  {/* Requirements - Udemy Style */}
                  {course.requirements && (
                    <Card className="p-6">
                      <h2 className="text-2xl font-bold mb-6">Requirements</h2>
                      <ul className="space-y-3">
                        {course.requirements.split('\n').filter(r => r.trim()).map((req, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-gray-900 mt-1 font-bold">•</span>
                            <span className="text-gray-700">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Scheduled Classes */}
                  {scheduledClasses.length > 0 && (
                    <Card className="p-6">
                      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Video className="h-6 w-6" />
                        Upcoming Live Classes
                      </h2>
                      <div className="space-y-3">
                        {scheduledClasses.map((scheduledClass) => {
                          const classDate = new Date(scheduledClass.scheduled_time);
                          
                          return (
                            <Card key={scheduledClass.id} className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CalendarIcon className="h-4 w-4 text-primary" />
                                    <Badge variant="secondary">
                                      {classDate.toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })} at {classDate.toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: true 
                                      })}
                                    </Badge>
                                  </div>
                                  <h3 className="font-semibold text-lg mb-2">{scheduledClass.title}</h3>
                                  {scheduledClass.description && (
                                    <p className="text-sm text-muted-foreground mb-3">{scheduledClass.description}</p>
                                  )}
                                </div>
                                <Button 
                                  className="gap-2"
                                  onClick={() => window.open(scheduledClass.meet_link, '_blank')}
                                >
                                  <Video className="h-4 w-4" />
                                  Join Meeting
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </Card>
                  )}

                  {/* Description - Udemy Style */}
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6">Description</h2>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{course.description}</p>
                    </div>
                  </Card>
                </div>

                {/* Right Sidebar - Price Card */}
                <div>
                  <Card className="p-6 sticky top-6">
                    <div className="text-3xl font-bold mb-4">${course.price || 49.99}</div>
                    <Button className="w-full mb-4" size="lg" onClick={handleEnroll}>
                      Enroll Now
                    </Button>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{getTotalDuration()} minutes on-demand video</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{getTotalLessons()} lessons</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{enrolledCount} students enrolled</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
