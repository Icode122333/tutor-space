import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, PlayCircle, FileText, Video, ArrowLeft } from "lucide-react";
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

    if (id) {
      fetchCourse();
      fetchChapters();
      fetchEnrolledCount();
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
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white">
              <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div>
                    <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                    <p className="text-lg mb-6 text-white/90">{course.description}</p>
                    
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 fill-current" />
                        <span className="font-semibold">4.8</span>
                        <span className="text-white/80">(1,234 ratings)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <span>{enrolledCount} students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        <span>{getTotalDuration()} mins total</span>
                      </div>
                    </div>

                    <Button 
                      size="lg" 
                      className="bg-white text-primary hover:bg-white/90"
                      onClick={handleEnroll}
                    >
                      Enroll Now - ${course.price || 49.99}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column - Video Player & Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Video/PDF Player */}
                  {selectedLesson && (
                    <Card className="p-6">
                      <h3 className="text-xl font-bold mb-4">{selectedLesson.title}</h3>
                      {selectedLesson.content_type === "video" ? (
                        <VideoPlayer url={selectedLesson.content_url} title={selectedLesson.title} />
                      ) : selectedLesson.content_type === "pdf" ? (
                        <PDFViewer url={selectedLesson.content_url} title={selectedLesson.title} />
                      ) : (
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <FileText className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      {selectedLesson.description && (
                        <p className="mt-4 text-muted-foreground">{selectedLesson.description}</p>
                      )}
                    </Card>
                  )}

                  {/* Course Content */}
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4">
                      Course Content ({chapters.length} chapters • {getTotalLessons()} lessons)
                    </h2>
                    <div className="space-y-2">
                      {chapters.map((chapter) => (
                        <Collapsible
                          key={chapter.id}
                          open={openChapters.has(chapter.id)}
                          onOpenChange={() => toggleChapter(chapter.id)}
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <PlayCircle className="h-5 w-5" />
                              <div className="text-left">
                                <div className="font-semibold">{chapter.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {chapter.lessons.length} lectures • {chapter.lessons.reduce((sum, l) => sum + (l.duration || 0), 0)} min
                                </div>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-4 pb-2">
                            <div className="space-y-1 ml-8">
                              {chapter.lessons.map((lesson) => (
                                <button
                                  key={lesson.id}
                                  onClick={() => setSelectedLesson(lesson)}
                                  className={`flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded ${
                                    selectedLesson?.id === lesson.id ? "bg-muted" : ""
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {lesson.content_type === "video" ? (
                                      <Video className="h-4 w-4" />
                                    ) : (
                                      <FileText className="h-4 w-4" />
                                    )}
                                    <span className="text-sm">{lesson.title}</span>
                                  </div>
                                  {lesson.duration && (
                                    <span className="text-sm text-muted-foreground">{lesson.duration} min</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </Card>

                  {/* Requirements */}
                  {course.requirements && (
                    <Card className="p-6">
                      <h2 className="text-2xl font-bold mb-4">Requirements</h2>
                      <ul className="space-y-2">
                        {course.requirements.split('\n').filter(r => r.trim()).map((req, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Description */}
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Description</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">{course.description}</p>
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
