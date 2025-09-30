import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Users, BookOpenCheck, MessageSquare, FileText } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-primary/10">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            DataPlus Learning Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            A modern learning platform connecting students and teachers for seamless education
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="mr-4">
            Get Started
          </Button>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/auth")}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
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

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/auth")}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-accent/10">
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

        {/* Features Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8">Platform Features</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-lg bg-card border">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Course Management</h3>
              <p className="text-sm text-muted-foreground">
                Create, organize, and deliver engaging course content
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border">
              <FileText className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Assignments & Quizzes</h3>
              <p className="text-sm text-muted-foreground">
                Interactive assessments with automated grading
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border">
              <MessageSquare className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Group Communication</h3>
              <p className="text-sm text-muted-foreground">
                Real-time chat for student collaboration
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
