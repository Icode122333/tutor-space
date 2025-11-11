import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { TrendingUp, Users, BookOpen, Award, Calendar } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

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
        toast.error("Access denied");
        navigate("/");
        return;
      }

      setLoading(false);
    } catch (error: any) {
      console.error("Error:", error);
      navigate("/");
    }
  };

  // Mock data - replace with real data
  const userGrowthData = [
    { month: "Jan", users: 120 },
    { month: "Feb", users: 180 },
    { month: "Mar", users: 250 },
    { month: "Apr", users: 320 },
    { month: "May", users: 400 },
    { month: "Jun", users: 480 },
  ];

  const courseData = [
    { name: "Active", value: 45, color: "#10b981" },
    { name: "Pending", value: 12, color: "#f59e0b" },
    { name: "Archived", value: 8, color: "#6b7280" },
  ];

  const engagementData = [
    { day: "Mon", logins: 45, submissions: 23 },
    { day: "Tue", logins: 52, submissions: 28 },
    { day: "Wed", logins: 48, submissions: 25 },
    { day: "Thu", logins: 61, submissions: 32 },
    { day: "Fri", logins: 55, submissions: 29 },
    { day: "Sat", logins: 38, submissions: 18 },
    { day: "Sun", logins: 32, submissions: 15 },
  ];

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
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white" />
                <div className="text-white">
                  <h1 className="text-3xl font-bold mb-1">Analytics</h1>
                  <p className="text-white/90 text-sm">Platform insights and metrics</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-2">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$12,450</div>
                    <p className="text-xs text-green-600">+12% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">480</div>
                    <p className="text-xs text-blue-600">+8% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                    <BookOpen className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">65</div>
                    <p className="text-xs text-purple-600">+5 new this month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <Award className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">68%</div>
                    <p className="text-xs text-orange-600">+3% from last month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Course Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={courseData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => entry.name}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {courseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Weekly Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={engagementData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="logins" fill="#8b5cf6" />
                        <Bar dataKey="submissions" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminAnalytics;
