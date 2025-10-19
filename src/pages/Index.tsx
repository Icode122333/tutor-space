import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Users, BookOpenCheck, MessageSquare, FileText, Star, Menu, X } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <a href="#home" className="text-sm font-medium text-black hover:text-[#006d2c] transition-colors">Home</a>
              <a href="#courses" className="text-sm font-medium text-black hover:text-[#006d2c] transition-colors">Courses</a>
              <a href="#about" className="text-sm font-medium text-black hover:text-[#006d2c] transition-colors">About</a>
              <a href="#contact" className="text-sm font-medium text-black hover:text-[#006d2c] transition-colors">Contact</a>
              <button onClick={() => navigate("/exhibition")} className="text-sm font-medium text-black hover:text-[#006d2c] transition-colors">Exhibition</button>
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
                onClick={() => navigate("/signup")}
                className="bg-[#006d2c] hover:bg-[#006d2c] text-black font-medium"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Floating Hamburger Menu Button (Mobile Only - Top Left) */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-24 left-6 z-50 bg-[#006d2c] hover:bg-[#006d2c] text-black p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="fixed top-40 left-6 bg-white rounded-2xl shadow-2xl p-6 w-64 animate-in slide-in-from-left-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4">
              <a 
                href="#home" 
                className="text-base font-medium text-black hover:text-[#006d2c] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </a>
              <a 
                href="#courses" 
                className="text-base font-medium text-black hover:text-[#006d2c] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Courses
              </a>
              <a 
                href="#about" 
                className="text-base font-medium text-black hover:text-[#006d2c] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <a 
                href="#contact" 
                className="text-base font-medium text-black hover:text-[#006d2c] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              <button 
                onClick={() => {
                  navigate("/exhibition");
                  setMobileMenuOpen(false);
                }} 
                className="text-base font-medium text-black hover:text-[#006d2c] transition-colors py-2 text-left"
              >
                Exhibition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="home" className="relative z-10 flex items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6" style={{ fontFamily: 'Inter, Poppins, Manrope, sans-serif' }}>
            Get where you're going <span className="text-[#006d2c]">faster</span>
            <br />
            with <span className="text-[#006d2c]">DataPlus Labs</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-medium" style={{ fontFamily: 'Inter, Poppins, Manrope, sans-serif' }}>
            Expand your skills in development, testing, analysis, and designing with our comprehensive courses.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/signup")}
              variant="outline"
              className="bg-white border-gray-300 text-black hover:bg-gray-50 px-8 py-3 text-lg font-medium"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              className="bg-[#006d2c] hover:bg-[#006d2c] text-black px-8 py-3 text-lg font-medium"
            >
              Request Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Powered By Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500 mb-12 font-medium">Powered by DataPlus Labs Technology</p>
          <div className="relative overflow-hidden">
            <div className="flex gap-8 animate-scroll-left">
              {/* First set of logos */}
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 min-w-[180px] flex items-center justify-center flex-shrink-0">
                <img
                  src="/images/dataplus_logggg-removebg-preview.png"
                  alt="DataPlus"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 min-w-[180px] flex items-center justify-center flex-shrink-0">
                <img
                  src="/images/dataplus_logggg-removebg-preview.png"
                  alt="DataPlus Analytics"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 min-w-[180px] flex items-center justify-center flex-shrink-0">
                <img
                  src="/images/dataplus_logggg-removebg-preview.png"
                  alt="DataPlus Learning"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 min-w-[180px] flex items-center justify-center flex-shrink-0">
                <img
                  src="/images/dataplus_logggg-removebg-preview.png"
                  alt="DataPlus Solutions"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 min-w-[180px] flex items-center justify-center flex-shrink-0">
                <img
                  src="/images/dataplus_logggg-removebg-preview.png"
                  alt="DataPlus Academy"
                  className="h-12 w-auto object-contain"
                />
              </div>
              
              {/* Duplicate set for seamless loop */}
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 min-w-[180px] flex items-center justify-center flex-shrink-0">
                <img
                  src="/images/dataplus_logggg-removebg-preview.png"
                  alt="DataPlus"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 min-w-[180px] flex items-center justify-center flex-shrink-0">
                <img
                  src="/images/dataplus_logggg-removebg-preview.png"
                  alt="DataPlus Analytics"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 min-w-[180px] flex items-center justify-center flex-shrink-0">
                <img
                  src="/images/dataplus_logggg-removebg-preview.png"
                  alt="DataPlus Learning"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 min-w-[180px] flex items-center justify-center flex-shrink-0">
                <img
                  src="/images/dataplus_logggg-removebg-preview.png"
                  alt="DataPlus Solutions"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 min-w-[180px] flex items-center justify-center flex-shrink-0">
                <img
                  src="/images/dataplus_logggg-removebg-preview.png"
                  alt="DataPlus Academy"
                  className="h-12 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Tracks Section */}
      <section id="courses" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-black" style={{ fontFamily: 'Inter, Poppins, Manrope, sans-serif' }}>Our Learning Tracks</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Develop your mind & skills by our intense tracks that covers all you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto mb-20">
            {/* Student Track */}
            <div 
              className="group cursor-pointer overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300" 
              onClick={() => navigate("/auth?role=student")}
            >
              <img
                src="/images/students.webp"
                alt="Students"
                className="w-full h-[600px] object-cover transform group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            {/* Teacher Track */}
            <div 
              className="group cursor-pointer overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300" 
              onClick={() => navigate("/auth?role=teacher")}
            >
              <img
                src="/images/teacher.webp"
                alt="Teacher"
                className="w-full h-[600px] object-cover transform group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900" style={{ fontFamily: 'Inter, Poppins, Manrope, sans-serif' }}>
              Features We Offer
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Comprehensive tools and resources designed to enhance your learning experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Course Management Card */}
            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#006d2c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="pt-8 pb-8 px-6 relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <img
                      src="/images/unnamed-removebg-preview.png"
                      alt="Course Management Illustration"
                      className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900 text-center group-hover:text-[#006d2c] transition-colors duration-300">
                  Course Management
                </h3>
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  Create, organize, and deliver engaging course content with our intuitive management system
                </p>
              </CardContent>
            </Card>

            {/* Assignments & Quizzes Card */}
            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#006d2c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="pt-8 pb-8 px-6 relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl transform rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                    <div className="relative bg-white rounded-2xl p-8 shadow-md">
                      <FileText className="h-20 w-20 text-[#006d2c]" />
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900 text-center group-hover:text-[#006d2c] transition-colors duration-300">
                  Assignments & Quizzes
                </h3>
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  Interactive assessments with automated grading and instant feedback for better learning outcomes
                </p>
              </CardContent>
            </Card>

            {/* Real-time Communication Card */}
            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#006d2c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="pt-8 pb-8 px-6 relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl transform -rotate-6 group-hover:-rotate-12 transition-transform duration-500"></div>
                    <div className="relative bg-white rounded-2xl p-8 shadow-md">
                      <MessageSquare className="h-20 w-20 text-[#006d2c]" />
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900 text-center group-hover:text-[#006d2c] transition-colors duration-300">
                  Real-time Communication
                </h3>
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  Connect seamlessly with peers and instructors through integrated group chats and discussions
                </p>
              </CardContent>
            </Card>

            {/* Capstone Project Card - NEW */}
            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white rounded-3xl md:col-span-2 lg:col-span-3">
              <div className="absolute inset-0 bg-gradient-to-br from-[#006d2c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="pt-8 pb-8 px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-8 max-w-4xl mx-auto">
                  <div className="flex-shrink-0">
                    <div className="relative w-64 h-64 flex items-center justify-center">
                      <img
                        src="/images/unnamed-removebg-preview.png"
                        alt="Capstone Project Illustration"
                        className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="font-bold text-2xl mb-4 text-gray-900 group-hover:text-[#006d2c] transition-colors duration-300">
                      Capstone Project
                    </h3>
                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                      Apply your knowledge in real-world scenarios with comprehensive capstone projects. Work on industry-relevant challenges,
                      collaborate with peers, and showcase your skills through practical implementations that demonstrate your mastery of the subject matter.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <span className="px-4 py-2 bg-[#006d2c]/10 text-[#006d2c] rounded-full text-sm font-medium">
                        Real-world Projects
                      </span>
                      <span className="px-4 py-2 bg-[#006d2c]/10 text-[#006d2c] rounded-full text-sm font-medium">
                        Industry Standards
                      </span>
                      <span className="px-4 py-2 bg-[#006d2c]/10 text-[#006d2c] rounded-full text-sm font-medium">
                        Portfolio Building
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 via-white to-green-100 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-black" style={{ fontFamily: 'Inter, Poppins, Manrope, sans-serif' }}>What our happy Students say about us</h2>
          </div>

          {/* Animated scrolling container */}
          <div className="relative">
            <div className="flex gap-6 animate-scroll-rtl">
              {/* First set of testimonials */}
              <div className="flex-shrink-0 w-[350px] bg-[#006d2c] rounded-3xl p-8 relative shadow-lg">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#006d2c] to-[#006d2c] border-4 border-white"></div>
                </div>
                <div className="mt-8">
                  <div className="text-white text-5xl font-bold mb-4">"</div>
                  <h3 className="font-bold text-white text-center mb-4">Uwimana Aline</h3>
                  <p className="text-white/90 text-sm text-center leading-relaxed mb-6">
                    DataPlus Labs has transformed my understanding of data analytics. The courses are comprehensive and practical!
                  </p>
                  <div className="flex gap-1 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-white text-white" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 w-[350px] bg-white rounded-3xl p-8 relative border-2 border-[#006d2c] shadow-lg">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-green-200 border-4 border-white"></div>
                </div>
                <div className="mt-8">
                  <div className="text-[#006d2c] text-5xl font-bold mb-4">"</div>
                  <h3 className="font-bold text-black text-center mb-4">Nkurunziza Jean</h3>
                  <p className="text-gray-600 text-sm text-center leading-relaxed mb-6">
                    Excellent platform for learning data science. The instructors are knowledgeable and supportive.
                  </p>
                  <div className="flex gap-1 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-[#006d2c] text-[#006d2c]" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 w-[350px] bg-white rounded-3xl p-8 relative border-2 border-green-200 shadow-lg">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#006d2c] to-green-300 border-4 border-white"></div>
                </div>
                <div className="mt-8">
                  <div className="text-green-400 text-5xl font-bold mb-4">"</div>
                  <h3 className="font-bold text-black text-center mb-4">Mukamana Grace</h3>
                  <p className="text-gray-600 text-sm text-center leading-relaxed mb-6">
                    I love how DataPlus Labs makes complex data concepts easy to understand. Highly recommended!
                  </p>
                  <div className="flex gap-1 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-green-400 text-green-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Duplicate set for seamless loop */}
              <div className="flex-shrink-0 w-[350px] bg-[#006d2c] rounded-3xl p-8 relative shadow-lg">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#006d2c] to-[#006d2c] border-4 border-white"></div>
                </div>
                <div className="mt-8">
                  <div className="text-white text-5xl font-bold mb-4">"</div>
                  <h3 className="font-bold text-white text-center mb-4">Uwimana Aline</h3>
                  <p className="text-white/90 text-sm text-center leading-relaxed mb-6">
                    DataPlus Labs has transformed my understanding of data analytics. The courses are comprehensive and practical!
                  </p>
                  <div className="flex gap-1 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-white text-white" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 w-[350px] bg-white rounded-3xl p-8 relative border-2 border-[#006d2c] shadow-lg">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-green-200 border-4 border-white"></div>
                </div>
                <div className="mt-8">
                  <div className="text-[#006d2c] text-5xl font-bold mb-4">"</div>
                  <h3 className="font-bold text-black text-center mb-4">Nkurunziza Jean</h3>
                  <p className="text-gray-600 text-sm text-center leading-relaxed mb-6">
                    Excellent platform for learning data science. The instructors are knowledgeable and supportive.
                  </p>
                  <div className="flex gap-1 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-[#006d2c] text-[#006d2c]" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 w-[350px] bg-white rounded-3xl p-8 relative border-2 border-green-200 shadow-lg">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#006d2c] to-green-300 border-4 border-white"></div>
                </div>
                <div className="mt-8">
                  <div className="text-green-400 text-5xl font-bold mb-4">"</div>
                  <h3 className="font-bold text-black text-center mb-4">Mukamana Grace</h3>
                  <p className="text-gray-600 text-sm text-center leading-relaxed mb-6">
                    I love how DataPlus Labs makes complex data concepts easy to understand. Highly recommended!
                  </p>
                  <div className="flex gap-1 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-green-400 text-green-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#006d2c] to-[#006d2c] text-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Inter, Poppins, Manrope, sans-serif' }}>Ready to start learning?</h2>
          <p className="text-lg mb-8 opacity-80">
            Join thousands of students and teachers already using DataPlus Labs
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/signup")}
            className="bg-white text-black hover:bg-gray-100 border border-gray-300"
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-green-50 via-white to-green-100 py-16">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-lg p-12 max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-12 mb-8">
              {/* Brand Section */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="/images/dataplus_logggg-removebg-preview.png"
                    alt="DataPlus Logo"
                    className="w-10 h-10 object-contain"
                  />
                  <span className="text-xl font-bold text-black">DataPlus Labs</span>
                </div>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  DataPlus Labs empowers teams to transform raw data into clear, compelling visuals — making insights easier to share, understand, and act on.
                </p>
                <div className="flex items-center gap-4">
                  <a href="#" className="text-gray-600 hover:text-[#006d2c] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-[#006d2c] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-[#006d2c] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-[#006d2c] transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Product Links */}
              <div>
                <h3 className="font-bold text-black mb-4">Product</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#courses" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                      Courses
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                      Integrations
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                      Changelog
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources Links */}
              <div>
                <h3 className="font-bold text-black mb-4">Resources</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                      Tutorials
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                      Support
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h3 className="font-bold text-black mb-4">Company</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#about" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                      Partners
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">
                © 2025 DataPlus Labs. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a href="#" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-sm text-gray-600 hover:text-[#006d2c] transition-colors">
                  Cookie Settings
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
