import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Users, BookOpenCheck, MessageSquare, FileText, Star } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative">
      {/* Full background that extends to top */}
      <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-white to-green-100 -z-10"></div>
      {/* Subtle vignette overlay */}
      <div className="fixed inset-0 bg-gradient-to-r from-transparent via-transparent to-black/5 pointer-events-none -z-10"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 pointer-events-none -z-10"></div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 px-4 pt-4 pb-2">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/images/dataplus_logggg-removebg-preview.png"
                alt="DataPlus Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-black">Labs</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-sm font-medium text-black hover:text-[#6BDB4A] transition-colors">Home</a>
              <a href="#courses" className="text-sm font-medium text-black hover:text-[#6BDB4A] transition-colors">Courses</a>
              <a href="#about" className="text-sm font-medium text-black hover:text-[#6BDB4A] transition-colors">About</a>
              <a href="#contact" className="text-sm font-medium text-black hover:text-[#6BDB4A] transition-colors">Contact</a>
              <a href="#exhibition" className="text-sm font-medium text-black hover:text-[#6BDB4A] transition-colors">Exhibition</a>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="bg-white border-gray-300 text-black hover:bg-gray-50"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                className="bg-[#6BDB4A] hover:bg-[#5BC73A] text-black font-medium"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative z-10 flex items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6" style={{ fontFamily: 'Inter, Poppins, Manrope, sans-serif' }}>
            Get where you're going <span className="text-[#6BDB4A]">faster</span>
            <br />
            with <span className="text-[#6BDB4A]">DataPlus Labs</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-medium" style={{ fontFamily: 'Inter, Poppins, Manrope, sans-serif' }}>
            Expand your skills in development, testing, analysis, and designing with our comprehensive courses.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              variant="outline"
              className="bg-white border-gray-300 text-black hover:bg-gray-50 px-8 py-3 text-lg font-medium"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              className="bg-[#6BDB4A] hover:bg-[#5BC73A] text-black px-8 py-3 text-lg font-medium"
            >
              Request Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500 mb-8">Powered by DataPlus Labs Technology</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            <div className="text-2xl font-bold text-[#6BDB4A]">DataPlus</div>
            <div className="text-2xl font-bold text-[#6BDB4A]">DataPlus Analytics</div>
            <div className="text-2xl font-bold text-[#6BDB4A]">DataPlus Learning</div>
            <div className="text-2xl font-bold text-[#6BDB4A]">DataPlus Solutions</div>
            <div className="text-2xl font-bold text-[#6BDB4A]">DataPlus Academy</div>
          </div>
        </div>
      </section>

      {/* Course Tracks Section */}
      <section id="courses" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-black" style={{ fontFamily: 'Inter, Poppins, Manrope, sans-serif' }}>Our Learning Tracks</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Develop your mind & skills by our intense tracks that covers all you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
            <Card className="hover:shadow-lg transition-all cursor-pointer group border-gray-200" onClick={() => navigate("/auth")}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-[#6BDB4A]/10 group-hover:bg-[#6BDB4A]/20 transition-colors">
                    <GraduationCap className="h-6 w-6 text-[#6BDB4A]" />
                  </div>
                  <CardTitle className="text-black">I'm a Student</CardTitle>
                </div>
                <CardDescription className="text-gray-600">
                  Access courses, submit assignments, and join online classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <BookOpenCheck className="h-4 w-4 text-[#6BDB4A]" />
                    Browse and enroll in courses
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#6BDB4A]" />
                    Submit assignments and take quizzes
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#6BDB4A]" />
                    Chat with peers and teachers
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all cursor-pointer group border-gray-200" onClick={() => navigate("/auth")}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-[#6BDB4A]/10 group-hover:bg-[#6BDB4A]/20 transition-colors">
                    <Users className="h-6 w-6 text-[#6BDB4A]" />
                  </div>
                  <CardTitle className="text-black">I'm a Teacher</CardTitle>
                </div>
                <CardDescription className="text-gray-600">
                  Create courses, manage students, and track progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#6BDB4A]" />
                    Create and manage courses
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#6BDB4A]" />
                    Create assignments and quizzes
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#6BDB4A]" />
                    Engage with students
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-16 md:py-20 bg-[#E5E5E5]">
        <div className="max-w-[1400px] mx-auto px-10 md:px-14">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#1a1a1a]" style={{ fontFamily: 'Inter, Poppins, Manrope, sans-serif' }}>
              Platform Features
            </h2>
            <p className="text-[#666666] text-lg max-w-2xl mx-auto">
              Everything you need for modern online learning and skill development
            </p>
          </div>
          
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            {/* Left Column - Tall Card (Course Management) */}
            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-7 md:p-8 lg:row-span-2 flex flex-col justify-between min-h-[500px] lg:min-h-[600px]">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#6BDB4A]/15 flex items-center justify-center mb-5">
                  <BookOpen className="h-6 w-6 text-[#6BDB4A]" />
                </div>
                <h3 className="font-bold text-2xl md:text-3xl text-[#1a1a1a] mb-3">Course Management</h3>
                <p className="text-[#666666] text-base leading-relaxed">
                  Create, organize, and deliver engaging course content with our intuitive course builder. Structure your curriculum with chapters, lessons, and multimedia content. Track student progress and engagement in real-time.
                </p>
              </div>
              <div className="mt-8 relative h-48 md:h-64">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6BDB4A]/20 via-[#6BDB4A]/10 to-transparent rounded-2xl"></div>
                <div className="absolute bottom-4 right-4 w-32 h-32 bg-gradient-to-tl from-[#6BDB4A]/20 to-transparent rounded-full blur-2xl"></div>
              </div>
            </div>

            {/* Right Column - 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
              {/* Top-Left: Capstone Projects */}
              <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-7 md:p-8 flex flex-col justify-between min-h-[280px]">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#6BDB4A]/15 flex items-center justify-center mb-5">
                    <GraduationCap className="h-6 w-6 text-[#6BDB4A]" />
                  </div>
                  <h3 className="font-bold text-xl md:text-2xl text-[#1a1a1a] mb-3">Capstone Projects</h3>
                  <p className="text-[#666666] text-sm md:text-base leading-relaxed">
                    Apply your learning through real-world projects. Build a professional portfolio.
                  </p>
                </div>
                <div className="mt-6 h-20 relative">
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-[#6BDB4A]/15 to-transparent rounded-full"></div>
                </div>
              </div>

              {/* Top-Right: Assignments & Quizzes */}
              <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-7 md:p-8 flex flex-col justify-between min-h-[280px]">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#6BDB4A]/15 flex items-center justify-center mb-5">
                    <FileText className="h-6 w-6 text-[#6BDB4A]" />
                  </div>
                  <h3 className="font-bold text-xl md:text-2xl text-[#1a1a1a] mb-3">Assignments & Quizzes</h3>
                  <p className="text-[#666666] text-sm md:text-base leading-relaxed">
                    Interactive assessments with automated grading and instant feedback.
                  </p>
                </div>
                <div className="mt-6 h-20 relative">
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-br from-[#6BDB4A]/15 to-transparent rounded-2xl"></div>
                </div>
              </div>

              {/* Bottom-Left: Interactive Learning */}
              <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-7 md:p-8 flex flex-col justify-between min-h-[280px]">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#6BDB4A]/15 flex items-center justify-center mb-5">
                    <BookOpenCheck className="h-6 w-6 text-[#6BDB4A]" />
                  </div>
                  <h3 className="font-bold text-xl md:text-2xl text-[#1a1a1a] mb-3">Interactive Learning</h3>
                  <p className="text-[#666666] text-sm md:text-base leading-relaxed">
                    Engage with video lessons, PDFs, and interactive content at your own pace.
                  </p>
                </div>
                <div className="mt-6 h-20 relative">
                  <div className="absolute bottom-0 right-0 w-16 h-16 border-4 border-[#6BDB4A]/20 rounded-xl rotate-12"></div>
                </div>
              </div>

              {/* Bottom-Right: Progress Tracking */}
              <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-7 md:p-8 flex flex-col justify-between min-h-[280px]">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#6BDB4A]/15 flex items-center justify-center mb-5">
                    <Star className="h-6 w-6 text-[#6BDB4A]" />
                  </div>
                  <h3 className="font-bold text-xl md:text-2xl text-[#1a1a1a] mb-3">Progress Tracking</h3>
                  <p className="text-[#666666] text-sm md:text-base leading-relaxed">
                    Monitor your learning journey with detailed analytics and achievements.
                  </p>
                </div>
                <div className="mt-6 h-20 relative">
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#6BDB4A]/15 to-transparent rounded-full blur-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-black" style={{ fontFamily: 'Inter, Poppins, Manrope, sans-serif' }}>What our happy Students say about us</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="border-gray-200 bg-white">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#6BDB4A] text-[#6BDB4A]" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  "DataPlus Labs has transformed my understanding of data analytics. The courses are comprehensive and practical!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6BDB4A] to-[#5BC73A]"></div>
                  <div>
                    <div className="font-semibold text-sm text-black">Uwimana Aline</div>
                    <div className="text-xs text-gray-500">Data Analyst</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-white">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#6BDB4A] text-[#6BDB4A]" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  "Excellent platform for learning data science. The instructors are knowledgeable and supportive."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6BDB4A] to-[#5BC73A]"></div>
                  <div>
                    <div className="font-semibold text-sm text-black">Nkurunziza Jean</div>
                    <div className="text-xs text-gray-500">Data Scientist</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-white">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#6BDB4A] text-[#6BDB4A]" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  "I love how DataPlus Labs makes complex data concepts easy to understand. Highly recommended!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6BDB4A] to-[#5BC73A]"></div>
                  <div>
                    <div className="font-semibold text-sm text-black">Mukamana Grace</div>
                    <div className="text-xs text-gray-500">Business Analyst</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#6BDB4A] to-[#5BC73A] text-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Inter, Poppins, Manrope, sans-serif' }}>Ready to start learning?</h2>
          <p className="text-lg mb-8 opacity-80">
            Join thousands of students and teachers already using DataPlus Labs
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-white text-black hover:bg-gray-100 border border-gray-300"
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-gray-600">
            <p>© 2025 DataPlus Labs Learning Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
