import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './i18n/config';
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherSchedule from "./pages/TeacherSchedule";
import CourseDetail from "./pages/CourseDetail";
import CreateCourse from "./pages/CreateCourse";
import Exhibition from "./pages/Exhibition";
import StudentOnboarding from "./pages/StudentOnboarding";
import TeacherOnboarding from "./pages/TeacherOnboarding";
import TeacherChat from "./pages/TeacherChat";
import StudentChat from "./pages/StudentChat";
import StudentSchedule from "./pages/StudentSchedule";
import StudentCertificates from "./pages/StudentCertificates";
import BrowseCourses from "./pages/BrowseCourses";
import MyCourses from "./pages/MyCourses";
import StudentSettings from "./pages/StudentSettings";
import StudentAssignments from "./pages/StudentAssignments";
import StudentScores from "./pages/StudentScores";
import TeacherSettings from "./pages/TeacherSettings";
import TeacherAssignments from "./pages/TeacherAssignments";
import TeacherGrades from "./pages/TeacherGrades";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TeacherStudents from "./pages/TeacherStudents";
import NotFound from "./pages/NotFound";
import AuthCallback from "./components/AuthCallback";
import RoleDebugger from "./components/RoleDebugger";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTeacherApprovals from "./pages/AdminTeacherApprovals";
import AdminUsers from "./pages/AdminUsers";
import AdminLogs from "./pages/AdminLogs";
import AdminCourses from "./pages/AdminCourses";
import AdminModeration from "./pages/AdminModeration";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSettings from "./pages/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/chat" element={<StudentChat />} />
          <Route path="/student/schedule" element={<StudentSchedule />} />
          <Route path="/student/certificates" element={<StudentCertificates />} />
          <Route path="/student/my-courses" element={<MyCourses />} />
          <Route path="/student/assignments" element={<StudentAssignments />} />
          <Route path="/student/scores" element={<StudentScores />} />
          <Route path="/student/settings" element={<StudentSettings />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/schedule" element={<TeacherSchedule />} />
          <Route path="/teacher/chat" element={<TeacherChat />} />
          <Route path="/teacher/students" element={<TeacherStudents />} />
          <Route path="/teacher/assignments" element={<TeacherAssignments />} />
          <Route path="/teacher/grades" element={<TeacherGrades />} />
          <Route path="/teacher/settings" element={<TeacherSettings />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/create-course" element={<CreateCourse />} />
          <Route path="/courses" element={<BrowseCourses />} />
          <Route path="/exhibition" element={<Exhibition />} />
          <Route path="/onboarding" element={<StudentOnboarding />} />
          <Route path="/student/onboarding" element={<StudentOnboarding />} />
          <Route path="/teacher/onboarding" element={<TeacherOnboarding />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/debug" element={<RoleDebugger />} />
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/teacher-approvals" element={<AdminTeacherApprovals />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/moderation" element={<AdminModeration />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
