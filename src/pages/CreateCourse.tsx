import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, ClipboardList, Award } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface QuizQuestion {
  id: string;
  question_text: string;
  options: { id: string; text: string }[];
  correct_answer: string;
  explanation: string;
  points: number;
}

interface Lesson {
  title: string;
  description: string;
  content_type: "video" | "pdf" | "document" | "url" | "quiz";
  content_url: string;
  duration?: number;
  order_index: number;
  is_mandatory?: boolean;
  quiz_questions?: QuizQuestion[];
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
  const [capstoneProject, setCapstoneProject] = useState({
    title: "",
    description: "",
    instructions: "",
    requirements: [""],
    due_date: "",
  });
  const [includeCapstone, setIncludeCapstone] = useState(false);

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
      order_index: newChapters[chapterIndex].lessons.length,
      is_mandatory: false,
      quiz_questions: [],
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

  const updateLesson = (chapterIndex: number, lessonIndex: number, field: string, value: string | number | boolean | QuizQuestion[]) => {
    const newChapters = [...chapters];
    newChapters[chapterIndex].lessons[lessonIndex] = {
      ...newChapters[chapterIndex].lessons[lessonIndex],
      [field]: value
    };
    setChapters(newChapters);
  };

  const addQuizQuestion = (chapterIndex: number, lessonIndex: number) => {
    const newChapters = [...chapters];
    const lesson = newChapters[chapterIndex].lessons[lessonIndex];
    if (!lesson.quiz_questions) lesson.quiz_questions = [];
    lesson.quiz_questions.push({
      id: crypto.randomUUID(),
      question_text: "",
      options: [
        { id: "a", text: "" },
        { id: "b", text: "" },
        { id: "c", text: "" },
        { id: "d", text: "" },
      ],
      correct_answer: "a",
      explanation: "",
      points: 1,
    });
    setChapters(newChapters);
  };

  const updateQuizQuestion = (chapterIndex: number, lessonIndex: number, questionIndex: number, field: string, value: any) => {
    const newChapters = [...chapters];
    const question = newChapters[chapterIndex].lessons[lessonIndex].quiz_questions![questionIndex];
    if (field === "option") {
      const optionIndex = question.options.findIndex(o => o.id === value.id);
      if (optionIndex !== -1) {
        question.options[optionIndex].text = value.text;
      }
    } else {
      newChapters[chapterIndex].lessons[lessonIndex].quiz_questions![questionIndex] = {
        ...question,
        [field]: value
      };
    }
    setChapters(newChapters);
  };

  const removeQuizQuestion = (chapterIndex: number, lessonIndex: number, questionIndex: number) => {
    const newChapters = [...chapters];
    newChapters[chapterIndex].lessons[lessonIndex].quiz_questions!.splice(questionIndex, 1);
    setChapters(newChapters);
  };

  const addCapstoneRequirement = () => {
    setCapstoneProject({
      ...capstoneProject,
      requirements: [...capstoneProject.requirements, ""],
    });
  };

  const updateCapstoneRequirement = (index: number, value: string) => {
    const newRequirements = [...capstoneProject.requirements];
    newRequirements[index] = value;
    setCapstoneProject({ ...capstoneProject, requirements: newRequirements });
  };

