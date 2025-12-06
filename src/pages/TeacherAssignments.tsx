import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { TeacherHeader } from "@/components/TeacherHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Users, 
  Eye,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Input } from "@/components/ui/input";

interface Course {
  id: string;
  title: string;
}

interface CapstoneProject {
  id: string;
  course_id: string;
  title: string;
  description: string;
  due_date: string | null;
  courses: {
    title: string;
  };
}

interface Submission {
  id: string;
  student_id: string;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  project_links: string[];
  description: string;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface EnrolledStudent {
  student_id: string;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

const TeacherAssignments = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [capstoneProject, setCapstoneProject] = useState<CapstoneProject | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [editGrades, setEditGrades] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTeacherCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchCapstoneProject();
      fetchEnrolledStudents();
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchSubmissions();
    }
  }, [selectedCourseId, capstoneProject]);

  const fetchTeacherCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCourses(data || []);
      if (data && data.length > 0) {
        setSelectedCourseId(data[0].id);
      }
    } catch (error: any) {
      toast.error(t('teacher.assignments.failedToLoad'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCapstoneProject = async () => {
    try {
      const { data, error } = await supabase
        .from("capstone_projects")
        .select(`
          *,
          courses (
            title
          )
        `)
        .eq("course_id", selectedCourseId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setCapstoneProject(data || null);
    } catch (error: any) {
      console.error("Error fetching capstone project:", error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      // Fetch submissions for BOTH regular assignments AND capstone projects
      
      // 1. Get regular assignment lesson IDs from course_lessons
      const { data: courseLessons } = await supabase
        .from("course_lessons")
        .select(`
          id,
          course_chapters!inner (
            course_id
          )
        `)
        .eq("content_type", "assignment")
        .eq("course_chapters.course_id", selectedCourseId);

      const lessonIds = courseLessons?.map(l => l.id) || [];

      // 2. Get capstone project IDs
      const { data: capstoneProjects } = await supabase
        .from("capstone_projects")
        .select("id")
        .eq("course_id", selectedCourseId);

      const capstoneIds = capstoneProjects?.map(c => c.id) || [];

      // 3. Fetch assignment submissions (from assignment_submissions table)
      let assignmentSubmissions: any[] = [];
      if (lessonIds.length > 0) {
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("assignment_submissions")
          .select(`
            *,
            profiles:student_id (
              full_name,
              email,
              avatar_url
            )
          `)
          .in("lesson_id", lessonIds)
          .order("submitted_at", { ascending: false });
        
        if (assignmentError) {
          console.error("Error fetching assignment submissions:", assignmentError);
        }
        assignmentSubmissions = assignmentData || [];
      }

      // 4. Fetch capstone submissions (from capstone_submissions table)
      let capstoneSubmissions: any[] = [];
      if (capstoneIds.length > 0) {
        const { data: capstoneData, error: capstoneError } = await supabase
          .from("capstone_submissions")
          .select(`
            *,
            profiles:student_id (
              full_name,
              email,
              avatar_url
            )
          `)
          .in("capstone_project_id", capstoneIds)
          .order("submitted_at", { ascending: false });
        
        if (capstoneError) {
          console.error("Error fetching capstone submissions:", capstoneError);
        }
        capstoneSubmissions = capstoneData || [];
      }

      // 5. Combine both types of submissions
      const allSubmissions = [...assignmentSubmissions, ...capstoneSubmissions].sort((a, b) => {
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      });

      console.log("Assignment submissions found:", assignmentSubmissions.length);
      console.log("Capstone submissions found:", capstoneSubmissions.length);
      console.log("Total submissions:", allSubmissions.length);
      
      setSubmissions(allSubmissions);
    } catch (error: any) {
      toast.error(t('teacher.assignments.failedToLoadSubmissions'));
      console.error(error);
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          student_id,
          profiles (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq("course_id", selectedCourseId);

      if (error) throw error;

      setEnrolledStudents(data || []);
    } catch (error: any) {
      toast.error(t('teacher.assignments.failedToLoadStudents'));
      console.error(error);
    }
  };

  const getStudentsWhoHaventSubmitted = () => {
    const submittedStudentIds = submissions.map(s => s.student_id);
    return enrolledStudents.filter(
      student => !submittedStudentIds.includes(student.student_id)
    );
  };

  const handleViewSubmission = (submissionId: string) => {
    const s = submissions.find((x) => x.id === submissionId);
    if (!s) return;
    
    // Check if it's a capstone submission (has capstone_project_id) or assignment (has lesson_id)
    const isCapstone = 'capstone_project_id' in s;
    
    if (s.project_links && s.project_links.length > 0) {
      // For capstone, project_links are usually external URLs (GitHub, etc.)
      // For assignments, they might be storage paths
      const firstLink = s.project_links[0];
      
      if (isCapstone && firstLink.startsWith('http')) {
        // External link - open directly
        window.open(firstLink, "_blank");
      } else {
        // Storage path - use Google viewer
        openInGoogleViewer(firstLink);
      }
    } else {
      toast.error("No submission files found");
    }
  };

  const openInGoogleViewer = async (link: string) => {
    try {
      let url = link;
      if (!/^https?:\/\//i.test(link)) {
        // Treat as storage path within lesson-files bucket
        const cleaned = link.replace(/^\/+/, "");
        const { data, error } = await supabase.storage
          .from("lesson-files")
          .createSignedUrl(cleaned, 3600);
        if (error) throw error;
        url = data?.signedUrl || link;
      }
      const viewer = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
      window.open(viewer, "_blank");
    } catch (e) {
      console.error("Failed to open viewer", e);
      toast.error("Failed to open document");
    }
  };

  const handleInlineGradeChange = (submissionId: string, value: string) => {
    setEditGrades((prev) => ({ ...prev, [submissionId]: value }));
  };

  const handleSaveInlineGrade = async (submissionId: string) => {
    const raw = editGrades[submissionId];
    const grade = parseInt(raw, 10);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast.error(t('teacher.assignments.enterValidGrade'));
      return;
    }
    try {
      // Find the submission to determine which table to update
      const submission = submissions.find(s => s.id === submissionId);
      if (!submission) {
        toast.error("Submission not found");
        return;
      }

      // Determine table based on which ID field exists
      const isAssignment = 'lesson_id' in submission;
      const tableName = isAssignment ? "assignment_submissions" : "capstone_submissions";

      console.log(`Updating grade in ${tableName} for submission ${submissionId}`);

      const { error } = await supabase
        .from(tableName)
        .update({ grade, graded_at: new Date().toISOString() })
        .eq("id", submissionId);
      
      if (error) throw error;
      
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? { ...s, grade } : s)));
      toast.success(t('teacher.grades.gradeSaved'));
    } catch (e) {
      console.error(e);
      toast.error(t('teacher.grades.failedToSave'));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const studentsWhoHaventSubmitted = getStudentsWhoHaventSubmitted();
  const submittedCount = submissions.length;
  const notSubmittedCount = studentsWhoHaventSubmitted.length;
  const totalStudents = enrolledStudents.length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <TeacherSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TeacherHeader 
            title={t('assignments.assignments')}
            subtitle={t('teacher.assignments.trackSubmissions')}
          />

          <main className="flex-1 overflow-y-auto p-4">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Course Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('teacher.assignments.selectCourse')}</CardTitle>
                  <CardDescription>
                    {t('teacher.assignments.chooseToView')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">{t('teacher.assignments.noCoursesFound')}</p>
                      <Button
                        onClick={() => navigate("/create-course")}
                        className="mt-4 bg-[#006d2c] hover:bg-[#005523]"
                      >
                        {t('teacher.assignments.createFirstCourse')}
                      </Button>
                    </div>
                  ) : (
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('teacher.assignments.selectCourse')} />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>

              {selectedCourseId && (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t('teacher.assignments.totalStudents')}</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalStudents}</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t('teacher.assignments.submitted')}</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{submittedCount}</div>
                        <p className="text-xs text-muted-foreground">
                          {totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0}% {t('teacher.assignments.completion')}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t('teacher.assignments.notSubmitted')}</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{notSubmittedCount}</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t('teacher.assignments.graded')}</CardTitle>
                        <FileText className="h-4 w-4 text-purple-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {submissions.filter(s => s.grade !== null).length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Assignment Details */}
                  {capstoneProject ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{capstoneProject.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {capstoneProject.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {capstoneProject.due_date && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Due: {new Date(capstoneProject.due_date).toLocaleDateString()}
                              </Badge>
                            )}
                            <Button
                              onClick={() => navigate(`/create-course?edit=${selectedCourseId}`)}
                              className="bg-[#006d2c] hover:bg-[#005523]"
                            >
                              {t('teacher.assignments.editAssignment')}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="submitted" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="submitted">
                              {t('teacher.assignments.submitted')} ({submittedCount})
                            </TabsTrigger>
                            <TabsTrigger value="not-submitted">
                              {t('teacher.assignments.notSubmitted')} ({notSubmittedCount})
                            </TabsTrigger>
                          </TabsList>

                          {/* Submitted Tab */}
                          <TabsContent value="submitted" className="space-y-4 mt-4">
                            {submissions.length === 0 ? (
                              <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">{t('teacher.assignments.noSubmissions')}</p>
                              </div>
                            ) : (
                              submissions.map((submission) => (
                                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-4 flex-1">
                                        <Avatar className="h-12 w-12">
                                          {submission.profiles.avatar_url ? (
                                            <img src={submission.profiles.avatar_url} alt={submission.profiles.full_name} />
                                          ) : (
                                            <AvatarFallback className="bg-[#006d2c] text-white">
                                              {submission.profiles.full_name.charAt(0)}
                                            </AvatarFallback>
                                          )}
                                        </Avatar>
                                        <div className="flex-1">
                                          <h4 className="font-semibold">{submission.profiles.full_name}</h4>
                                          <p className="text-sm text-muted-foreground">{submission.profiles.email}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-muted-foreground">
                                              Submitted: {new Date(submission.submitted_at).toLocaleString()}
                                            </p>
                                            {'capstone_project_id' in submission && (
                                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                                Capstone
                                              </Badge>
                                            )}
                                            {'lesson_id' in submission && (
                                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                                Assignment
                                              </Badge>
                                            )}
                                          </div>
                                          {submission.description && (
                                            <p className="text-sm mt-2 line-clamp-2">{submission.description}</p>
                                          )}
                                          {/* Show project links for capstone submissions */}
                                          {submission.project_links && submission.project_links.length > 0 && (
                                            <div className="mt-3 space-y-1">
                                              <p className="text-xs font-semibold text-gray-600">Project Links:</p>
                                              {submission.project_links.map((link: string, idx: number) => (
                                                <a
                                                  key={idx}
                                                  href={link.startsWith('http') ? link : '#'}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  onClick={(e) => {
                                                    if (!link.startsWith('http')) {
                                                      e.preventDefault();
                                                      openInGoogleViewer(link);
                                                    }
                                                  }}
                                                  className="text-xs text-blue-600 hover:underline block truncate max-w-md"
                                                >
                                                  {link}
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-3">
                                        <div className="flex items-center gap-2">
                                          {submission.project_links && submission.project_links.length > 0 && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleViewSubmission(submission.id)}
                                              className="hover:bg-blue-50"
                                            >
                                              <Eye className="h-4 w-4 mr-1" />
                                              View
                                            </Button>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="text-right">
                                            <label className="text-xs text-muted-foreground block mb-1">Marks (0-100)</label>
                                            <Input
                                              type="number"
                                              min={0}
                                              max={100}
                                              className="w-24 text-center"
                                              value={editGrades[submission.id] ?? (submission.grade?.toString() || "")}
                                              onChange={(e) => handleInlineGradeChange(submission.id, e.target.value)}
                                              placeholder="0"
                                            />
                                          </div>
                                          <Button 
                                            size="sm" 
                                            onClick={() => handleSaveInlineGrade(submission.id)}
                                            className="bg-[#006d2c] hover:bg-[#005523] mt-5"
                                          >
                                            Save
                                          </Button>
                                        </div>
                                        {submission.grade !== null ? (
                                          <Badge className="bg-green-500">Graded: {submission.grade}/100</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-orange-500 border-orange-500">Not Graded</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </TabsContent>

                          {/* Not Submitted Tab */}
                          <TabsContent value="not-submitted" className="space-y-4 mt-4">
                            {studentsWhoHaventSubmitted.length === 0 ? (
                              <div className="text-center py-12">
                                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                <p className="text-gray-600 font-semibold">All students have submitted!</p>
                              </div>
                            ) : (
                              studentsWhoHaventSubmitted.map((student) => (
                                <Card key={student.student_id} className="border-orange-200">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                          {student.profiles.avatar_url ? (
                                            <img src={student.profiles.avatar_url} alt={student.profiles.full_name} />
                                          ) : (
                                            <AvatarFallback className="bg-gray-500 text-white">
                                              {student.profiles.full_name.charAt(0)}
                                            </AvatarFallback>
                                          )}
                                        </Avatar>
                                        <div>
                                          <h4 className="font-semibold">{student.profiles.full_name}</h4>
                                          <p className="text-sm text-muted-foreground">{student.profiles.email}</p>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="text-orange-500 border-orange-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Pending
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">Course Assignments</CardTitle>
                            <CardDescription className="mt-2">
                              View and grade student assignment submissions
                            </CardDescription>
                          </div>
                          <Button
                            onClick={() => navigate(`/create-course?edit=${selectedCourseId}`)}
                            className="bg-[#006d2c] hover:bg-[#005523]"
                          >
                            Manage Course
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="submitted" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="submitted">
                              Submitted ({submittedCount})
                            </TabsTrigger>
                            <TabsTrigger value="not-submitted">
                              Not Submitted ({notSubmittedCount})
                            </TabsTrigger>
                          </TabsList>

                          {/* Submitted Tab */}
                          <TabsContent value="submitted" className="space-y-4 mt-4">
                            {submissions.length === 0 ? (
                              <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No submissions yet</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Students will see assignments once you add them to the course structure
                                </p>
                              </div>
                            ) : (
                              submissions.map((submission) => (
                                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-4 flex-1">
                                        <Avatar className="h-12 w-12">
                                          {submission.profiles.avatar_url ? (
                                            <img src={submission.profiles.avatar_url} alt={submission.profiles.full_name} />
                                          ) : (
                                            <AvatarFallback className="bg-[#006d2c] text-white">
                                              {submission.profiles.full_name.charAt(0)}
                                            </AvatarFallback>
                                          )}
                                        </Avatar>
                                        <div className="flex-1">
                                          <h4 className="font-semibold">{submission.profiles.full_name}</h4>
                                          <p className="text-sm text-muted-foreground">{submission.profiles.email}</p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                                          </p>
                                          {submission.description && (
                                            <div className="mt-2 p-2 bg-gray-50 rounded border">
                                              <p className="text-xs font-semibold text-gray-700 mb-1">Student Remarks:</p>
                                              <p className="text-sm text-gray-600">{submission.description}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-3">
                                        <div className="flex items-center gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleViewSubmission(submission.id)}
                                            className="hover:bg-blue-50"
                                          >
                                            <Eye className="h-4 w-4 mr-1" />
                                            View
                                          </Button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="text-right">
                                            <label className="text-xs text-muted-foreground block mb-1">Marks (0-100)</label>
                                            <Input
                                              type="number"
                                              min={0}
                                              max={100}
                                              className="w-24 text-center"
                                              value={editGrades[submission.id] ?? (submission.grade?.toString() || "")}
                                              onChange={(e) => handleInlineGradeChange(submission.id, e.target.value)}
                                              placeholder="0"
                                            />
                                          </div>
                                          <Button 
                                            size="sm" 
                                            onClick={() => handleSaveInlineGrade(submission.id)}
                                            className="bg-[#006d2c] hover:bg-[#005523] mt-5"
                                          >
                                            Save
                                          </Button>
                                        </div>
                                        {submission.grade !== null ? (
                                          <Badge className="bg-green-500">Graded: {submission.grade}/100</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-orange-500 border-orange-500">Not Graded</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </TabsContent>

                          {/* Not Submitted Tab */}
                          <TabsContent value="not-submitted" className="space-y-4 mt-4">
                            {studentsWhoHaventSubmitted.length === 0 ? (
                              <div className="text-center py-12">
                                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                <p className="text-gray-600 font-semibold">All students have submitted!</p>
                              </div>
                            ) : (
                              studentsWhoHaventSubmitted.map((student) => (
                                <Card key={student.student_id} className="border-orange-200">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                          {student.profiles.avatar_url ? (
                                            <img src={student.profiles.avatar_url} alt={student.profiles.full_name} />
                                          ) : (
                                            <AvatarFallback className="bg-gray-500 text-white">
                                              {student.profiles.full_name.charAt(0)}
                                            </AvatarFallback>
                                          )}
                                        </Avatar>
                                        <div>
                                          <h4 className="font-semibold">{student.profiles.full_name}</h4>
                                          <p className="text-sm text-muted-foreground">{student.profiles.email}</p>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="text-orange-500 border-orange-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Pending
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TeacherAssignments;
