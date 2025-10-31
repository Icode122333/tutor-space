import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Search, Plus, UserPlus, Layers, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Student {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  enrolled_at: string;
  course_id: string;
  course_title: string;
  cohort_name: string | null;
}

interface Course {
  id: string;
  title: string;
  enrolled_count: number;
}

const TeacherStudents = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCohortDialog, setShowCohortDialog] = useState(false);
  const [newCohortName, setNewCohortName] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch teacher's courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("id, title")
        .eq("teacher_id", user.id);

      if (coursesError) throw coursesError;

      const courseIds = coursesData?.map(c => c.id) || [];
      setCourses(coursesData || []);

      if (courseIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch students enrolled in these courses (include profile via FK)
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("course_enrollments")
        .select(`
          student_id,
          course_id,
          cohort_name,
          enrolled_at,
          courses (
            id,
            title
          ),
          profiles:student_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .in("course_id", courseIds);

      if (enrollmentsError) throw enrollmentsError;

      if (!enrollmentsData || enrollmentsData.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Combine data
      const studentsWithDetails = enrollmentsData.map((enrollment: any) => ({
        id: enrollment.student_id,
        full_name: enrollment.profiles?.full_name || "Unknown",
        email: enrollment.profiles?.email || "",
        avatar_url: enrollment.profiles?.avatar_url || null,
        enrolled_at: enrollment.enrolled_at,
        course_id: enrollment.course_id,
        course_title: enrollment.courses?.title || "Unknown Course",
        cohort_name: enrollment.cohort_name,
      }));

      setStudents(studentsWithDetails);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCohort = async () => {
    if (!newCohortName.trim()) {
      toast.error("Please enter a cohort name");
      return;
    }

    if (selectedStudents.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    try {
      // Update cohort for selected students
      const updates = Array.from(selectedStudents).map(studentId => {
        const student = students.find(s => s.id === studentId);
        return supabase
          .from("course_enrollments")
          .update({ cohort_name: newCohortName })
          .eq("student_id", studentId)
          .eq("course_id", student?.course_id);
      });

      await Promise.all(updates);

      toast.success(`Cohort "${newCohortName}" created successfully`);
      setShowCohortDialog(false);
      setNewCohortName("");
      setSelectedStudents(new Set());
      fetchData();
    } catch (error: any) {
      console.error("Error creating cohort:", error);
      toast.error("Failed to create cohort");
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const filteredStudents = students.filter(student => {
    const matchesCourse = selectedCourse === "all" || student.course_id === selectedCourse;
    const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  const cohorts = [...new Set(students.map(s => s.cohort_name).filter(Boolean))];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b sticky top-0 z-10">
            <div className="container mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Students</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage your students and organize them into cohorts
                  </p>
                </div>
                <Dialog open={showCohortDialog} onOpenChange={setShowCohortDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#006d2c] hover:bg-[#005523]">
                      <Layers className="h-4 w-4 mr-2" />
                      Create Cohort
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Cohort</DialogTitle>
                      <DialogDescription>
                        Group selected students into a cohort for better organization
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="cohort-name">Cohort Name</Label>
                        <Input
                          id="cohort-name"
                          placeholder="e.g., January 2025 Batch"
                          value={newCohortName}
                          onChange={(e) => setNewCohortName(e.target.value)}
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedStudents.size} student(s) selected
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCohortDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCohort} className="bg-[#006d2c] hover:bg-[#005523]">
                        Create Cohort
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            <div className="container mx-auto space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-[#006d2c]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{students.length}</div>
                    <p className="text-xs text-muted-foreground">Across all courses</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Courses</CardTitle>
                    <BookOpen className="h-4 w-4 text-[#006d2c]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{courses.length}</div>
                    <p className="text-xs text-muted-foreground">Active courses</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Cohorts</CardTitle>
                    <Layers className="h-4 w-4 text-[#006d2c]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{cohorts.length}</div>
                    <p className="text-xs text-muted-foreground">Student groups</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Filter Students</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Courses</SelectItem>
                          {courses.map(course => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by name or email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Students Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Students List</CardTitle>
                  <CardDescription>
                    {filteredStudents.length} student(s) found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No students found</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
                                } else {
                                  setSelectedStudents(new Set());
                                }
                              }}
                              checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                            />
                          </TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Cohort</TableHead>
                          <TableHead>Enrolled</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student) => (
                          <TableRow key={`${student.id}-${student.course_id}`}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedStudents.has(student.id)}
                                onChange={() => toggleStudentSelection(student.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  {student.avatar_url ? (
                                    <img src={student.avatar_url} alt={student.full_name} />
                                  ) : (
                                    <AvatarFallback className="bg-[#006d2c] text-white text-xs">
                                      {student.full_name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <span className="font-medium">{student.full_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{student.email}</TableCell>
                            <TableCell className="text-sm">{student.course_title}</TableCell>
                            <TableCell>
                              {student.cohort_name ? (
                                <Badge variant="secondary">{student.cohort_name}</Badge>
                              ) : (
                                <span className="text-sm text-gray-400">No cohort</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {new Date(student.enrolled_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TeacherStudents;