  const removeCapstoneRequirement = (index: number) => {
    setCapstoneProject({
      ...capstoneProject,
      requirements: capstoneProject.requirements.filter((_, i) => i !== index),
    });
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
          for (const lesson of chapter.lessons) {
            const { data: lessonData, error: lessonError } = await supabase
              .from("course_lessons")
              .insert({
                chapter_id: chapterData.id,
                title: lesson.title,
                description: lesson.description,
                content_type: lesson.content_type,
                content_url: lesson.content_type === "quiz" ? "" : lesson.content_url,
                duration: lesson.duration,
                order_index: lesson.order_index,
                is_mandatory: lesson.is_mandatory || false,
              })
              .select()
              .single();

            if (lessonError) throw lessonError;

            // If it's a quiz, save the questions
            if (lesson.content_type === "quiz" && lesson.quiz_questions && lesson.quiz_questions.length > 0) {
              const questionsToInsert = lesson.quiz_questions.map((q, idx) => ({
                lesson_id: lessonData.id,
                question_text: q.question_text,
                options: q.options,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                order_index: idx,
                points: q.points,
              }));

              const { error: questionsError } = await supabase
                .from("lesson_quiz_questions")
                .insert(questionsToInsert);

              if (questionsError) throw questionsError;
            }
          }
        }
      }

      // Create capstone project if included
      if (includeCapstone && capstoneProject.title.trim()) {
        const { error: capstoneError } = await supabase
          .from("capstone_projects")
          .insert({
            course_id: course.id,
            title: capstoneProject.title,
            description: capstoneProject.description,
            instructions: capstoneProject.instructions,
            requirements: capstoneProject.requirements.filter(r => r.trim() !== ""),
            due_date: capstoneProject.due_date || null,
          });

        if (capstoneError) throw capstoneError;
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
                                        <SelectItem value="document">Document (DOC/DOCX)</SelectItem>
                                        <SelectItem value="url">External URL</SelectItem>
                                        <SelectItem value="quiz">Quiz</SelectItem>
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

                                {lesson.content_type !== "quiz" && (
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
                                          : lesson.content_type === "url"
                                          ? "https://example.com"
                                          : "PDF or document URL"
                                      }
                                    />
                                  </div>
                                )}

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

                                {lesson.content_type === "quiz" && (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id={`mandatory-${chapterIndex}-${lessonIndex}`}
                                        checked={lesson.is_mandatory || false}
                                        onChange={(e) =>
                                          updateLesson(chapterIndex, lessonIndex, "is_mandatory", e.target.checked)
                                        }
                                        className="rounded"
                                      />
                                      <Label htmlFor={`mandatory-${chapterIndex}-${lessonIndex}`} className="text-sm font-normal">
                                        Mandatory (students must pass to proceed)
                                      </Label>
                                    </div>

                                    <div className="border-t pt-3">
                                      <div className="flex items-center justify-between mb-3">
                                        <Label className="text-sm font-semibold">Quiz Questions</Label>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => addQuizQuestion(chapterIndex, lessonIndex)}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Question
                                        </Button>
                                      </div>

                                      {lesson.quiz_questions && lesson.quiz_questions.length > 0 ? (
                                        <div className="space-y-4">
                                          {lesson.quiz_questions.map((question, qIndex) => (
                                            <Card key={question.id} className="p-3 bg-white">
                                              <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                  <Label className="text-xs font-semibold">Question {qIndex + 1}</Label>
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeQuizQuestion(chapterIndex, lessonIndex, qIndex)}
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>

                                                <Input
                                                  placeholder="Enter question"
                                                  value={question.question_text}
                                                  onChange={(e) =>
                                                    updateQuizQuestion(chapterIndex, lessonIndex, qIndex, "question_text", e.target.value)
                                                  }
                                                  className="text-sm"
                                                />

                                                <div className="grid grid-cols-2 gap-2">
                                                  {question.options.map((option) => (
                                                    <div key={option.id} className="flex items-center gap-2">
                                                      <input
                                                        type="radio"
                                                        name={`correct-${chapterIndex}-${lessonIndex}-${qIndex}`}
                                                        checked={question.correct_answer === option.id}
                                                        onChange={() =>
                                                          updateQuizQuestion(chapterIndex, lessonIndex, qIndex, "correct_answer", option.id)
                                                        }
                                                        className="flex-shrink-0"
                                                      />
                                                      <Input
                                                        placeholder={`Option ${option.id.toUpperCase()}`}
                                                        value={option.text}
                                                        onChange={(e) =>
                                                          updateQuizQuestion(chapterIndex, lessonIndex, qIndex, "option", {
                                                            id: option.id,
                                                            text: e.target.value,
                                                          })
                                                        }
                                                        className="text-xs"
                                                      />
                                                    </div>
                                                  ))}
                                                </div>

                                                <Textarea
                                                  placeholder="Explanation (optional)"
                                                  value={question.explanation}
                                                  onChange={(e) =>
                                                    updateQuizQuestion(chapterIndex, lessonIndex, qIndex, "explanation", e.target.value)
                                                  }
                                                  rows={2}
                                                  className="text-xs"
                                                />

                                                <Input
                                                  type="number"
                                                  placeholder="Points"
                                                  value={question.points}
                                                  onChange={(e) =>
                                                    updateQuizQuestion(chapterIndex, lessonIndex, qIndex, "points", parseInt(e.target.value) || 1)
                                                  }
                                                  className="text-xs w-24"
                                                  min="1"
                                                />
                                              </div>
                                            </Card>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-muted-foreground text-center py-4">
                                          No questions yet. Click "Add Question" to create quiz questions.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
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

          {/* Capstone Project Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  <CardTitle>Capstone Project (Optional)</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="include-capstone"
                    checked={includeCapstone}
                    onChange={(e) => setIncludeCapstone(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="include-capstone" className="text-sm font-normal cursor-pointer">
                    Include capstone project
                  </Label>
                </div>
              </div>
            </CardHeader>
            {includeCapstone && (
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="capstone-title">Project Title *</Label>
                  <Input
                    id="capstone-title"
                    required={includeCapstone}
                    value={capstoneProject.title}
                    onChange={(e) =>
                      setCapstoneProject({ ...capstoneProject, title: e.target.value })
                    }
                    placeholder="e.g., Build a Full-Stack Application"
                  />
                </div>

                <div>
                  <Label htmlFor="capstone-description">Description *</Label>
                  <Textarea
                    id="capstone-description"
                    required={includeCapstone}
                    value={capstoneProject.description}
                    onChange={(e) =>
                      setCapstoneProject({ ...capstoneProject, description: e.target.value })
                    }
                    placeholder="Brief overview of the capstone project"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="capstone-instructions">Instructions *</Label>
                  <Textarea
                    id="capstone-instructions"
                    required={includeCapstone}
                    value={capstoneProject.instructions}
                    onChange={(e) =>
                      setCapstoneProject({ ...capstoneProject, instructions: e.target.value })
                    }
                    placeholder="Detailed step-by-step instructions for completing the project"
                    rows={5}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Requirements</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addCapstoneRequirement}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Requirement
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {capstoneProject.requirements.map((req, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={req}
                          onChange={(e) => updateCapstoneRequirement(index, e.target.value)}
                          placeholder={`Requirement ${index + 1}`}
                        />
                        {capstoneProject.requirements.length > 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeCapstoneRequirement(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="capstone-due-date">Due Date (Optional)</Label>
                  <Input
                    id="capstone-due-date"
                    type="date"
                    value={capstoneProject.due_date}
                    onChange={(e) =>
                      setCapstoneProject({ ...capstoneProject, due_date: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            )}
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
