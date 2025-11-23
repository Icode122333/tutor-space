import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import LoadingSpinner from "@/components/LoadingSpinner";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
};

const MyCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch enrolled courses
      const { data, error } = await supabase
        .from("course_enrollments")
        .select(`
          courses (
            id,
            title,
            description,
            thumbnail_url
          )
        `)
        .eq("student_id", user.id);

      if (error) throw error;

      const enrolledCourses = data?.map(e => e.courses).filter(Boolean) as Course[];
      setCourses(enrolledCourses || []);
    } catch (error: any) {
      console.error("Error fetching enrolled courses:", error);
      toast.error("Failed to load your courses");
    } finally {
      setLoading(false);
    }
  };

  const gradients = [
    "from-blue-500 to-purple-600",
    "from-green-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-pink-500 to-rose-600",
    "from-indigo-500 to-blue-600",
    "from-yellow-500 to-orange-600",
  ];

  const levels = ["Beginner", "Intermediate", "Advanced"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Loading your courses...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <StudentSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border border-gray-200 rounded-2xl shadow-sm mx-4 mt-4 sticky top-4 z-10">
            <div className="container mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Courses</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {courses.length} {courses.length === 1 ? 'course' : 'courses'} enrolled
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 sm:px-6 py-8">
              {courses.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">No Courses Yet</h2>
                  <p className="text-gray-600 mb-6">
                    You haven't enrolled in any courses yet. Start learning today!
                  </p>
                  <Button
                    onClick={() => navigate("/courses")}
                    className="bg-[#006d2c] hover:bg-[#005523] text-white"
                  >
                    Browse Courses
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {courses.map((course, index) => {
                    const gradient = gradients[index % gradients.length];
                    const level = levels[index % levels.length];

                    return (
                      <Card
                        key={course.id}
                        className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-[#006d2c] cursor-pointer rounded-2xl overflow-hidden"
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        <CardContent className="p-0">
                          {/* Course Image */}
                          <div className={`relative h-48 bg-gradient-to-br ${gradient}`}>
                            {course.thumbnail_url ? (
                              <img
                                src={course.thumbnail_url}
                                alt={course.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <BookOpen className="h-16 w-16 text-white/30" />
                              </div>
                            )}
                            {/* Bookmark Icon */}
                            <div className="absolute top-3 right-3">
                              <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                                <svg
                                  className="w-4 h-4 text-gray-700"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Course Info */}
                          <div className="p-4">
                            {/* Level */}
                            <div className="flex items-center justify-between mb-3">
                              <span
                                className={`text-sm font-semibold ${
                                  level === "Beginner"
                                    ? "text-green-600"
                                    : level === "Intermediate"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}
                              >
                                {level}
                              </span>
                              <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded-full">
                                Enrolled
                              </span>
                            </div>

                            {/* Course Title */}
                            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3rem] text-base">
                              {course.title}
                            </h3>

                            {/* Description */}
                            {course.description && (
                              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                {course.description}
                              </p>
                            )}

                            {/* Continue Button */}
                            <Button
                              className="w-full bg-[#006D2C] hover:bg-[#005523] text-white rounded-full font-medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/course/${course.id}`);
                              }}
                            >
                              Continue Learning
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MyCourses;
