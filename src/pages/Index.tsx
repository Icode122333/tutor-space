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
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground" style={{ fontFamily: 'Inter, Poppins, Manrope, sans-serif' }}>
              Platform Features
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need for modern online learning and skill development
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-auto">
            {/* Course Management - Tall Card */}
            <Card className="lg:row-span-2 group hover:shadow-2xl transition-all duration-300 border-border bg-card overflow-hidden">
              <CardContent className="p-8 h-full flex flex-col justify-between relative">
                <div>
                  <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-bold mb-3 text-2xl text-card-foreground">Course Management</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Create, organize, and deliver engaging course content with our intuitive course builder. Structure your curriculum with chapters and lessons.
                  </p>
                </div>
                <div className="mt-8 opacity-20 group-hover:opacity-30 transition-opacity">
                  <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-xl"></div>
                </div>
              </CardContent>
            </Card>

            {/* Assignments & Quizzes */}
            <Card className="lg:col-span-2 group hover:shadow-2xl transition-all duration-300 border-border bg-card overflow-hidden">
              <CardContent className="p-8 relative">
                <div className="flex items-start gap-6">
                  <div className="inline-flex p-4 rounded-2xl bg-accent/10 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-10 w-10 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-3 text-2xl text-card-foreground">Assignments & Quizzes</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Interactive assessments with automated grading and instant feedback. Track student progress in real-time.
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <div className="w-32 h-32 bg-gradient-to-br from-accent/30 to-transparent rounded-full"></div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Communication */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-border bg-card overflow-hidden">
              <CardContent className="p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <MessageSquare className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-bold mb-3 text-xl text-card-foreground">Real-time Chat</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Connect with peers and instructors through group chats and live discussions.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Capstone Projects - Featured Large Card */}
            <Card className="lg:col-span-2 lg:row-span-2 group hover:shadow-2xl transition-all duration-300 border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 overflow-hidden relative">
              <CardContent className="p-10 h-full flex flex-col justify-between">
                <div>
                  <div className="inline-flex p-5 rounded-2xl bg-primary/20 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <GraduationCap className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="font-bold mb-4 text-3xl text-card-foreground">Capstone Projects</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                    Apply your learning through real-world capstone projects. Build a professional portfolio that showcases your skills to potential employers.
                  </p>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Industry-relevant projects</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Expert mentorship & guidance</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Portfolio-ready deliverables</span>
                    </li>
                  </ul>
                </div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-primary/10 to-transparent rounded-tl-full opacity-50"></div>
              </CardContent>
            </Card>

            {/* Interactive Learning */}
            <Card className="lg:col-span-2 group hover:shadow-2xl transition-all duration-300 border-border bg-card overflow-hidden">
              <CardContent className="p-8 relative">
                <div className="flex items-start gap-6">
                  <div className="inline-flex p-4 rounded-2xl bg-accent/10 group-hover:scale-110 transition-transform duration-300">
                    <BookOpenCheck className="h-10 w-10 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-3 text-2xl text-card-foreground">Interactive Learning</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Engage with video lessons, PDFs, and interactive content. Learn at your own pace with scheduled live classes.
                    </p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <div className="w-24 h-24 border-4 border-accent/30 rounded-2xl rotate-12"></div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Tracking */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-border bg-card overflow-hidden">
              <CardContent className="p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Star className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-bold mb-3 text-xl text-card-foreground">Progress Tracking</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Monitor your learning journey with detailed analytics and achievement badges.
                  </p>
                </div>
              </CardContent>
            </Card>
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
