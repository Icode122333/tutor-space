import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Download, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CourseContentPlayerProps {
  lesson: {
    id: string;
    title: string;
    description?: string;
    content_type: string;
    content_url: string;
    file_url?: string;
    duration?: number;
  } | null;
  studentId?: string;
  onComplete?: () => void;
}

export function CourseContentPlayer({ lesson, studentId, onComplete }: CourseContentPlayerProps) {
  const { toast } = useToast();
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    // Auto-mark video lessons as started when loaded
    if (lesson && studentId && lesson.content_type === "video") {
      markLessonProgress(false);
    }
  }, [lesson?.id, studentId]);

  const markLessonProgress = async (isComplete: boolean) => {
    if (!lesson || !studentId) return;

    try {
      setMarkingComplete(true);
      
      const { error } = await supabase
        .from("student_lesson_progress")
        .upsert({
          student_id: studentId,
          lesson_id: lesson.id,
          is_completed: isComplete,
          completed_at: isComplete ? new Date().toISOString() : null,
        }, {
          onConflict: "student_id,lesson_id"
        });

      if (error) throw error;

      if (isComplete) {
        toast({
          title: "Lesson completed!",
          description: "Your progress has been saved.",
        });
        onComplete?.();
      }
    } catch (error) {
      console.error("Error marking progress:", error);
    } finally {
      setMarkingComplete(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const handleExternalLinkClick = () => {
    const url = lesson?.file_url || lesson?.content_url;
    if (url) {
      window.open(url, "_blank");
      if (studentId && lesson) {
        markLessonProgress(true);
      }
    }
  };

  if (!lesson) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No lesson selected</h3>
          <p className="text-muted-foreground">
            Select a lesson from the curriculum to begin
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          {lesson.content_type === "video" && (
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              {(() => {
                const embedUrl = getYouTubeEmbedUrl(lesson.content_url);
                if (embedUrl) {
                  return (
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-t-lg"
                      src={embedUrl}
                      title={lesson.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                return (
                  <div className="absolute top-0 left-0 w-full h-full bg-muted flex items-center justify-center">
                    <div className="text-center p-6">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Unable to load video. Please check the URL.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {(lesson.content_type === "pdf" || 
            lesson.content_type === "document" || 
            lesson.content_type === "assignment") && (
            <div className="bg-gradient-to-br from-primary/10 to-purple-100 p-12 rounded-t-lg">
              <div className="text-center max-w-md mx-auto">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {lesson.content_type === "assignment" ? "Assignment" : "Document"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {lesson.content_type === "assignment" 
                    ? "Click below to open and complete the assignment"
                    : "Click below to open and view the document"}
                </p>
                <Button
                  onClick={handleExternalLinkClick}
                  size="lg"
                  className="w-full"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Open {lesson.content_type === "pdf" ? "PDF" : "Document"} in New Tab
                </Button>
              </div>
            </div>
          )}

          {lesson.content_type === "url" && (
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-12 rounded-t-lg">
              <div className="text-center max-w-md mx-auto">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <ExternalLink className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">External Resource</h3>
                <p className="text-muted-foreground mb-4 text-sm break-all">
                  {lesson.content_url}
                </p>
                <Button
                  onClick={handleExternalLinkClick}
                  size="lg"
                  className="w-full"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Open Resource in New Tab
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-2">{lesson.title}</h2>
          {lesson.description && (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {lesson.description}
            </p>
          )}
          {lesson.duration && (
            <div className="mt-4 text-sm text-muted-foreground">
              Duration: {lesson.duration} minutes
            </div>
          )}

          {studentId && lesson.content_type === "video" && (
            <div className="mt-6 pt-6 border-t">
              <Button
                onClick={() => markLessonProgress(true)}
                disabled={markingComplete}
                className="w-full"
              >
                {markingComplete ? "Marking complete..." : "Mark as Complete"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
