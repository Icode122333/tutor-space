import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Search, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizGrade {
  id: string;
  student_name: string;
  student_email: string;
  course_title: string;
  lesson_title: string;
  chapter_title: string;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  submitted_at: string;
}

interface GradesTableProps {
  teacherId?: string;
  studentId?: string;
  showFilters?: boolean;
}

export function GradesTable({ teacherId, studentId, showFilters = true }: GradesTableProps) {
  const [grades, setGrades] = useState<QuizGrade[]>([]);
  const [filteredGrades, setFilteredGrades] = useState<QuizGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchGrades();
  }, [teacherId, studentId]);

  useEffect(() => {
    filterGrades();
  }, [grades, searchTerm, courseFilter]);

  const fetchGrades = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("student_quiz_attempts")
        .select(`
          id,
          score,
          total_points,
          passed,
          submitted_at,
          student:student_id (
            id,
            full_name,
            email
          ),
          lesson:lesson_id (
            id,
            title,
            chapter:chapter_id (
              id,
              title,
              course:course_id (
                id,
                title,
                teacher_id
              )
            )
          )
        `)
        .order("submitted_at", { ascending: false });

      if (teacherId) {
        // Teacher view: filter by courses they teach
        query = query.eq("lesson.chapter.course.teacher_id", teacherId);
      } else if (studentId) {
        // Student view: filter by their own attempts
        query = query.eq("student_id", studentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedGrades: QuizGrade[] = (data || []).map((attempt: any) => ({
        id: attempt.id,
        student_name: attempt.student?.full_name || "Unknown",
        student_email: attempt.student?.email || "",
        course_title: attempt.lesson?.chapter?.course?.title || "Unknown Course",
        chapter_title: attempt.lesson?.chapter?.title || "Unknown Chapter",
        lesson_title: attempt.lesson?.title || "Unknown Quiz",
        score: attempt.score,
        total_points: attempt.total_points,
        percentage: Math.round((attempt.score / attempt.total_points) * 100),
        passed: attempt.passed,
        submitted_at: attempt.submitted_at,
      }));

      setGrades(formattedGrades);

      // Extract unique courses for filter
      const uniqueCourses = Array.from(
        new Map(
          formattedGrades.map((g) => [g.course_title, { id: g.course_title, title: g.course_title }])
        ).values()
      );
      setCourses(uniqueCourses);
    } catch (error) {
      console.error("Error fetching grades:", error);
      toast({
        title: "Error",
        description: "Failed to load grades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterGrades = () => {
    let filtered = [...grades];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (grade) =>
          grade.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          grade.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          grade.lesson_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Course filter
    if (courseFilter !== "all") {
      filtered = filtered.filter((grade) => grade.course_title === courseFilter);
    }

    setFilteredGrades(filtered);
  };

  const exportToCSV = () => {
    const headers = ["Student", "Email", "Course", "Chapter", "Quiz", "Marks", "Percentage", "Status", "Date"];
    const rows = filteredGrades.map((g) => [
      g.student_name,
      g.student_email,
      g.course_title,
      g.chapter_title,
      g.lesson_title,
      `${g.score}/${g.total_points}`,
      `${g.percentage}%`,
      g.passed ? "Passed" : "Failed",
      new Date(g.submitted_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-grades-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getAverageScore = () => {
    if (filteredGrades.length === 0) return 0;
    const avg = filteredGrades.reduce((sum, g) => sum + g.percentage, 0) / filteredGrades.length;
    return Math.round(avg);
  };

  const getPassRate = () => {
    if (filteredGrades.length === 0) return 0;
    const passed = filteredGrades.filter((g) => g.passed).length;
    return Math.round((passed / filteredGrades.length) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-4">Loading grades...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Attempts</p>
                <p className="text-2xl font-bold">{filteredGrades.length}</p>
              </div>
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{getAverageScore()}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">{getPassRate()}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quiz Grades</CardTitle>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showFilters && (
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student, course, or quiz..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.title}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {!studentId && <TableHead>Student</TableHead>}
                  <TableHead>Course</TableHead>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No quiz grades found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGrades.map((grade) => (
                    <TableRow key={grade.id}>
                      {!studentId && (
                        <TableCell>
                          <div>
                            <div className="font-medium">{grade.student_name}</div>
                            <div className="text-xs text-muted-foreground">{grade.student_email}</div>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <div className="font-medium">{grade.course_title}</div>
                          <div className="text-xs text-muted-foreground">{grade.chapter_title}</div>
                        </div>
                      </TableCell>
                      <TableCell>{grade.lesson_title}</TableCell>
                      <TableCell className="font-mono font-semibold">
                        {grade.score}/{grade.total_points}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{grade.percentage}%</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={grade.passed ? "default" : "destructive"}>
                          {grade.passed ? "Passed" : "Failed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(grade.submitted_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
