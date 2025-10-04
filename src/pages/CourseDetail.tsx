import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Star, Users, BookOpen, Clock, PlayCircle, FileText, ArrowLeft, Code } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  teacher_id: string;
}

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolledCount, setEnrolledCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
    }
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Get enrolled count
      const { count } = await supabase
        .from("course_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("course_id", id);

      setEnrolledCount(count || 0);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
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
      navigate("/student/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Course not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  // Mock data for demonstration - in real app, fetch from database
  const mockChapters = [
    {
      title: "Front-End Web Development",
      lectures: 9,
      duration: "37min",
      items: [
        { title: "What You'll Get in This Course", type: "video", duration: "03:08", hasPreview: true },
        { title: "Download the Course Syllabus", type: "document", duration: "00:12", hasPreview: true },
        { title: "Download the 12 Rules to Learn to Code eBook [Latest Edition]", type: "document", duration: "00:42", hasPreview: false },
        { title: "Download the Required Software", type: "document", duration: "00:43", hasPreview: false },
        { title: "How Does the Internet Actually Work?", type: "video", duration: "05:27", hasPreview: true },
        { title: "How Do Websites Actually Work?", type: "video", duration: "08:22", hasPreview: true },
        { title: "How to Get the Most Out of the Course", type: "video", duration: "09:33", hasPreview: false },
        { title: "How to Get Help When You're Stuck", type: "video", duration: "06:39", hasPreview: false },
        { title: "Pathfinder", type: "document", duration: "02:23", hasPreview: false },
      ]
    },
    {
      title: "Introduction to HTML",
      lectures: 12,
      duration: "1h 24min",
      items: [
        { title: "Introduction to HTML", type: "video", duration: "06:15", hasPreview: true },
        { title: "HTML Tags and Elements", type: "video", duration: "08:45", hasPreview: false },
        { title: "Working with Text", type: "video", duration: "10:20", hasPreview: false },
      ]
    },
    {
      title: "Intermediate CSS",
      lectures: 15,
      duration: "2h 10min",
      items: [
        { title: "CSS Selectors Deep Dive", type: "video", duration: "12:30", hasPreview: true },
        { title: "Flexbox Layout", type: "video", duration: "15:45", hasPreview: false },
        { title: "Grid System", type: "video", duration: "18:20", hasPreview: false },
      ]
    }
  ];

  const requirements = [
    "No programming experience needed - I'll teach you everything you need to know",
    "A computer with access to the internet",
    "No paid software required",
    "I'll walk you through, step-by-step how to get all the software installed and set up"
  ];

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
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20">
              <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                      {course.title}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      {course.description || "Your career in full stack web development starts here. Fast-track learning and interview prep. Grow skills at your own pace. Expand your earnings potential."}
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-8">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                          <span className="text-2xl font-bold">4.7</span>
                        </div>
                        <p className="text-sm text-muted-foreground">average course rating</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <span className="text-2xl font-bold">126</span>
                        </div>
                        <p className="text-sm text-muted-foreground">practice exercises</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-5 w-5 text-primary" />
                          <span className="text-2xl font-bold">87.8</span>
                        </div>
                        <p className="text-sm text-muted-foreground">hours of content</p>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-4">
                      <Button 
                        size="lg" 
                        className="bg-primary hover:bg-primary/90 text-lg px-8"
                        onClick={handleEnroll}
                      >
                        Get started
                      </Button>
                      <span className="text-3xl font-bold">$199.97</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-5 w-5" />
                      <span className="text-sm">{enrolledCount.toLocaleString()} learners already enrolled</span>
                    </div>
                  </div>

                  {/* Course Thumbnail */}
                  <div className="relative">
                    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-800 dark:to-amber-700 aspect-video flex items-center justify-center">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="p-16 text-center">
                          <div className="w-32 h-32 mx-auto bg-white/30 dark:bg-black/30 rounded-2xl flex items-center justify-center mb-4">
                            <Code className="h-16 w-16 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Content */}
            <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
              {/* Chapters */}
              <section>
                <h2 className="text-3xl font-bold mb-6">Course Content</h2>
                <Accordion type="multiple" defaultValue={["chapter-0"]} className="space-y-4">
                  {mockChapters.map((chapter, chapterIndex) => (
                    <AccordionItem 
                      key={chapterIndex} 
                      value={`chapter-${chapterIndex}`}
                      className="border rounded-lg px-6"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center justify-between w-full pr-4">
                          <h3 className="text-lg font-semibold text-left">{chapter.title}</h3>
                          <span className="text-sm text-muted-foreground">
                            {chapter.lectures} lectures • {chapter.duration}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2 pb-4">
                          {chapter.items.map((item, itemIndex) => (
                            <div 
                              key={itemIndex} 
                              className="flex items-center justify-between py-3 hover:bg-muted/50 rounded-lg px-3 -mx-3 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {item.type === "video" ? (
                                  <PlayCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                ) : (
                                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                )}
                                <span className="text-sm">{item.title}</span>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                {item.hasPreview && (
                                  <Button variant="link" size="sm" className="text-primary">
                                    Preview
                                  </Button>
                                )}
                                <span className="text-sm text-muted-foreground min-w-[3rem] text-right">
                                  {item.duration}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>

              {/* Requirements */}
              <section>
                <h2 className="text-3xl font-bold mb-6">Requirements</h2>
                <ul className="space-y-3">
                  {requirements.map((req, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="text-lg">•</span>
                      <span className="text-muted-foreground">{req}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Description */}
              <section>
                <h2 className="text-3xl font-bold mb-6">Description</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Welcome to the Complete Web Development Bootcamp, <strong>the only course you need</strong> to learn to code and become a 
                    full-stack web developer. With 150,000+ ratings and a 4.8 average, my Web Development course is one of the 
                    HIGHEST RATED courses in the history of Udemy!
                  </p>
                  <p>
                    At 62+ hours, this Web Development course is without a doubt the <strong>most comprehensive</strong> web development course 
                    available online. Even if you have <strong>zero</strong> programming experience, this course will take you from <strong>beginner to mastery</strong>. 
                    Here's why:
                  </p>
                  <ul className="space-y-2 pl-6">
                    <li className="list-disc">
                      The course is taught by the <strong>lead instructor</strong> at the App Brewery, London's <strong>leading in-person programming 
                      bootcamp</strong>.
                    </li>
                    <li className="list-disc">
                      The course has been updated to be <strong>2024 ready</strong> and you'll be learning the latest tools and technologies used 
                      at large companies such as Apple, Google and Netflix.
                    </li>
                    <li className="list-disc">
                      This course doesn't cut any corners, there are beautiful <strong>animated explanation videos</strong> and tens of <strong>real-world 
                      projects</strong> which you will get to build.
                    </li>
                  </ul>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CourseDetail;
