import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          toast.error(error.message);
          navigate("/auth");
          return;
        }

        if (data.session?.user) {
          const user = data.session.user;
          
          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (!existingProfile) {
            // Get role from URL params (for signup flow)
            const role = searchParams.get("role") || "student";
            
            // Create profile for OAuth user
            const { error: profileError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                email: user.email!,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
                role: role as "student" | "teacher",
                avatar_url: user.user_metadata?.avatar_url || null,
              });

            if (profileError) {
              console.error("Profile creation error:", profileError);
              toast.error("Error creating profile. Please try again.");
              navigate("/auth");
              return;
            }

            toast.success("Account created successfully!");
            navigate(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
          } else {
            // Existing user, redirect to appropriate dashboard
            toast.success("Signed in successfully!");
            navigate(existingProfile.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
          }
        } else {
          navigate("/auth");
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        toast.error("Authentication failed. Please try again.");
        navigate("/auth");
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;