import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Lesson {
  title: string;
  description: string;
  content_type: "video" | "pdf" | "document";
  content_url: string;
  duration?: number;
  order_index: number;
}

interface Chapter {
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

export default function CreateCourse() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    price: "",
    requirements: "",
    thumbnail_url: "",
  });
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [openChapters, setOpenChapters] = useState<Set<number>>(new Set([0]));

  const addChapter = () => {
    setChapters([...chapters, {
      title: "",
      description: "",
      order_index: chapters.length,
      lessons: []
    }]);
    setOpenChapters(new Set([...openChapters, chapters.length]));
  };

  const removeChapter = (chapterIndex: number) => {
    setChapters(chapters.filter((_, i) => i !== chapterIndex));
  };

  const addLesson = (chapterIndex: number) => {
    const newChapters = [...chapters];
    newChapters[chapterIndex].lessons.push({
      title: "",
      description: "",
      content_type: "video",
      content_url: "",
      order_index: newChapters[chapterIndex].lessons.length
    });
    setChapters(newChapters);
  };

  const removeLesson = (chapterIndex: number, lessonIndex: number) => {
    const newChapters = [...chapters];
    newChapters[chapterIndex].lessons = newChapters[chapterIndex].lessons.filter((_, i) => i !== lessonIndex);
    setChapters(newChapters);
  };

  const updateChapter = (chapterIndex: number, field: string, value: string) => {
    const newChapters = [...chapters];
    newChapters[chapterIndex] = { ...newChapters[chapterIndex], [field]: value };
    setChapters(newChapters);
  };

  const updateLesson = (chapterIndex: number, lessonIndex: number, field: string, value: string | number) => {
    const newChapters = [...chapters];
    newChapters[chapterIndex].lessons[lessonIndex] = {
      ...newChapters[chapterIndex].lessons[lessonIndex],
      [field]: value
    };
    setChapters(newChapters);
  };

  const toggleChapter = (index: number) => {
    const newOpen = new Set(openChapters);
    if (newOpen.has(index)) {
      newOpen.delete(index);
    } else {
      newOpen.add(index);
    }
    setOpenChapters(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create course
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert({
          title: courseData.title,
          description: courseData.description,
          price: parseFloat(courseData.price) || 0,
          requirements: courseData.requirements,
          thumbnail_url: courseData.thumbnail_url,
          teacher_id: user.id,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Create chapters and lessons
      for (const chapter of chapters) {
        const { data: chapterData, error: chapterError } = await supabase
          .from("course_chapters")
          .insert({
            course_id: course.id,
            title: chapter.title,
            description: chapter.description,
            order_index: chapter.order_index,
          })
          .select()
          .single();

        if (chapterError) throw chapterError;

        // Create lessons for this chapter
        if (chapter.lessons.length > 0) {
          const { error: lessonsError } = await supabase
            .from("course_lessons")
            .insert(
              chapter.lessons.map(lesson => ({
                chapter_id: chapterData.id,
                title: lesson.title,
                description: lesson.description,
                content_type: lesson.content_type,
                content_url: lesson.content_url,
                duration: lesson.duration,
                order_index: lesson.order_index,
              }))
            );

          if (lessonsError) throw lessonsError;
        }
      }

      toast({
        title: "Success!",
        description: "Course created successfully",
      });

      navigate("/teacher-dashboard");
    } catch (error) {
      console.error("Error creating course:", error);
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Course</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  required
                  value={courseData.title}
                  onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                  placeholder="e.g., Complete Web Development Bootcamp"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  required
                  value={courseData.description}
                  onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                  placeholder="What will students learn in this course?"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={courseData.price}
                  onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
                  placeholder="49.99"
                />
              </div>

              <div>
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  value={courseData.thumbnail_url}
                  onChange={(e) => setCourseData({ ...courseData, thumbnail_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={courseData.requirements}
                  onChange={(e) => setCourseData({ ...courseData, requirements: e.target.value })}
                  placeholder="What students need to know before taking this course (one per line)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Course Content
                <Button type="button" onClick={addChapter} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Chapter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {chapters.map((chapter, chapterIndex) => (
                <Collapsible
                  key={chapterIndex}
                  open={openChapters.has(chapterIndex)}
                  onOpenChange={() => toggleChapter(chapterIndex)}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <CollapsibleTrigger className="flex-1 text-left">
                          <div className="font-semibold">
                            {chapter.title || `Chapter ${chapterIndex + 1}`}
                          </div>
                        </CollapsibleTrigger>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChapter(chapterIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Chapter Title *</Label>
                          <Input
                            required
                            value={chapter.title}
                            onChange={(e) => updateChapter(chapterIndex, "title", e.target.value)}
                            placeholder="e.g., Introduction to React"
                          />
                        </div>

                        <div>
                          <Label>Chapter Description</Label>
                          <Textarea
                            value={chapter.description}
                            onChange={(e) => updateChapter(chapterIndex, "description", e.target.value)}
                            placeholder="Brief description of this chapter"
                            rows={2}
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Lessons</Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addLesson(chapterIndex)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Lesson
                            </Button>
                          </div>

                          {chapter.lessons.map((lesson, lessonIndex) => (
                            <Card key={lessonIndex} className="bg-muted/50">
                              <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">
                                    Lesson {lessonIndex + 1}
                                  </Label>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeLesson(chapterIndex, lessonIndex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div>
                                  <Label className="text-sm">Lesson Title *</Label>
                                  <Input
                                    required
                                    value={lesson.title}
                                    onChange={(e) =>
                                      updateLesson(chapterIndex, lessonIndex, "title", e.target.value)
                                    }
                                    placeholder="e.g., Setting up your environment"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-sm">Content Type *</Label>
                                    <Select
                                      value={lesson.content_type}
                                      onValueChange={(value) =>
                                        updateLesson(chapterIndex, lessonIndex, "content_type", value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="pdf">PDF Document</SelectItem>
                                        <SelectItem value="document">Document</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {lesson.content_type === "video" && (
                                    <div>
                                      <Label className="text-sm">Duration (minutes)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={lesson.duration || ""}
                                        onChange={(e) =>
                                          updateLesson(
                                            chapterIndex,
                                            lessonIndex,
                                            "duration",
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        placeholder="15"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <Label className="text-sm">Content URL *</Label>
                                  <Input
                                    required
                                    value={lesson.content_url}
                                    onChange={(e) =>
                                      updateLesson(chapterIndex, lessonIndex, "content_url", e.target.value)
                                    }
                                    placeholder={
                                      lesson.content_type === "video"
                                        ? "YouTube URL or video link"
                                        : "PDF or document URL"
                                    }
                                  />
                                </div>

                                <div>
                                  <Label className="text-sm">Description</Label>
                                  <Textarea
                                    value={lesson.description}
                                    onChange={(e) =>
                                      updateLesson(chapterIndex, lessonIndex, "description", e.target.value)
                                    }
                                    placeholder="Brief description"
                                    rows={2}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}

              {chapters.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No chapters yet. Click "Add Chapter" to get started.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Course"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/teacher-dashboard")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
