import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { TeacherHeader } from "@/components/TeacherHeader";
import { Globe, Lock, LogOut, Shield, KeyRound } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

const TeacherSettings = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    // Load saved language preference from localStorage
    const savedLanguage = localStorage.getItem("language") || "en";
    setLanguage(savedLanguage);
  }, []);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    localStorage.setItem("language", value);
    toast.success(`Language changed to ${value === "en" ? "English" : "French"}`);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset email sent! Check your inbox.");
      setShowResetDialog(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col">
          <TeacherHeader 
            title="Settings"
            subtitle="Manage your account preferences"
          />

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4">
            <div className="container mx-auto max-w-4xl space-y-6">
              {/* Language */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Globe className="h-5 w-5" />
                    Language
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Choose your preferred language
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="language" className="dark:text-white">Select Language</Label>
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger id="language" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                        <SelectItem value="en" className="dark:text-white dark:focus:bg-gray-600">
                          English
                        </SelectItem>
                        <SelectItem value="fr" className="dark:text-white dark:focus:bg-gray-600">
                          Français (French)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Lock className="h-5 w-5" />
                    Security
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base dark:text-white">Reset Password</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Send a password reset link to your email
                      </p>
                    </div>
                    <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600">
                          <KeyRound className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="dark:text-white">Reset Password</AlertDialogTitle>
                          <AlertDialogDescription className="dark:text-gray-400">
                            Enter your email address and we'll send you a link to reset your password.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                          <Input
                            type="email"
                            placeholder="your.email@example.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleForgotPassword}
                            disabled={loading}
                            className="bg-[#006d2c] hover:bg-[#005523] text-white"
                          >
                            {loading ? "Sending..." : "Send Reset Link"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>

              {/* Privacy */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Shield className="h-5 w-5" />
                    Privacy & Legal
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Review our policies and terms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full justify-start dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                    onClick={() => navigate("/privacy-policy")}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Privacy Policy
                  </Button>
                </CardContent>
              </Card>

              <Separator className="dark:bg-gray-700" />

              {/* Sign Out */}
              <Card className="border-red-200 dark:border-red-900 dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Sign out of your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-white">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-gray-400">
                          You will be signed out of your account and redirected to the login page.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleSignOut}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {loading ? "Signing out..." : "Sign Out"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TeacherSettings;
