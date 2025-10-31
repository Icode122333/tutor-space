import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Clock, BookOpen, Globe, Award, FileText, ClipboardList } from "lucide-react";
import { CourseCurriculum } from "@/components/CourseCurriculum";
import { CourseContentPlayer } from "@/components/CourseContentPlayer";
import { QuizTaker } from "@/components/QuizTaker";
import { CapstoneSubmission } from "@/components/CapstoneSubmission";
import { useToast } from "@/hooks/use-toast";

interface Teacher {
  full_name: string;
  avatar_url?: string;
  email: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  teacher_id: string;
  welcome_video_url?: string;
  level?: string;
  language?: string;
  requirements?: string;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  content_type: string;
  content_url: string;
  file_url?: string;
  duration?: number;
  order_index: number;
  is_completed?: boolean;
}

interface Chapter {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
  total_duration?: number;
}

interface CapstoneProject {
  id: string;
  title: string;
  description: string;
  instructions: string;
  requirements: string[];
  due_date: string | null;
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCapstone, setShowCapstone] = useState(false);
  const [capstoneProject, setCapstoneProject] = useState<CapstoneProject | null>(null);
  const [isWelcomeSelected, setIsWelcomeSelected] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      
      await Promise.all([
        fetchCourse(),
        fetchChapters(),
        fetchCapstone(),
      ]);
      
      setLoading(false);
    };
    init();
  }, [id]);

  const fetchCourse = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching course:", error);
      toast({ title: "Error", description: "Failed to load course", variant: "destructive" });
      return;
    }

    setCourse(data);

    // Fetch teacher info
    const { data: teacherData } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, email")
      .eq("id", data.teacher_id)
      .single();

    if (teacherData) setTeacher(teacherData);
  };

  const fetchChapters = async () => {
    if (!id) return;

    const { data: chaptersData, error: chaptersError } = await supabase
      .from("course_chapters")
      .select("*")
      .eq("course_id", id)
      .order("order_index");

    if (chaptersError) {
      console.error("Error fetching chapters:", chaptersError);
      return;
    }

    const chaptersWithLessons = await Promise.all(
      (chaptersData || []).map(async (chapter) => {
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("course_lessons")
          .select("*")
          .eq("chapter_id", chapter.id)
          .order("order_index");

        if (lessonsError) {
          console.error("Error fetching lessons:", lessonsError);
          return { ...chapter, lessons: [], total_duration: 0 };
        }

        // Fetch progress if user is logged in
        const lessonsWithProgress = userId ? await Promise.all(
          (lessonsData || []).map(async (lesson) => {
            const { data: progressData } = await supabase
              .from("student_lesson_progress")
              .select("is_completed")
              .eq("student_id", userId)
              .eq("lesson_id", lesson.id)
              .single();

            return {
              ...lesson,
              is_completed: progressData?.is_completed || false,
            };
          })
        ) : lessonsData;

        const totalDuration = lessonsWithProgress.reduce((sum, l) => sum + (l.duration || 0), 0);

        return {
          id: chapter.id,
          title: chapter.title,
          order_index: chapter.order_index,
          lessons: lessonsWithProgress,
          total_duration: totalDuration,
        };
      })
    );

    setChapters(chaptersWithLessons);

    // Auto-select first lesson
    if (chaptersWithLessons.length > 0 && chaptersWithLessons[0].lessons.length > 0) {
      const firstLesson = chaptersWithLessons[0].lessons[0];
      setCurrentLessonId(firstLesson.id);
      setCurrentLesson(firstLesson);
    }
  };

  const getCounts = () => {
    let videos = 0, reading = 0, quizzes = 0, assignments = 0;
    chapters.forEach((ch) => {
      ch.lessons.forEach((l) => {
        switch (l.content_type) {
          case "video":
            videos++;
            break;
          case "pdf":
          case "document":
          case "url":
            reading++;
            break;
          case "quiz":
            quizzes++;
            break;
          case "assignment":
            assignments++;
            break;
        }
      });
    });
    return { videos, reading, quizzes, assignments };
  };

  const getProgressPercent = () => {
    const totalLessons = getTotalLessons();
    if (totalLessons === 0) return 0;
    const completed = chapters.reduce((sum, ch) => sum + ch.lessons.filter((l) => l.is_completed).length, 0);
    return (completed / totalLessons) * 100;
  };

  const fetchCapstone = async () => {
    if (!id) return;

    const { data } = await supabase
      .from("capstone_projects")
      .select("*")
      .eq("course_id", id)
      .single();

    if (data) setCapstoneProject(data);
  };

  const handleLessonClick = async (lessonId: string) => {
    setIsWelcomeSelected(false);
    const lesson = chapters
      .flatMap((ch) => ch.lessons)
      .find((l) => l.id === lessonId);

    if (!lesson) return;

    if (lesson.content_type === "quiz") {
      setCurrentLesson(lesson);
      setShowQuiz(true);
    } else {
      const isUrlDoc =
        (lesson.content_type === "pdf" || lesson.content_type === "document" || lesson.content_type === "assignment") &&
        !!lesson.content_url && !lesson.file_url;
      if (lesson.content_type === "url" || isUrlDoc) {
        if (lesson.content_url) {
          window.open(lesson.content_url, "_blank");
        }
        if (userId) {
          try {
            await supabase.from("student_lesson_progress").upsert(
              {
                student_id: userId,
                lesson_id: lesson.id,
                is_completed: true,
                completed_at: new Date().toISOString(),
              },
              { onConflict: "student_id,lesson_id" }
            );
            await fetchChapters();
            toast({ title: "Opened in new tab", description: "Marked as completed" });
          } catch (e) {
            console.error("Error marking URL lesson complete", e);
          }
        }
        return;
      }
      setCurrentLessonId(lessonId);
      setCurrentLesson(lesson);
      setShowQuiz(false);
    }
  };

  const handleQuizComplete = async () => {
    setShowQuiz(false);
    await fetchChapters(); // Refresh to update progress
    toast({ title: "Quiz completed!", description: "Great job! Moving to next lesson..." });
  };

  const handleLessonComplete = async () => {
    await fetchChapters(); // Refresh progress
  };

  const getTotalLessons = () => {
    return chapters.reduce((total, ch) => total + ch.lessons.length, 0);
  };

  const getTotalDuration = () => {
    return chapters.reduce((total, ch) => total + (ch.total_duration || 0), 0);
  };

  const getLevelBadgeColor = (level?: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Redesigned Header */}
      <div className="bg-gradient-to-br from-amber-100 via-amber-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {/* Left - Title and meta */}
                <div className="lg:col-span-2">
                  <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
                  <div className="flex items-center gap-3 mb-4">
                    {course.level && (
                      <Badge className={getLevelBadgeColor(course.level)}>
                        {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                      </Badge>
                    )}
                    {course.language && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span>{course.language}</span>
                      </div>
                    )}
                  </div>
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-white/70">
                      <BookOpen className="h-4 w-4 text-[#0A400C]" />
                      <div className="text-sm"><span className="font-semibold">{getCounts().videos}</span> Videos</div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-white/70">
                      <FileText className="h-4 w-4 text-[#0A400C]" />
                      <div className="text-sm"><span className="font-semibold">{getCounts().reading}</span> Reading</div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-white/70">
                      <ClipboardList className="h-4 w-4 text-[#0A400C]" />
                      <div className="text-sm"><span className="font-semibold">{getCounts().quizzes}</span> Quizzes</div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-white/70">
                      <ClipboardList className="h-4 w-4 text-[#0A400C]" />
                      <div className="text-sm"><span className="font-semibold">{getCounts().assignments}</span> Assignments</div>
                    </div>
                  </div>
                </div>
                {/* Right - Thumbnail */}
                <div className="w-full">
                  <div className="relative rounded-2xl overflow-hidden bg-amber-200/40 border aspect-[4/3] flex items-center justify-center">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="text-muted-foreground">No Thumbnail</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Side - Content Player */}
          <div className="lg:col-span-2">
            {isWelcomeSelected && course.welcome_video_url ? (
              <Card>
                <CardContent className="p-4">
                  <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      src={course.welcome_video_url.includes("youtube.com") || course.welcome_video_url.includes("youtu.be")
                        ? course.welcome_video_url.replace("watch?v=", "embed/").split("&")[0]
                        : course.welcome_video_url
                      }
                      title="Welcome Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            ) : showQuiz && currentLesson && userId ? (
              <Card>
                <CardContent className="p-6">
                  <QuizTaker
                    lessonId={currentLesson.id}
                    studentId={userId}
                    onComplete={handleQuizComplete}
                  />
                </CardContent>
              </Card>
            ) : (
              <CourseContentPlayer
                lesson={currentLesson}
                studentId={userId || undefined}
                onComplete={handleLessonComplete}
                progressPercent={getProgressPercent()}
              />
            )}
          </div>

          {/* Right Side - Curriculum */}
          <div>
            <CourseCurriculum
              chapters={chapters}
              currentLessonId={currentLessonId || undefined}
              onLessonClick={handleLessonClick}
              welcomeVideoUrl={course.welcome_video_url}
              onSelectWelcome={() => {
                setShowQuiz(false);
                setCurrentLesson(null);
                setCurrentLessonId(null);
                setIsWelcomeSelected(true);
              }}
              isWelcomeSelected={isWelcomeSelected}
            />

            {/* Capstone Project Card */}
            {capstoneProject && userId && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-100 rounded-full p-3">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Capstone Project</h3>
                      <p className="text-xs text-muted-foreground">Final project</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowCapstone(true)}
                    className="w-full"
                    variant="outline"
                  >
                    View Project
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Capstone Modal */}
      {showCapstone && capstoneProject && userId && (
        <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto">
          <div className="min-h-screen p-4">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl my-8">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Capstone Project</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCapstone(false)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6">
                <CapstoneSubmission
                  capstoneProject={capstoneProject}
                  studentId={userId}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
