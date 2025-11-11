import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, TrendingUp, BookOpen, CheckCircle, Clock, Eye } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface StudentProgress {
  id: string;
  full_name: string;
  email: string;
  total_courses: number;
  completed_assignments: number;
  total_assignments: number;
  completed_quizzes: number;
  total_quizzes: number;
  average_assignment_score: number;
  average_quiz_score: number;
  overall_progress: number;
  last_activity: string;
}

interface CourseDetail {
  course_id: string;
  course_title: string;
  enrolled_at: string;
  assignments_completed: number;
  total_assignments: number;
  average_assignment_score: number;
  quizzes_completed: number;
  total_quizzes: number;
  average_quiz_score: number;
  overall_course_progress: number;
}

interface StudentDetail {
  student: {
    id: string;
    full_name: string;
    email: string;
  };
  courses: CourseDetail[];
  overall_stats: {
    total_assignments: number;
    completed_assignments: number;
    total_quizzes: number;
    completed_quizzes: number;
    average_assignment_score: number;
    average_quiz_score: number;
    overall_progress: number;
  };
}

const AdminStudentProgress = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        toast.error("Access denied");
        navigate("/");
        return;
      }

      await fetchStudentProgress();
    } catch (error: any) {
      console.error("Error:", error);
      navigate("/");
    }
  };

  const fetchStudentProgress = async () => {
    try {
      // Get all students
      const { data: studentsData, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name, email, last_login")
        .eq("role", "student");

      if (studentsError) throw studentsError;

      // For each student, get their progress
      const progressPromises = (studentsData || []).map(async (student) => {
        // Get enrollments
        const { data: enrollments } = await supabase
          .from("course_enrollments")
          .select("course_id")
          .eq("student_id", student.id);

        // Get assignment submissions
        const { data: submissions } = await supabase
          .from("assignment_submissions")
          .select("score, assignment_id")
          .eq("student_id", student.id);

        // Get quiz attempts
        const { data: quizAttempts } = await supabase
          .from("quiz_attempts")
          .select("score, quiz_id, submitted_at")
          .eq("student_id", student.id)
          .not("submitted_at", "is", null);

        // Calculate assignment stats
        const totalCourses = enrollments?.length || 0;
        const completedAssignments = submissions?.filter(s => s.score !== null).length || 0;
        const totalAssignments = submissions?.length || 0;
        const avgAssignmentScore = submissions && submissions.length > 0
          ? submissions.reduce((acc, s) => acc + (s.score || 0), 0) / submissions.length
          : 0;

        // Calculate quiz stats
        const completedQuizzes = quizAttempts?.length || 0;
        const avgQuizScore = quizAttempts && quizAttempts.length > 0
          ? quizAttempts.reduce((acc, q) => acc + (q.score || 0), 0) / quizAttempts.length
          : 0;

        // Get total quizzes available to student
        const { data: availableQuizzes } = await supabase
          .from("quizzes")
          .select("id, course_id")
          .in("course_id", enrollments?.map(e => e.course_id) || []);

        const totalQuizzes = availableQuizzes?.length || 0;

        // Calculate overall progress
        const assignmentProgress = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
        const quizProgress = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;
        const overallProgress = (assignmentProgress + quizProgress) / 2;

        return {
          id: student.id,
          full_name: student.full_name || "Unknown",
          email: student.email,
          total_courses: totalCourses,
          completed_assignments: completedAssignments,
          total_assignments: totalAssignments,
          completed_quizzes: completedQuizzes,
          total_quizzes: totalQuizzes,
          average_assignment_score: Math.round(avgAssignmentScore),
          average_quiz_score: Math.round(avgQuizScore),
          overall_progress: Math.round(overallProgress),
          last_activity: student.last_login || "Never",
        };
      });

      const progressData = await Promise.all(progressPromises);
      setStudents(progressData);
    } catch (error: any) {
      console.error("Error fetching student progress:", error);
      toast.error("Failed to load student progress");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetail = async (studentId: string) => {
    try {
      // Get student info
      const { data: student } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", studentId)
        .single();

      // Get enrollments with course details
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select(`
          course_id,
          enrolled_at,
          courses (
            id,
            title
          )
        `)
        .eq("student_id", studentId);

      let totalAssignmentsAll = 0;
      let completedAssignmentsAll = 0;
      let totalQuizzesAll = 0;
      let completedQuizzesAll = 0;
      let assignmentScoresAll: number[] = [];
      let quizScoresAll: number[] = [];

      // For each course, get assignment and quiz progress
      const courseProgress = await Promise.all(
        (enrollments || []).map(async (enrollment: any) => {
          // Get assignments for this course
          const { data: courseAssignments } = await supabase
            .from("assignments")
            .select("id")
            .eq("course_id", enrollment.course_id);

          // Get student's submissions for these assignments
          const assignmentIds = courseAssignments?.map(a => a.id) || [];
          const { data: submissions } = await supabase
            .from("assignment_submissions")
            .select("score, assignment_id")
            .eq("student_id", studentId)
            .in("assignment_id", assignmentIds);

          const completedAssignments = submissions?.filter(s => s.score !== null).length || 0;
          const totalAssignments = courseAssignments?.length || 0;
          const avgAssignmentScore = submissions && submissions.length > 0
            ? submissions.reduce((acc, s) => acc + (s.score || 0), 0) / submissions.length
            : 0;

          // Get quizzes for this course
          const { data: courseQuizzes } = await supabase
            .from("quizzes")
            .select("id")
            .eq("course_id", enrollment.course_id);

          // Get student's quiz attempts
          const quizIds = courseQuizzes?.map(q => q.id) || [];
          const { data: quizAttempts } = await supabase
            .from("quiz_attempts")
            .select("score, quiz_id, submitted_at")
            .eq("student_id", studentId)
            .in("quiz_id", quizIds)
            .not("submitted_at", "is", null);

          const completedQuizzes = quizAttempts?.length || 0;
          const totalQuizzes = courseQuizzes?.length || 0;
          const avgQuizScore = quizAttempts && quizAttempts.length > 0
            ? quizAttempts.reduce((acc, q) => acc + (q.score || 0), 0) / quizAttempts.length
            : 0;

          // Calculate overall course progress
          const assignmentProgress = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
          const quizProgress = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;
          const overallCourseProgress = (assignmentProgress + quizProgress) / 2;

          // Accumulate totals
          totalAssignmentsAll += totalAssignments;
          completedAssignmentsAll += completedAssignments;
          totalQuizzesAll += totalQuizzes;
          completedQuizzesAll += completedQuizzes;
          if (submissions) assignmentScoresAll.push(...submissions.map(s => s.score || 0));
          if (quizAttempts) quizScoresAll.push(...quizAttempts.map(q => q.score || 0));

          return {
            course_id: enrollment.course_id,
            course_title: enrollment.courses?.title || "Unknown Course",
            enrolled_at: enrollment.enrolled_at,
            assignments_completed: completedAssignments,
            total_assignments: totalAssignments,
            average_assignment_score: Math.round(avgAssignmentScore),
            quizzes_completed: completedQuizzes,
            total_quizzes: totalQuizzes,
            average_quiz_score: Math.round(avgQuizScore),
            overall_course_progress: Math.round(overallCourseProgress),
          };
        })
      );

      // Calculate overall stats
      const avgAssignmentScoreAll = assignmentScoresAll.length > 0
        ? assignmentScoresAll.reduce((a, b) => a + b, 0) / assignmentScoresAll.length
        : 0;
      const avgQuizScoreAll = quizScoresAll.length > 0
        ? quizScoresAll.reduce((a, b) => a + b, 0) / quizScoresAll.length
        : 0;
      const assignmentProgressAll = totalAssignmentsAll > 0 ? (completedAssignmentsAll / totalAssignmentsAll) * 100 : 0;
      const quizProgressAll = totalQuizzesAll > 0 ? (completedQuizzesAll / totalQuizzesAll) * 100 : 0;
      const overallProgressAll = (assignmentProgressAll + quizProgressAll) / 2;

      setSelectedStudent({
        student: student!,
        courses: courseProgress,
        overall_stats: {
          total_assignments: totalAssignmentsAll,
          completed_assignments: completedAssignmentsAll,
          total_quizzes: totalQuizzesAll,
          completed_quizzes: completedQuizzesAll,
          average_assignment_score: Math.round(avgAssignmentScoreAll),
          average_quiz_score: Math.round(avgQuizScoreAll),
          overall_progress: Math.round(overallProgressAll),
        },
      });
      setShowDetailDialog(true);
    } catch (error: any) {
      console.error("Error fetching student detail:", error);
      toast.error("Failed to load student details");
    }
  };

  const filterStudents = () => {
    if (!searchQuery) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(
      (student) =>
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStudents(filtered);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <AdminSidebar />

        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <header className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 mb-6">
            <div className="bg-gradient-to-r from-[#006d2c] to-[#008000] p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-white" />
                  <div className="text-white">
                    <h1 className="text-3xl font-bold mb-1">Student Progress</h1>
                    <p className="text-white/90 text-sm">Monitor all student performance</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {filteredStudents.length} Students
                </Badge>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-2">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="p-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search students by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{students.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Avg Completion
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {students.length > 0
                        ? Math.round(
                            students.reduce((acc, s) => 
                              acc + (s.total_assignments > 0 ? (s.completed_assignments / s.total_assignments) * 100 : 0), 0
                            ) / students.length
                          )
                        : 0}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Avg Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {students.length > 0
                        ? Math.round(
                            students.reduce((acc, s) => acc + s.average_score, 0) / students.length
                          )
                        : 0}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Active Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {students.filter(s => s.last_activity !== "Never").length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Students Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Courses</TableHead>
                        <TableHead>Assignments</TableHead>
                        <TableHead>Quizzes</TableHead>
                        <TableHead>Overall Progress</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => {
                        return (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{student.full_name}</p>
                                <p className="text-sm text-gray-600">{student.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                                <span>{student.total_courses}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm">
                                  {student.completed_assignments}/{student.total_assignments}
                                </div>
                                <Badge
                                  className={
                                    student.average_assignment_score >= 80
                                      ? "bg-green-100 text-green-800"
                                      : student.average_assignment_score >= 50
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }
                                >
                                  Avg: {student.average_assignment_score}%
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm">
                                  {student.completed_quizzes}/{student.total_quizzes}
                                </div>
                                <Badge
                                  className={
                                    student.average_quiz_score >= 80
                                      ? "bg-green-100 text-green-800"
                                      : student.average_quiz_score >= 50
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }
                                >
                                  Avg: {student.average_quiz_score}%
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className={`text-sm font-medium ${getProgressColor(student.overall_progress)}`}>
                                  {student.overall_progress}%
                                </div>
                                <Progress value={student.overall_progress} className="h-2" />
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {student.last_activity !== "Never"
                                ? new Date(student.last_activity).toLocaleDateString()
                                : "Never"}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchStudentDetail(student.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Progress Details</DialogTitle>
            <DialogDescription>
              {selectedStudent?.student.full_name} ({selectedStudent?.student.email})
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Course Progress</h3>
              {selectedStudent.courses.length === 0 ? (
                <p className="text-gray-500">No courses enrolled yet</p>
              ) : (
                <div className="space-y-4">
                  {selectedStudent.courses.map((course) => {
                    const completionRate = course.total_assignments > 0
                      ? (course.assignments_completed / course.total_assignments) * 100
                      : 0;

                    return (
                      <Card key={course.course_id}>
                        <CardHeader>
                          <CardTitle className="text-base">{course.course_title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Enrolled:</span>
                            <span>{new Date(course.enrolled_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Assignments:</span>
                            <span>
                              {course.assignments_completed}/{course.total_assignments} completed
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Progress:</span>
                              <span className={`font-medium ${getProgressColor(completionRate)}`}>
                                {Math.round(completionRate)}%
                              </span>
                            </div>
                            <Progress value={completionRate} className="h-2" />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Average Score:</span>
                            <Badge
                              className={
                                course.average_score >= 80
                                  ? "bg-green-100 text-green-800"
                                  : course.average_score >= 50
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {course.average_score}%
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AdminStudentProgress;
