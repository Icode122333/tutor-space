import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  course_title: string;
  course_id: string;
  submission: {
    id: string;
    submitted_at: string;
    grade: number | null;
    feedback: string | null;
  } | null;
}

const StudentAssignments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get enrolled courses
      const { data: enrollments, error: enrollError } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("student_id", user.id);

      if (enrollError) throw enrollError;

      const courseIds = enrollments?.map(e => e.course_id) || [];

      if (courseIds.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      // Get capstone projects for enrolled courses
      const { data: capstones, error: capstoneError } = await supabase
        .from("capstone_projects")
        .select(`
          id,
          title,
          description,
          due_date,
          course_id,
          courses (
            title
          )
        `)
        .in("course_id", courseIds);

      if (capstoneError) throw capstoneError;

      // Get submissions for these capstones
      const capstoneIds = capstones?.map(c => c.id) || [];
      const { data: submissions } = await supabase
        .from("capstone_submissions")
        .select("*")
        .eq("student_id", user.id)
        .in("capstone_project_id", capstoneIds);

      // Map assignments with submission status
      const assignmentsData = (capstones || []).map((capstone: any) => {
        const submission = submissions?.find(s => s.capstone_project_id === capstone.id);
        return {
          id: capstone.id,
          title: capstone.title,
          description: capstone.description,
          due_date: capstone.due_date,
          course_title: capstone.courses.title,
          course_id: capstone.course_id,
          submission: submission ? {
            id: submission.id,
            submitted_at: submission.submitted_at,
            grade: submission.grade,
            feedback: submission.feedback
          } : null
        };
      });

      setAssignments(assignmentsData);
    } catch (error: any) {
      toast.error("Failed to load assignments");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    if (!assignment.submission) {
      if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </Badge>;
      }
      return <Badge variant="outline" className="text-orange-500 border-orange-500 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>;
    }

    if (assignment.submission.grade !== null) {
      return <Badge className="bg-green-500 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Graded
      </Badge>;
    }

    return <Badge variant="secondary" className="flex items-center gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Submitted
    </Badge>;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const pendingAssignments = assignments.filter(a => !a.submission);
  const submittedAssignments = assignments.filter(a => a.submission);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <StudentSidebar />

        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 mb-4">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold">My Assignments</h1>
                  <p className="text-sm text-muted-foreground">
                    View and submit your course assignments
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-2">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                    <FileText className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{assignments.length}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pendingAssignments.length}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{submittedAssignments.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Assignments List */}
              {assignments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
                    <p className="text-gray-600 mb-4">
                      You don't have any assignments. Enroll in courses to get started!
                    </p>
                    <Button
                      onClick={() => navigate("/courses")}
                      className="bg-[#006d2c] hover:bg-[#005523]"
                    >
                      Browse Courses
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Pending Assignments */}
                  {pendingAssignments.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">Pending Assignments</h2>
                      {pendingAssignments.map((assignment) => (
                        <Card key={assignment.id} className="hover:shadow-lg transition-shadow border-orange-200">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className="text-lg font-bold">{assignment.title}</h3>
                                    <p className="text-sm text-muted-foreground">{assignment.course_title}</p>
                                  </div>
                                  {getStatusBadge(assignment)}
                                </div>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                  {assignment.description}
                                </p>
                                {assignment.due_date && (
                                  <p className="text-xs text-muted-foreground mb-4">
                                    Due: {new Date(assignment.due_date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                )}
                                <Button
                                  onClick={() => navigate(`/course/${assignment.course_id}`)}
                                  className="bg-[#006d2c] hover:bg-[#005523]"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View & Submit
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Submitted Assignments */}
                  {submittedAssignments.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">Submitted Assignments</h2>
                      {submittedAssignments.map((assignment) => (
                        <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className="text-lg font-bold">{assignment.title}</h3>
                                    <p className="text-sm text-muted-foreground">{assignment.course_title}</p>
                                  </div>
                                  {getStatusBadge(assignment)}
                                </div>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                  {assignment.description}
                                </p>
                                {assignment.submission && (
                                  <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                      Submitted: {new Date(assignment.submission.submitted_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                    {assignment.submission.grade !== null && (
                                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-semibold text-green-900">Grade</span>
                                          <span className="text-2xl font-bold text-green-600">
                                            {assignment.submission.grade}/100
                                          </span>
                                        </div>
                                        {assignment.submission.feedback && (
                                          <div className="mt-2">
                                            <p className="text-sm font-semibold text-green-900 mb-1">Feedback:</p>
                                            <p className="text-sm text-green-800">{assignment.submission.feedback}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
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

export default StudentAssignments;
