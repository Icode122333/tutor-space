import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Clock, BookOpen, Globe, Award, FileText, ClipboardList, Play, Users, Star, CheckCircle2, GraduationCap, Target, Zap } from "lucide-react";
import { CourseCurriculum } from "@/components/CourseCurriculum";
import { CourseContentPlayer } from "@/components/CourseContentPlayer";
import { QuizTaker } from "@/components/QuizTaker";
import { CapstoneSubmission } from "@/components/CapstoneSubmission";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCapstone, setShowCapstone] = useState(false);
  const [capstoneProject, setCapstoneProject] = useState<CapstoneProject | null>(null);
  const [isWelcomeSelected, setIsWelcomeSelected] = useState(false);

  // Check if user is a student (not teacher/admin)
  const isStudent = userRole === 'student';

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Fetch user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) setUserRole(profile.role);
      }
      
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

    // OPTIMIZED: Single query to get chapters with lessons using join
    const { data: chaptersData, error: chaptersError } = await supabase
      .from("course_chapters")
      .select(`
        id,
        title,
        order_index,
        course_lessons (
          id,
          title,
          description,
          content_type,
          content_url,
          file_url,
          duration,
          order_index
        )
      `)
      .eq("course_id", id)
      .order("order_index");

    if (chaptersError) {
      console.error("Error fetching chapters:", chaptersError);
      return;
    }

    // Get all lesson IDs for progress query
    const allLessonIds = (chaptersData || []).flatMap(ch => 
      (ch.course_lessons || []).map(l => l.id)
    );

    // OPTIMIZED: Single query for ALL lesson progress instead of N queries
    let progressMap = new Map<string, boolean>();
    if (userId && allLessonIds.length > 0) {
      const { data: progressData } = await supabase
        .from("student_lesson_progress")
        .select("lesson_id, is_completed")
        .eq("student_id", userId)
        .in("lesson_id", allLessonIds);

      if (progressData) {
        progressData.forEach(p => progressMap.set(p.lesson_id, p.is_completed));
      }
    }

    // Map chapters with lessons and progress
    const chaptersWithLessons = (chaptersData || []).map(chapter => {
      const lessons = (chapter.course_lessons || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map(lesson => ({
          ...lesson,
          is_completed: progressMap.get(lesson.id) || false,
        }));

      const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);

      return {
        id: chapter.id,
        title: chapter.title,
        order_index: chapter.order_index,
        lessons,
        total_duration: totalDuration,
      };
    });

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
      // Teachers can view quiz but not take it
      if (!isStudent) {
        toast({ title: "Preview Mode", description: "Teachers can view quiz questions but cannot submit answers" });
      }
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
        // Only track progress for students
        if (userId && isStudent) {
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
        } else if (!isStudent) {
          toast({ title: "Opened in new tab", description: "Preview mode - progress not tracked" });
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

  const counts = getCounts();
  const progressPercent = getProgressPercent();
  const totalDuration = getTotalDuration();
  const totalLessons = getTotalLessons();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Premium Hero Header */}
      <div className="relative bg-gradient-to-br from-[#0A400C] via-[#0d5210] to-[#116315] overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="text-white/80 hover:text-white hover:bg-white/10 mb-4"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>

          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Left Content - 3 columns */}
            <div className="lg:col-span-3 space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3">
                {course.level && (
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1">
                    <Target className="h-3 w-3 mr-1.5" />
                    {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                  </Badge>
                )}
                {course.language && (
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1">
                    <Globe className="h-3 w-3 mr-1.5" />
                    {course.language}
                  </Badge>
                )}
                <Badge className="bg-yellow-500/90 text-white border-0 px-3 py-1">
                  <Star className="h-3 w-3 mr-1.5 fill-current" />
                  Bestseller
                </Badge>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
                {course.title}
              </h1>

              {/* Description */}
              {course.description && (
                <p className="text-lg text-white/80 leading-relaxed max-w-2xl line-clamp-3">
                  {course.description}
                </p>
              )}

              {/* Instructor */}
              {teacher && (
                <div className="flex items-center gap-4 pt-2">
                  <Avatar className="h-12 w-12 border-2 border-white/30">
                    {teacher.avatar_url ? (
                      <AvatarImage src={teacher.avatar_url} alt={teacher.full_name} />
                    ) : (
                      <AvatarFallback className="bg-white/20 text-white">
                        {teacher.full_name?.charAt(0) || 'T'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-white/60 text-sm">Instructor</p>
                    <p className="text-white font-semibold">{teacher.full_name}</p>
                  </div>
                </div>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-white/80">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span className="font-medium">{totalLessons} Lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">{Math.round(totalDuration / 60)} Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">{chapters.length} Chapters</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  <span className="font-medium">Certificate</span>
                </div>
              </div>

              {/* Content Type Stats - Below Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Play className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{counts.videos}</p>
                    <p className="text-xs text-white/60">Videos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{counts.reading}</p>
                    <p className="text-xs text-white/60">Reading</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="w-11 h-11 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-orange-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{counts.quizzes}</p>
                    <p className="text-xs text-white/60">Quizzes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Award className="h-5 w-5 text-green-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{counts.assignments}</p>
                    <p className="text-xs text-white/60">Assignments</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Course Card - 2 columns */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden shadow-2xl border-0 bg-white">
                {/* Thumbnail with Play Button */}
                <div className="relative aspect-video bg-gray-900 group cursor-pointer" onClick={() => {
                  if (course.welcome_video_url) {
                    setShowQuiz(false);
                    setCurrentLesson(null);
                    setCurrentLessonId(null);
                    setIsWelcomeSelected(true);
                  }
                }}>
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0A400C] to-[#116315] flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-white/30" />
                    </div>
                  )}
                  {/* Play Button Overlay */}
                  {course.welcome_video_url && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 text-[#0A400C] ml-1" fill="currentColor" />
                      </div>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* CTA Button */}
                  <Button 
                    className="w-full h-11 bg-[#0A400C] hover:bg-[#0d5210] text-white font-semibold text-sm shadow-md rounded-xl transition-all hover:shadow-lg"
                    onClick={() => {
                      if (chapters.length > 0 && chapters[0].lessons.length > 0) {
                        handleLessonClick(chapters[0].lessons[0].id);
                      }
                    }}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {progressPercent > 0 ? 'Continue Learning' : 'Start Learning'}
                  </Button>

                  {/* Quick Info */}
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{Math.round(totalDuration / 60)}h total</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{totalLessons} lessons</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Overview Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* What You'll Learn */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#0A400C]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[#0A400C]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">What You'll Learn</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "Master core concepts and fundamentals",
                  "Build real-world projects and applications",
                  "Learn industry best practices",
                  "Gain practical hands-on experience",
                  "Prepare for professional certification",
                  "Access lifetime course materials"
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <CheckCircle2 className="h-5 w-5 text-[#0A400C] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Target className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Requirements</h2>
              </div>
              <div className="space-y-3">
                {course.requirements ? (
                  course.requirements.split('\n').filter(r => r.trim()).map((req, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                      <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-orange-700">{index + 1}</span>
                      </div>
                      <span className="text-gray-700 text-sm">{req}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                      <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-orange-700">1</span>
                      </div>
                      <span className="text-gray-700 text-sm">Basic computer skills</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                      <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-orange-700">2</span>
                      </div>
                      <span className="text-gray-700 text-sm">Willingness to learn</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                      <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-orange-700">3</span>
                      </div>
                      <span className="text-gray-700 text-sm">Internet connection</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
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
                    isPreviewMode={!isStudent}
                  />
                </CardContent>
              </Card>
            ) : (
              <CourseContentPlayer
                lesson={currentLesson}
                studentId={userId || undefined}
                onComplete={handleLessonComplete}
                progressPercent={getProgressPercent()}
                isPreviewMode={!isStudent}
              />
            )}
          </div>

          {/* Right Side - Curriculum */}
          <div className="space-y-6">
            {/* Assignments Card - Only for students */}
            {userId && isStudent && getCounts().assignments > 0 && (
              <Card className="border-2 border-orange-200 bg-orange-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-orange-100 rounded-full p-3">
                      <ClipboardList className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-900">Assignments</h3>
                      <p className="text-xs text-orange-700">
                        {getCounts().assignments} assignment{getCounts().assignments !== 1 ? 's' : ''} available
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/student/assignments')}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Submit Your Assignment
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Course Curriculum */}
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

            {/* Capstone Project Card - Only for students */}
            {capstoneProject && userId && isStudent && (
              <Card>
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
