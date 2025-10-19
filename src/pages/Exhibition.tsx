import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Clock, GraduationCap, Award, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  teacher_id: string;
  price: number | null;
  requirements: string | null;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
};

const Exhibition = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      // Fetch all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      // Check if user is logged in and fetch their enrollments
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: enrollmentsData } = await supabase
          .from("course_enrollments")
          .select("course_id")
          .eq("student_id", user.id);

        const enrolledIds = new Set(enrollmentsData?.map(e => e.course_id) || []);
        setEnrolledCourseIds(enrolledIds);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login to enroll in courses");
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase
        .from("course_enrollments")
        .insert({
          student_id: user.id,
          course_id: courseId,
        });

      if (error) throw error;

      toast.success("Successfully enrolled in course!");
      fetchCourses();
    } catch (error: any) {
      toast.error("Failed to enroll in course");
    }
  };

  const gradients = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-yellow-500 to-orange-600',
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  const studentProjects = [
    {
      id: 1,
      studentName: "Uwimana Aline",
      profileImage: "/images/students.webp",
      courseName: "Advanced Data Analytics",
      projectTitle: "Rwanda Healthcare Data Analysis System",
      projectDescription: "Developed a comprehensive data analytics platform that analyzes patient records and hospital efficiency metrics across 15 health centers in Kigali. The system provides real-time dashboards for healthcare administrators to make data-driven decisions, resulting in 25% improvement in patient wait times.",
      courseScore: 94,
      achievements: ["Best Capstone Project 2024", "Innovation Award", "Published Research Paper"],
      technologies: ["Python", "Pandas", "Tableau", "SQL"],
      projectLink: "#"
    },
    {
      id: 2,
      studentName: "Nkurunziza Jean",
      profileImage: "/images/teacher.webp",
      courseName: "Full Stack Web Development",
      projectTitle: "E-Learning Platform for Rural Schools",
      projectDescription: "Built a mobile-first e-learning platform specifically designed for low-bandwidth environments in rural Rwanda. The platform serves over 500 students across 8 schools, providing offline-capable course materials, video lessons, and interactive quizzes. Teachers can track student progress and engagement through an intuitive dashboard.",
      courseScore: 91,
      achievements: ["Community Impact Award", "Top Graduate", "Deployed in 8 Schools"],
      technologies: ["React", "Node.js", "MongoDB", "PWA"],
      projectLink: "#"
    },
    {
      id: 3,
      studentName: "Mukamana Grace",
      profileImage: "/images/students.webp",
      courseName: "Machine Learning & AI",
      projectTitle: "Agricultural Crop Disease Detection App",
      projectDescription: "Created a mobile application using computer vision and machine learning to detect crop diseases in cassava and banana plants. Farmers can take photos of their crops and receive instant diagnosis with treatment recommendations. The app has been downloaded by over 2,000 farmers and achieved 89% accuracy in disease detection.",
      courseScore: 96,
      achievements: ["Excellence in AI Award", "Startup Funding Secured", "Featured in Tech Magazine"],
      technologies: ["TensorFlow", "Flutter", "Python", "Firebase"],
      projectLink: "#"
    },
    {
      id: 4,
      studentName: "Habimana Patrick",
      profileImage: "/images/teacher.webp",
      courseName: "Business Intelligence & Analytics",
      projectTitle: "SME Financial Management Dashboard",
      projectDescription: "Designed an all-in-one financial management and business intelligence dashboard for small and medium enterprises in Rwanda. The platform integrates with mobile money APIs, provides cash flow forecasting, inventory management, and generates automated financial reports. Currently used by 45 local businesses.",
      courseScore: 88,
      achievements: ["Entrepreneurship Award", "45+ Active Users", "Revenue Generating"],
      technologies: ["Power BI", "Excel", "SQL Server", "Python"],
      projectLink: "#"
    },
    {
      id: 5,
      studentName: "Ingabire Sarah",
      profileImage: "/images/students.webp",
      courseName: "Data Science & Visualization",
      projectTitle: "Climate Change Impact Visualization for Rwanda",
      projectDescription: "Developed interactive data visualizations showing the impact of climate change on Rwanda's agriculture, water resources, and biodiversity. The project combines historical weather data, satellite imagery, and predictive models to help policymakers understand long-term environmental trends. Presented to the Ministry of Environment.",
      courseScore: 93,
      achievements: ["Research Excellence Award", "Government Presentation", "Conference Speaker"],
      technologies: ["D3.js", "Python", "R", "GIS"],
      projectLink: "#"
    },
    {
      id: 6,
      studentName: "Mugisha Eric",
      profileImage: "/images/teacher.webp",
      courseName: "Software Engineering",
      projectTitle: "Smart Transportation Route Optimizer",
      projectDescription: "Built a route optimization system for public transportation in Kigali that uses real-time traffic data and machine learning algorithms to suggest optimal routes for buses and motorcycle taxis. The system reduces average travel time by 18% and fuel consumption by 22%. Pilot program running with 3 transport companies.",
      courseScore: 90,
      achievements: ["Innovation Challenge Winner", "Pilot Program Active", "Patent Pending"],
      technologies: ["Java", "Spring Boot", "PostgreSQL", "Google Maps API"],
      projectLink: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 px-4 pt-4 pb-2">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/images/dataplus_logggg-removebg-preview.png"
                alt="DataPlus Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-black">Exhibition Room</span>
            </div>
            <Button
              onClick={() => navigate("/")}
              className="bg-[#006d2c] hover:bg-[#006d2c] text-black font-medium"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
            Browse Our Courses
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover courses designed to help you master data skills and advance your career
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <BookOpen className="w-8 h-8 text-[#006d2c] mx-auto mb-2" />
              <div className="text-3xl font-bold text-black mb-1">{courses.length}</div>
              <div className="text-sm text-gray-600">Available Courses</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <Users className="w-8 h-8 text-[#006d2c] mx-auto mb-2" />
              <div className="text-3xl font-bold text-black mb-1">500+</div>
              <div className="text-sm text-gray-600">Active Students</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <Clock className="w-8 h-8 text-[#006d2c] mx-auto mb-2" />
              <div className="text-3xl font-bold text-black mb-1">24/7</div>
              <div className="text-sm text-gray-600">Learning Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Gallery */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {studentProjects.map((project) => (
              <Card
                key={project.id}
                className="bg-white border-2 border-gray-200 hover:border-[#006d2c] transition-all duration-300 hover:shadow-xl overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Header with Profile */}
                  <div className="bg-gradient-to-r from-[#006d2c] to-[#006d2c] p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={project.profileImage}
                        alt={project.studentName}
                        className="w-20 h-20 rounded-full border-4 border-white object-cover"
                      />
                      <div>
                        <h3 className="text-2xl font-bold text-black">{project.studentName}</h3>
                        <p className="text-black/80 font-medium">{project.courseName}</p>
                      </div>
                    </div>

                    {/* Score Badge */}
                    <div className="flex items-center justify-between">
                      <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span className="text-black font-bold">Course Score: {project.courseScore}%</span>
                      </div>
                      <GraduationCap className="w-8 h-8 text-black" />
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-black mb-3">
                      {project.projectTitle}
                    </h4>

                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                      {project.projectDescription}
                    </p>

                    {/* Technologies */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">TECHNOLOGIES USED</p>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-green-50 border border-[#006d2c]/30 rounded-full text-xs text-black font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Achievements */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">ACHIEVEMENTS</p>
                      <div className="space-y-2">
                        {project.achievements.map((achievement, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-[#006d2c]" />
                            <span className="text-sm text-gray-700">{achievement}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* View Project Link */}
                    <Button
                      onClick={() => window.open(project.projectLink, '_blank')}
                      className="w-full bg-[#006d2c] hover:bg-[#006d2c] text-black font-medium mt-4"
                    >
                      <span>View Full Project Details</span>
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-[#006d2c] to-[#006d2c] rounded-3xl p-12 md:p-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
              Ready to Build Your Capstone Project?
            </h2>
            <p className="text-xl text-black/80 mb-8 max-w-2xl mx-auto">
              Join our community and create projects that make a real difference
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/signup")}
                className="bg-black hover:bg-black/90 text-white px-8 py-4 text-lg font-medium"
              >
                Enroll Now
              </Button>
              <Button
                size="lg"
                onClick={() => navigate("/")}
                variant="outline"
                className="bg-white border-2 border-black text-black hover:bg-gray-50 px-8 py-4 text-lg font-medium"
              >
                View All Courses
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-white border-t border-gray-200">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="/images/dataplus_logggg-removebg-preview.png"
              alt="DataPlus Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold text-black">DataPlus Labs</span>
          </div>
          <p className="text-gray-600 text-sm">
            © 2025 DataPlus Labs. Empowering the next generation of data professionals.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Exhibition;
