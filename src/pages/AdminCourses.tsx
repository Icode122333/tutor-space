import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Search, BookOpen, Star, Check, X } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Course {
  id: string;
  title: string;
  description: string | null;
  approval_status: string;
  is_featured: boolean;
  category: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const AdminCourses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchQuery, statusFilter]);

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

      await fetchCourses();
    } catch (error: any) {
      console.error("Error:", error);
      navigate("/");
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          profiles:teacher_id (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((course) => course.approval_status === statusFilter);
    }

    setFilteredCourses(filtered);
  };

  const toggleFeatured = async (courseId: string, currentStatus: boolean) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("courses")
        .update({ is_featured: !currentStatus })
        .eq("id", courseId);

      if (error) throw error;

      toast.success(currentStatus ? "Removed from featured" : "Added to featured");
      fetchCourses();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to update course");
    } finally {
      setProcessing(false);
    }
  };

  const approveCourse = async (courseId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("courses")
        .update({ approval_status: "approved" })
        .eq("id", courseId);

      if (error) throw error;

      toast.success("Course approved");
      fetchCourses();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to approve course");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const pendingCount = courses.filter((c) => c.approval_status === "pending").length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <AdminSidebar pendingCourses={pendingCount} />

        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <header className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 mb-6">
            <div className="bg-gradient-to-r from-[#006d2c] to-[#008000] p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-white" />
                  <div className="text-white">
                    <h1 className="text-3xl font-bold mb-1">Course Management</h1>
                    <p className="text-white/90 text-sm">Manage and approve courses</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {filteredCourses.length} Courses
                </Badge>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-2">
            <div className="max-w-7xl mx-auto space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{course.title}</p>
                              <p className="text-sm text-gray-600 line-clamp-1">
                                {course.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{course.profiles?.full_name}</p>
                              <p className="text-sm text-gray-600">{course.profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                course.approval_status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : course.approval_status === "pending"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {course.approval_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={course.is_featured ? "default" : "outline"}
                              onClick={() => toggleFeatured(course.id, course.is_featured)}
                              disabled={processing}
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  course.is_featured ? "fill-current" : ""
                                }`}
                              />
                            </Button>
                          </TableCell>
                          <TableCell>
                            {course.approval_status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() => approveCourse(course.id)}
                                disabled={processing}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminCourses;
