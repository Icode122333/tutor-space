import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PdfJsInlineViewer from "@/components/PdfJsInlineViewer";

interface CourseContentPlayerProps {
  lesson: {
    id: string;
    title: string;
    description?: string;
    content_type: string;
    content_url: string;
    file_url?: string;
    duration?: number;
    is_completed?: boolean;
  } | null;
  studentId?: string;
  onComplete?: () => void;
  progressPercent?: number;
}

export function CourseContentPlayer({ lesson, studentId, onComplete, progressPercent = 0 }: CourseContentPlayerProps) {
  const { toast } = useToast();
  const [markingComplete, setMarkingComplete] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    // Auto-mark video lessons as started when loaded
    if (lesson && studentId && lesson.content_type === "video") {
      markLessonProgress(false);
    }
    // Resolve storage URLs for document-like content
    const resolve = async () => {
      if (!lesson) return setResolvedUrl(null);
      const raw = (lesson.file_url || lesson.content_url) || "";
      if (!raw) return setResolvedUrl(null);
      if (/^https?:\/\//i.test(raw)) {
        setResolvedUrl(raw);
        return;
      }
      try {
        // Assume the path belongs to the 'lesson-files' bucket
        const cleaned = raw.replace(/^\/+/, "");
        const path = cleaned.replace(/^lesson-files\//, "");
        // Prefer a signed URL (works with private buckets and external viewers)
        const { data: signed, error } = await supabase.storage.from("lesson-files").createSignedUrl(path, 3600);
        if (!error && signed?.signedUrl) {
          setResolvedUrl(signed.signedUrl);
          return;
        }
        // Fallback to a public URL if bucket/object is public
        const { data: pub } = supabase.storage.from("lesson-files").getPublicUrl(path);
        if (pub?.publicUrl) {
          setResolvedUrl(pub.publicUrl);
          return;
        }
        setResolvedUrl(raw);
      } catch (e) {
        console.error("Failed to resolve storage URL", e);
        setResolvedUrl(raw);
      }
    };
    setPdfError(false);
    resolve();
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

  const getOfficeViewerUrl = (url: string) => {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  };

  const getEmojiForProgress = (p: number) => {
    if (p < 25) return "😢";
    if (p < 50) return "🙂";
    if (p < 75) return "😊";
    return "🤩";
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
          {/* Top Bar: Progress + Mark as Done */}
          {studentId && lesson && lesson.content_type !== "quiz" && (
            <div className="flex flex-col gap-3 p-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="relative w-full h-3 rounded-full bg-white border border-[#0A400C]/30 overflow-hidden">
                    <div
                      className="h-full transition-all bg-gradient-to-r from-[#0A400C] via-green-600 to-emerald-500"
                      style={{ width: `${Math.round(progressPercent)}%` }}
                    />
                    <div
                      className="absolute -top-2 translate-x-1/2 right-0 text-base"
                      style={{ right: `calc(${Math.max(0, Math.min(100, Math.round(progressPercent)))}% - 10px)` }}
                    >
                      {getEmojiForProgress(progressPercent)}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-[#0A400C] whitespace-nowrap">
                  {Math.round(progressPercent)}% Complete
                </div>
              </div>
              <div>
                <Button
                  onClick={() => markLessonProgress(true)}
                  disabled={markingComplete || !!lesson.is_completed}
                  className="bg-[#0A400C] hover:bg-[#083308]"
                >
                  {lesson.is_completed ? "Completed" : (markingComplete ? "Marking..." : "Mark as Done")}
                </Button>
              </div>
            </div>
          )}

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

          {(lesson.content_type === "pdf" || lesson.content_type === "document" || lesson.content_type === "assignment") && (
            <div className="relative w-full rounded-t-lg overflow-hidden" style={{ minHeight: "60vh" }}>
              {(() => {
                const raw = (lesson.file_url || lesson.content_url) || "";
                const isUploaded = !!lesson.file_url;
                const candidate = isUploaded ? resolvedUrl : (/^https?:\/\//i.test(raw) ? raw : null);
                const lower = (candidate || raw).toLowerCase();
                const isPDF = lower.endsWith(".pdf") || lesson.content_type === "pdf";

                if (isPDF && isUploaded) {
                  if (!candidate) {
                    return (
                      <div className="w-full h-[60vh] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0A400C]" />
                      </div>
                    );
                  }
                  if (!pdfError) {
                    return <PdfJsInlineViewer src={candidate} onError={() => setPdfError(true)} />;
                  }
                  return (
                    <div className="relative w-full h-[60vh]">
                      <iframe
                        src={`${candidate}#toolbar=1&navpanes=1&scrollbar=1`}
                        title={lesson.title}
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                  );
                }

                const urlToOpen = candidate || raw;
                return (
                  <div className="p-12 bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4 break-all">{urlToOpen}</p>
                      <Button onClick={() => window.open(urlToOpen, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-2" /> Open in new tab
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {lesson.content_type === "url" && (
            <div className="p-12 bg-muted flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4 break-all">{lesson.content_url}</p>
                <Button onClick={() => window.open(lesson.content_url, "_blank")}> 
                  <ExternalLink className="h-4 w-4 mr-2" /> Open in new tab
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
        </CardContent>
      </Card>
    </div>
  );
}
