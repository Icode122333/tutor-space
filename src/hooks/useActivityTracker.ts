import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to track user activity and update last_activity in the database
 * This enables accurate "online users" counting in the admin dashboard
 */
export const useActivityTracker = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateActivity = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Call the RPC function to update last_activity
          await supabase.rpc('update_user_activity');
        }
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.debug('Activity update failed:', error);
      }
    };

    // Update activity immediately on mount
    updateActivity();

    // Update activity every 2 minutes while the user is active
    intervalRef.current = setInterval(updateActivity, 2 * 60 * 1000);

    // Also update on user interactions
    const handleActivity = () => {
      updateActivity();
    };

    // Listen for user activity events
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('mousemove', handleActivity);

    // Debounce the activity updates to avoid too many calls
    let activityTimeout: NodeJS.Timeout | null = null;
    const debouncedActivity = () => {
      if (activityTimeout) clearTimeout(activityTimeout);
      activityTimeout = setTimeout(updateActivity, 30000); // Update at most every 30 seconds
    };

    window.addEventListener('click', debouncedActivity);
    window.addEventListener('keypress', debouncedActivity);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', debouncedActivity);
      window.removeEventListener('keypress', debouncedActivity);
    };
  }, []);
};
