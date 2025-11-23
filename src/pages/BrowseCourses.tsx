import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  teacher_id: string;
  price: number | null;
  requirements: string | null;
  created_at: string;
};

type EnrollmentCount = {
  course_id: string;
  count: number;
};

const BrowseCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Map<string, number>>(new Map());
  const [userId, setUserId] = useState<string | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchUserAndEnrollments = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: enrollments } = await supabase
          .from("course_enrollments")
          .select("course_id")
          .eq("student_id", user.id);
        const ids = new Set<string>((enrollments || []).map((e: any) => e.course_id));
        setEnrolledCourseIds(ids);
      } else {
        setUserId(null);
        setEnrolledCourseIds(new Set());
      }
    };
    fetchUserAndEnrollments();
  }, []);

  const fetchCourses = async () => {
    try {
      // Fetch all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch enrollment counts for each course
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("course_enrollments")
        .select("course_id");

      if (!enrollmentsError && enrollmentsData) {
        const counts = new Map<string, number>();
        enrollmentsData.forEach((enrollment) => {
          const currentCount = counts.get(enrollment.course_id) || 0;
          counts.set(enrollment.course_id, currentCount + 1);
        });
        setEnrollmentCounts(counts);
      }

      setCourses(coursesData || []);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/signup");
        return;
      }

      setEnrollingCourseId(courseId);
      const { error } = await supabase
        .from("course_enrollments")
        .insert({ course_id: courseId, student_id: user.id });

      if (error) throw error;

      setEnrolledCourseIds(prev => new Set(prev).add(courseId));
      toast.success("Enrolled successfully! Redirecting to course...");
      navigate(`/course/${courseId}`);
    } catch (error: any) {
      console.error("Error enrolling in course:", error);
      toast.error(error.message || "Failed to enroll in course");
    } finally {
      setEnrollingCourseId(null);
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
        <p className="text-lg text-gray-600">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Browse Courses</h1>
                <p className="text-sm text-gray-600">Discover and enroll in courses</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#006D2C]" />
              <span className="text-sm font-medium text-gray-700">{courses.length} Courses</span>
            </div>
          </div>
        </div>
      </header>

      {/* Courses Grid */}
      <main className="container mx-auto px-4 sm:px-6 py-8">
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {courses.map((course, index) => {
              const gradient = gradients[index % gradients.length];
              const level = levels[index % levels.length];
              const enrollmentCount = enrollmentCounts.get(course.id) || 0;

              return (
                <Card
                  key={course.id}
                  className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-[#006D2C] cursor-pointer rounded-2xl"
                  onClick={() => {
                    if (userId && enrolledCourseIds.has(course.id)) {
                      navigate(`/course/${course.id}`);
                    } else if (!userId) {
                      navigate("/signup");
                    }
                  }}
                >
                  <CardContent className="p-4">
                    {/* Course Image */}
                    <div className={`relative h-48 bg-gradient-to-br ${gradient} overflow-hidden rounded-2xl mb-4 shadow-md`}>
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 rounded-2xl"
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
                    <div>
                      {/* Level and Students */}
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
                        <div className="flex items-center gap-1 text-gray-600">
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-medium">{enrollmentCount}</span>
                        </div>
                      </div>

                      {/* Course Title */}
                      <h3 className="font-bold text-gray-900 mb-4 line-clamp-2 min-h-[3rem] text-base">
                        {course.title}
                      </h3>

                      {/* Action Button */}
                      {userId ? (
                        enrolledCourseIds.has(course.id) ? (
                          <Button
                            variant="secondary"
                            className="w-full cursor-not-allowed opacity-60 rounded-full font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDialogOpen(true);
                            }}
                            aria-disabled
                          >
                            Enrolled
                          </Button>
                        ) : (
                          <Button
                            className="w-full bg-[#006D2C] hover:bg-[#005523] text-white rounded-full font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEnroll(course.id);
                            }}
                            disabled={enrollingCourseId === course.id}
                          >
                            {enrollingCourseId === course.id ? "Enrolling..." : "Enroll"}
                          </Button>
                        )
                      ) : (
                        <Button
                          className="w-full bg-[#006D2C] hover:bg-[#005523] text-white rounded-full font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/signup");
                          }}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Available</h3>
            <p className="text-gray-600">Check back later for new courses</p>
          </div>
        )}
      </main>
      {/* Already Enrolled Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Already enrolled</DialogTitle>
            <DialogDescription>
              You are already enrolled in this course. Check it in the My Courses section.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
            <Button onClick={() => navigate("/student/my-courses")}>Go to My Courses</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseCourses;
