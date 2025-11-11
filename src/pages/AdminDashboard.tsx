import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
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

type TimePeriod = "week" | "month" | "year";

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
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("week");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchUserGrowth();
    }
  }, [timePeriod, loading]);

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
      // Use RPC function to get all profiles (bypasses RLS)
      const { data: allProfiles, error: profilesError } = await supabase.rpc("get_all_profiles");

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // Calculate counts from the data
      const totalUsers = allProfiles?.length || 0;
      const totalStudents = allProfiles?.filter((p: any) => p.role === "student").length || 0;
      const totalTeachers = allProfiles?.filter((p: any) => p.role === "teacher").length || 0;
      const pendingTeachers = allProfiles?.filter(
        (p: any) => p.role === "teacher" && p.teacher_approval_status === "pending"
      ).length || 0;
      const suspendedUsers = allProfiles?.filter((p: any) => p.is_suspended === true).length || 0;

      // Get active users (logged in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUsers = allProfiles?.filter((p: any) => {
        if (!p.last_login) return false;
        return new Date(p.last_login) >= sevenDaysAgo;
      }).length || 0;

      // Get course counts (courses table should be accessible)
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("id, approval_status");

      if (coursesError) {
        console.error("Error fetching courses:", coursesError);
      }

      const totalCourses = courses?.length || 0;
      const pendingCourses = courses?.filter((c: any) => c.approval_status === "pending").length || 0;

      setStats({
        totalUsers,
        totalStudents,
        totalTeachers,
        pendingTeachers,
        totalCourses,
        pendingCourses,
        activeUsers,
        suspendedUsers,
      });

      // Fetch user growth data
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
    try {
      const now = new Date();
      let startDate = new Date();
      let groupBy = "day";
      let dateFormat = "MM/DD";

      // Calculate date range based on time period
      if (timePeriod === "week") {
        startDate.setDate(now.getDate() - 7);
        groupBy = "day";
        dateFormat = "ddd";
      } else if (timePeriod === "month") {
        startDate.setDate(now.getDate() - 30);
        groupBy = "day";
        dateFormat = "MM/DD";
      } else if (timePeriod === "year") {
        startDate.setMonth(now.getMonth() - 12);
        groupBy = "month";
        dateFormat = "MMM";
      }

      // Fetch all users created in the time period
      const { data: users, error } = await supabase
        .from("profiles")
        .select("created_at, role")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group users by date
      const groupedData: { [key: string]: { students: number; teachers: number } } = {};

      users?.forEach((user) => {
        const date = new Date(user.created_at);
        let key: string;

        if (timePeriod === "week") {
          key = date.toLocaleDateString("en-US", { weekday: "short" });
        } else if (timePeriod === "month") {
          key = date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
        } else {
          key = date.toLocaleDateString("en-US", { month: "short" });
        }

        if (!groupedData[key]) {
          groupedData[key] = { students: 0, teachers: 0 };
        }

        if (user.role === "student") {
          groupedData[key].students++;
        } else if (user.role === "teacher") {
          groupedData[key].teachers++;
        }
      });

      // Convert to array format for chart
      const chartData = Object.entries(groupedData).map(([date, counts]) => ({
        date,
        students: counts.students,
        teachers: counts.teachers,
      }));

      setUserGrowth(chartData);
    } catch (error: any) {
      console.error("Error fetching user growth:", error);
    }
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
            <div className="bg-gradient-to-r from-[#006d2c] to-[#008000] p-6">
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
                    <div className="flex items-center justify-between">
                      <CardTitle>User Growth</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={timePeriod === "week" ? "default" : "outline"}
                          onClick={() => setTimePeriod("week")}
                          className={timePeriod === "week" ? "bg-[#006d2c] hover:bg-[#005a24]" : ""}
                        >
                          Week
                        </Button>
                        <Button
                          size="sm"
                          variant={timePeriod === "month" ? "default" : "outline"}
                          onClick={() => setTimePeriod("month")}
                          className={timePeriod === "month" ? "bg-[#006d2c] hover:bg-[#005a24]" : ""}
                        >
                          Month
                        </Button>
                        <Button
                          size="sm"
                          variant={timePeriod === "year" ? "default" : "outline"}
                          onClick={() => setTimePeriod("year")}
                          className={timePeriod === "year" ? "bg-[#006d2c] hover:bg-[#005a24]" : ""}
                        >
                          Year
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="students" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="Students"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="teachers" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          name="Teachers"
                        />
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
