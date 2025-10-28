import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, PlayCircle, FileText, Video, ArrowLeft, Calendar as CalendarIcon, CheckCircle2, Award, ClipboardList, Link as LinkIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import VideoPlayer from "@/components/VideoPlayer";
import PDFViewer from "@/components/PDFViewer";
import { EmbeddedContentViewer } from "@/components/EmbeddedContentViewer";
import { QuizTaker } from "@/components/QuizTaker";
import { CapstoneSubmission } from "@/components/CapstoneSubmission";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import LoadingSpinner from "@/components/LoadingSpinner";

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
  is_mandatory: boolean;
  is_completed?: boolean;
  quiz_passed?: boolean;
}

interface ChapterProgress {
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  all_completed: boolean;
}

interface CapstoneProject {
  id: string;
  title: string;
  description: string;
  instructions: string;
  requirements: string[];
  due_date: string | null;
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
  const [userId, setUserId] = useState<string | null>(null);
  const [courseProgress, setCourseProgress] = useState<number>(0);
  const [chapterProgress, setChapterProgress] = useState<Record<string, ChapterProgress>>({});
  const [showEmbeddedViewer, setShowEmbeddedViewer] = useState(false);
  const [selectedViewerLesson, setSelectedViewerLesson] = useState<Lesson | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedQuizLesson, setSelectedQuizLesson] = useState<Lesson | null>(null);
  const [capstoneProject, setCapstoneProject] = useState<CapstoneProject | null>(null);
  const [showCapstone, setShowCapstone] = useState(false);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();

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

      // Fetch lessons for each chapter with progress
      const { data: { user } } = await supabase.auth.getUser();
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

          // Fetch progress for each lesson if user is logged in
          const lessonsWithProgress = user ? await Promise.all(
            (lessonsData || []).map(async (lesson) => {
              const { data: progressData } = await supabase
                .from("student_lesson_progress")
                .select("is_completed")
                .eq("student_id", user.id)
                .eq("lesson_id", lesson.id)
                .single();

              // Check if quiz was passed for quiz lessons
              let quizPassed = false;
              if (lesson.content_type === "quiz") {
                const { data: quizData } = await supabase
                  .from("student_quiz_attempts")
                  .select("passed")
                  .eq("student_id", user.id)
                  .eq("lesson_id", lesson.id)
                  .eq("passed", true)
                  .single();
                quizPassed = !!quizData;
              }

              return {
                ...lesson,
                is_completed: progressData?.is_completed || false,
                quiz_passed: quizPassed,
              };
            })
          ) : lessonsData;

          return { ...chapter, lessons: lessonsWithProgress };
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

    const fetchCapstoneProject = async () => {
      const { data, error } = await supabase
        .from("capstone_projects")
        .select("*")
        .eq("course_id", id)
        .single();

      if (data) {
        setCapstoneProject(data);
      }
    };

    if (id) {
      fetchCourse();
      fetchChapters();
      fetchEnrolledCount();
      fetchScheduledClasses();
      fetchCapstoneProject();
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (userId && id) {
      fetchCourseProgress();
    }
  }, [userId, id, chapters]);

  const fetchCourseProgress = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .rpc("calculate_course_progress", {
          p_student_id: userId,
          p_course_id: id,
        });

      if (!error && data && data.length > 0) {
        setCourseProgress(data[0].progress_percentage || 0);
      }

      // Fetch progress for each chapter
      for (const chapter of chapters) {
        const { data: chapterData } = await supabase
          .rpc("calculate_chapter_progress", {
            p_student_id: userId,
            p_chapter_id: chapter.id,
          });

        if (chapterData && chapterData.length > 0) {
          setChapterProgress(prev => ({
            ...prev,
            [chapter.id]: chapterData[0]
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };

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

  const handleLessonClick = async (lesson: Lesson) => {
    if (!userId) {
      toast.error("Please log in to access lessons");
      return;
    }

    // Check if previous lesson is mandatory and not passed
    const chapterForLesson = chapters.find(ch => ch.lessons.some(l => l.id === lesson.id));
    if (chapterForLesson) {
      const lessonIndex = chapterForLesson.lessons.findIndex(l => l.id === lesson.id);
      if (lessonIndex > 0) {
        const previousLesson = chapterForLesson.lessons[lessonIndex - 1];
        if (previousLesson.is_mandatory && previousLesson.content_type === "quiz") {
          // Check if quiz was passed
          const { data } = await supabase
            .from("student_quiz_attempts")
            .select("passed")
            .eq("student_id", userId)
            .eq("lesson_id", previousLesson.id)
            .eq("passed", true)
            .single();

          if (!data) {
            toast.error("You must pass the previous quiz before accessing this lesson");
            return;
          }
        }
      }
    }

    if (lesson.content_type === "quiz") {
      setSelectedQuizLesson(lesson);
      setShowQuiz(true);
    } else {
      setSelectedViewerLesson(lesson);
      setShowEmbeddedViewer(true);
    }
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    setSelectedQuizLesson(null);
    fetchCourseProgress(); // Refresh progress
    toast.success("Moving to next lesson...");
  };

  const handleViewerClose = () => {
    setShowEmbeddedViewer(false);
    setSelectedViewerLesson(null);
    fetchCourseProgress(); // Refresh progress
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5" />;
      case "pdf":
      case "document":
        return <FileText className="h-5 w-5" />;
      case "url":
        return <LinkIcon className="h-5 w-5" />;
      case "quiz":
        return <ClipboardList className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
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
    return <LoadingSpinner />;
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
                  {/* Progress Bar */}
                  {userId && courseProgress > 0 && (
                    <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Your Progress</h3>
                        <span className="text-lg font-bold text-green-600">{Math.round(courseProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${courseProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Keep going! You're doing great!
                      </p>
                    </Card>
                  )}

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
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">
                                    Chapter {index + 1}: {chapter.title}
                                  </span>
                                  {chapterProgress[chapter.id]?.all_completed && (
                                    <Badge className="bg-green-500 text-white">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Completed
                                    </Badge>
                                  )}
                                </div>
                                {userId && chapterProgress[chapter.id] && (
                                  <p className="text-xs text-green-600 mt-1">
                                    {chapterProgress[chapter.id].completed_lessons}/{chapterProgress[chapter.id].total_lessons} lessons completed ({Math.round(chapterProgress[chapter.id].progress_percentage)}%)
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {chapter.lessons.length} lectures • {chapter.lessons.reduce((sum, l) => sum + (l.duration || 0), 0)}min
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="border-t">
                            <div className="divide-y">
                              {chapter.lessons.map((lesson) => (
                                <button
                                  key={lesson.id}
                                  onClick={() => handleLessonClick(lesson)}
                                  className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors text-left group"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="text-gray-600 group-hover:text-purple-600 transition-colors">
                                      {getContentTypeIcon(lesson.content_type)}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                                          {lesson.title}
                                        </span>
                                        {lesson.is_completed && (
                                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        )}
                                        {lesson.is_mandatory && (
                                          <Badge variant="destructive" className="text-xs">Required</Badge>
                                        )}
                                      </div>
                                      {lesson.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{lesson.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {lesson.duration && (
                                      <span className="text-sm text-gray-600">
                                        {String(Math.floor(lesson.duration / 60)).padStart(2, '0')}:{String(lesson.duration % 60).padStart(2, '0')}
                                      </span>
                                    )}
                                  </div>
                                </button>
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

                  {/* Capstone Project Section */}
                  {capstoneProject && userId && (
                    <Card className="p-6 border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Award className="h-8 w-8 text-purple-600" />
                          <div>
                            <h2 className="text-2xl font-bold text-purple-900">Capstone Project</h2>
                            <p className="text-sm text-purple-700">Final project to demonstrate your skills</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowCapstone(true)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          View Project
                        </Button>
                      </div>
                      <p className="text-gray-700">{capstoneProject.description}</p>
                    </Card>
                  )}
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

      {/* Embedded Content Viewer */}
      {showEmbeddedViewer && selectedViewerLesson && userId && (
        <EmbeddedContentViewer
          lessonId={selectedViewerLesson.id}
          contentType={selectedViewerLesson.content_type as any}
          contentUrl={selectedViewerLesson.content_url}
          title={selectedViewerLesson.title}
          studentId={userId}
          onClose={handleViewerClose}
        />
      )}

      {/* Quiz Taker */}
      {showQuiz && selectedQuizLesson && userId && (
        <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto">
          <div className="min-h-screen p-4">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">{selectedQuizLesson.title}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowQuiz(false);
                    setSelectedQuizLesson(null);
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
              <QuizTaker
                lessonId={selectedQuizLesson.id}
                studentId={userId}
                onComplete={handleQuizComplete}
              />
            </div>
          </div>
        </div>
      )}

      {/* Capstone Submission */}
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
    </SidebarProvider>
  );
}
