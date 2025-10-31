import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Processing auth callback...");
        
        // Handle the OAuth callback
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error("Auth error:", authError);
          toast.error(authError.message);
          navigate("/auth");
          return;
        }

        // If no session, try to get it from the URL hash
        if (!authData.session) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          
          if (accessToken) {
            // Wait a moment for Supabase to process the session
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: retryData } = await supabase.auth.getSession();
            
            if (retryData.session) {
              await processUser(retryData.session.user);
              return;
            }
          }
          
          console.log("No session found, redirecting to auth");
          navigate("/auth");
          return;
        }

        await processUser(authData.session.user);
        
      } catch (error: any) {
        console.error("Auth callback error:", error);
        toast.error("Authentication failed. Please try again.");
        navigate("/auth");
      } finally {
        setIsProcessing(false);
      }
    };

    const processUser = async (user: any) => {
      try {
        console.log("Processing user:", user.id);
        
        // Check if profile exists
        const { data: existingProfile, error: profileFetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileFetchError && profileFetchError.code !== 'PGRST116') {
          console.error("Profile fetch error:", profileFetchError);
          throw profileFetchError;
        }

        if (!existingProfile) {
          console.log("Creating new profile for user");
          
          // Get role from URL params (for OAuth signup) or user metadata (for email verification)
          const role = searchParams.get("role") || user.user_metadata?.role || "student";
          console.log("Selected role:", role);
          
          // Create profile for new user (OAuth or email verification)
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
              role: role as "student" | "teacher",
              avatar_url: user.user_metadata?.avatar_url || null,
              onboarding_completed: false,
            });

          if (profileError) {
            console.error("Profile creation error:", profileError);
            toast.error("Error creating profile. Please try again.");
            navigate("/auth");
            return;
          }

          console.log("Profile created successfully with role:", role);
          toast.success(`Welcome! Let's complete your profile setup.`);
          // Redirect to appropriate onboarding based on role
          navigate(role === "teacher" ? "/teacher/onboarding" : "/onboarding");
        } else {
          console.log("Existing user found with role:", existingProfile.role);
          
          // Check if onboarding is completed
          if (!existingProfile.onboarding_completed) {
            console.log("Onboarding not completed, redirecting to onboarding");
            toast.info("Please complete your profile setup");
            // Redirect to appropriate onboarding based on role
            navigate(existingProfile.role === "teacher" ? "/teacher/onboarding" : "/onboarding");
          } else {
            // Existing user with completed onboarding, redirect to dashboard
            toast.success("Signed in successfully!");
            navigate(existingProfile.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
          }
        }
      } catch (error: any) {
        console.error("Error processing user:", error);
        toast.error("Error processing authentication. Please try again.");
        navigate("/auth");
      }
    };

    // Add a small delay to ensure the URL is fully loaded
    const timer = setTimeout(handleAuthCallback, 500);
    
    return () => clearTimeout(timer);
  }, [navigate, searchParams]);

  if (!isProcessing) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Completing authentication...</p>
        <p className="text-gray-400 text-sm mt-2">Please wait while we set up your account</p>
      </div>
    </div>
  );
};

export default AuthCallback;