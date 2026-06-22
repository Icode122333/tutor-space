/**
 * AuthContext — single source of truth for session + profile.
 *
 * CRITICAL: Never call supabase.from() synchronously inside onAuthStateChange.
 * Supabase holds an internal lock while notifying subscribers. Calling any
 * supabase client method inside the callback sends the request WITHOUT the JWT
 * (anon request), so RLS blocks the row and you get null data.
 * Solution: defer DB calls with setTimeout(0).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AppProfile = Record<string, unknown>;

type AuthContextValue = {
  user: User | null;
  profile: AppProfile | null;
  /** True while the initial session + profile are being resolved. */
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    /**
     * Fetch profile in a macrotask (setTimeout 0) so we are fully outside
     * Supabase's auth-state-change lock. The JWT is then included in the
     * Authorization header and RLS passes.
     */
    const scheduleProfileFetch = (userId: string) => {
      setTimeout(async () => {
        if (!mounted) return;

        // One retry after 400 ms in case of transient PostgREST hiccup.
        let data: AppProfile | null = null;
        for (const wait of [0, 400]) {
          if (wait > 0) await new Promise((r) => setTimeout(r, wait));
          if (!mounted) return;

          const result = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

          if (result.data) {
            data = result.data as AppProfile;
            break;
          }
        }

        if (!mounted) return;

        if (!data) {
          console.error("Profile not found after retries — signing out");
          toast.error("Could not load your profile. Please sign in again.");
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(data);
        setLoading(false);
      }, 0);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (!session?.user) {
        // SIGNED_OUT or no session on first load.
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // INITIAL_SESSION (existing session) or SIGNED_IN (fresh login).
      setUser(session.user);
      setLoading(true);
      scheduleProfileFetch(session.user.id);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed out successfully");
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAppAuth must be used within <AuthProvider>");
  return ctx;
}
