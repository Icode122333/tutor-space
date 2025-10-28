import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Play, FileText, Link, ClipboardList, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  content_type: string;
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

interface CourseCurriculumProps {
  chapters: Chapter[];
  currentLessonId?: string;
  onLessonClick: (lessonId: string) => void;
}

export function CourseCurriculum({ chapters, currentLessonId, onLessonClick }: CourseCurriculumProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(chapters.map((c) => c.id))
  );

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const getLessonIcon = (contentType: string) => {
    switch (contentType) {
      case "video":
        return <Play className="h-4 w-4" />;
      case "pdf":
      case "document":
        return <FileText className="h-4 w-4" />;
      case "url":
        return <Link className="h-4 w-4" />;
      case "quiz":
      case "assignment":
        return <ClipboardList className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <Card className="h-fit sticky top-6">
      <CardContent className="p-0">
        <div className="space-y-2">
          {chapters.map((chapter, chapterIndex) => {
            const isExpanded = expandedChapters.has(chapter.id);
            const completedCount = chapter.lessons.filter((l) => l.is_completed).length;
            const totalLessons = chapter.lessons.length;
            
            return (
              <div key={chapter.id} className={cn(
                "border-b last:border-b-0",
                chapterIndex === 0 && "rounded-t-lg overflow-hidden"
              )}>
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {String(chapterIndex + 1).padStart(2, "0")}. {chapter.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {chapter.total_duration && (
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(chapter.total_duration)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {completedCount}/{totalLessons} completed
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="bg-muted/30">
                    {chapter.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => onLessonClick(lesson.id)}
                        className={cn(
                          "w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left border-t",
                          currentLessonId === lesson.id && "bg-primary/10 hover:bg-primary/20"
                        )}
                      >
                        <div className="flex-shrink-0">
                          {lesson.is_completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-shrink-0 text-muted-foreground">
                          {getLessonIcon(lesson.content_type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {lesson.title}
                          </div>
                          {lesson.duration && (
                            <div className="text-xs text-muted-foreground">
                              {lesson.duration} min
                            </div>
                          )}
                        </div>

                        {currentLessonId === lesson.id && (
                          <div className="flex-shrink-0 w-1 h-8 bg-primary rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
