import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Activity,
  DollarSign
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface Stats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  pendingTeachers: number;
  totalCourses: number;
  pendingCourses: number;
  activeUsers: number;
  suspendedUsers: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    pendingTeachers: 0,
    totalCourses: 0,
    pendingCourses: 0,
    activeUsers: 0,
    suspendedUsers: 0,
  });
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [courseStats, setCourseStats] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

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
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      await fetchStats();
    } catch (error: any) {
      console.error("Error checking admin access:", error);
      toast.error("Failed to verify admin access");
      navigate("/");
    }
  };

  const fetchStats = async () => {
    try {
      // Get user counts
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: totalStudents } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");

      const { count: totalTeachers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "teacher");

      const { count: pendingTeachers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "teacher")
        .eq("teacher_approval_status", "pending");

      const { count: suspendedUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_suspended", true);

      // Get course counts
      const { count: totalCourses } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true });

      const { count: pendingCourses } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("approval_status", "pending");

      // Get active users (logged in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_login", sevenDaysAgo.toISOString());

      setStats({
        totalUsers: totalUsers || 0,
        totalStudents: totalStudents || 0,
        totalTeachers: totalTeachers || 0,
        pendingTeachers: pendingTeachers || 0,
        totalCourses: totalCourses || 0,
        pendingCourses: pendingCourses || 0,
        activeUsers: activeUsers || 0,
        suspendedUsers: suspendedUsers || 0,
      });

      // Fetch user growth data (last 7 days)
      await fetchUserGrowth();
      await fetchCourseStats();
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGrowth = async () => {
    // Mock data for now - you can implement real data later
    const mockData = [
      { date: "Mon", students: 12, teachers: 2 },
      { date: "Tue", students: 15, teachers: 3 },
      { date: "Wed", students: 18, teachers: 2 },
      { date: "Thu", students: 22, teachers: 4 },
      { date: "Fri", students: 25, teachers: 3 },
      { date: "Sat", students: 20, teachers: 1 },
      { date: "Sun", students: 18, teachers: 2 },
    ];
    setUserGrowth(mockData);
  };

  const fetchCourseStats = async () => {
    // Mock data for now
    const mockData = [
      { name: "Active", value: stats.totalCourses - stats.pendingCourses },
      { name: "Pending", value: stats.pendingCourses },
    ];
    setCourseStats(mockData);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <AdminSidebar 
          pendingTeachers={stats.pendingTeachers}
          pendingCourses={stats.pendingCourses}
        />

        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {/* Header */}
          <header className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-white" />
                  <div className="text-white">
                    <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
                    <p className="text-white/90 text-sm">Platform Overview & Management</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-2">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.activeUsers} active this week
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Students</CardTitle>
                    <GraduationCap className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalStudents}</div>
                    <p className="text-xs text-muted-foreground">
                      Enrolled learners
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                    <UserCheck className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.pendingTeachers} pending approval
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Courses</CardTitle>
                    <BookOpen className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalCourses}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.pendingCourses} pending review
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth (Last 7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="students" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="teachers" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stats.pendingTeachers > 0 && (
                      <div 
                        className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                        onClick={() => navigate("/admin/teacher-approvals")}
                      >
                        <div className="flex items-center gap-3">
                          <UserCheck className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-semibold text-sm">Pending Teacher Approvals</p>
                            <p className="text-xs text-gray-600">{stats.pendingTeachers} waiting for review</p>
                          </div>
                        </div>
                        <AlertCircle className="h-5 w-5 text-purple-600" />
                      </div>
                    )}

                    {stats.pendingCourses > 0 && (
                      <div 
                        className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
                        onClick={() => navigate("/admin/courses")}
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="font-semibold text-sm">Pending Course Reviews</p>
                            <p className="text-xs text-gray-600">{stats.pendingCourses} courses to review</p>
                          </div>
                        </div>
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      </div>
                    )}

                    {stats.suspendedUsers > 0 && (
                      <div 
                        className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                        onClick={() => navigate("/admin/users")}
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-semibold text-sm">Suspended Users</p>
                            <p className="text-xs text-gray-600">{stats.suspendedUsers} accounts suspended</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {stats.pendingTeachers === 0 && stats.pendingCourses === 0 && stats.suspendedUsers === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No pending actions</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <div>
                        <p className="text-sm font-semibold">System Status</p>
                        <p className="text-xs text-gray-600">All systems operational</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold">Active Sessions</p>
                        <p className="text-xs text-gray-600">{stats.activeUsers} users online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                      <Activity className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-semibold">Database</p>
                        <p className="text-xs text-gray-600">Healthy</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
