import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Users, BookOpenCheck, MessageSquare, FileText, Play, Star } from "lucide-react";
import heroImage from "@/assets/hero-students.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">DataPlus</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#home" className="text-sm font-medium hover:text-primary transition-colors">Home</a>
            <a href="#courses" className="text-sm font-medium hover:text-primary transition-colors">Courses</a>
            <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">About</a>
            <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
            <Button onClick={() => navigate("/auth")} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Decorative Shapes */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-accent/30 rounded-full"></div>
        
        <div className="container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Get where you're going{" "}
                  <span className="relative">
                    faster with
                    <div className="absolute -inset-2 bg-gradient-to-r from-accent to-primary rounded-lg opacity-20 blur-lg"></div>
                  </span>
                  <br />
                  <span className="inline-block mt-2 px-4 py-2 bg-gradient-to-r from-accent to-primary text-white rounded-full">
                    DataPlus
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Expand your skills in development, testing, analysis, and designing with our comprehensive courses.
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Button size="lg" onClick={() => navigate("/auth")} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  Get Started
                </Button>
                <Button size="lg" variant="ghost" className="gap-2">
                  <Play className="h-4 w-4" />
                  Watch Video
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div>
                  <div className="text-3xl font-bold text-primary">20M</div>
                  <div className="text-sm text-muted-foreground">Views</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">50K</div>
                  <div className="text-sm text-muted-foreground">Students</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">4K</div>
                  <div className="text-sm text-muted-foreground">Certificates</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-2xl"></div>
              <img 
                src={heroImage} 
                alt="Students learning" 
                className="relative rounded-2xl shadow-2xl w-full"
              />
              {/* Floating Card */}
              <div className="absolute bottom-8 left-8 bg-card/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent"></div>
                  <div>
                    <div className="font-semibold">Active Learners</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      <Star className="h-3 w-3 fill-accent text-accent" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-8">Trusted by leading companies</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
            <div className="text-2xl font-bold">Upwork</div>
            <div className="text-2xl font-bold">Microsoft</div>
            <div className="text-2xl font-bold">Zendesk</div>
            <div className="text-2xl font-bold">Google</div>
            <div className="text-2xl font-bold">Amazon</div>
          </div>
        </div>
      </section>

      {/* Course Tracks Section */}
      <section id="courses" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Learning Tracks</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Develop your mind & skills by our intense tracks that covers all you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
            <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate("/auth")}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>I'm a Student</CardTitle>
                </div>
                <CardDescription>
                  Access courses, submit assignments, and join online classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <BookOpenCheck className="h-4 w-4 text-primary" />
                    Browse and enroll in courses
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Submit assignments and take quizzes
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Chat with peers and teachers
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate("/auth")}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>I'm a Teacher</CardTitle>
                </div>
                <CardDescription>
                  Create courses, manage students, and track progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-accent" />
                    Create and manage courses
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent" />
                    Create assignments and quizzes
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-accent" />
                    Engage with students
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Platform Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need for modern online learning
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Course Management</h3>
                <p className="text-sm text-muted-foreground">
                  Create, organize, and deliver engaging course content with ease
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Assignments & Quizzes</h3>
                <p className="text-sm text-muted-foreground">
                  Interactive assessments with automated grading and feedback
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Real-time Communication</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with peers and instructors through group chats
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">What our happy Students say about us</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  "The courses are well-structured and easy to follow. I've learned so much in just a few months!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent"></div>
                  <div>
                    <div className="font-semibold text-sm">Sarah Johnson</div>
                    <div className="text-xs text-muted-foreground">Web Developer</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  "Great platform with excellent instructors. The interactive features make learning enjoyable."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary"></div>
                  <div>
                    <div className="font-semibold text-sm">Michael Chen</div>
                    <div className="text-xs text-muted-foreground">Data Analyst</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  "I love how accessible and user-friendly this platform is. Highly recommended!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent"></div>
                  <div>
                    <div className="font-semibold text-sm">Emily Rodriguez</div>
                    <div className="text-xs text-muted-foreground">UI Designer</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to start learning?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of students and teachers already using DataPlus
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="bg-white text-primary hover:bg-white/90">
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 DataPlus Learning Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
