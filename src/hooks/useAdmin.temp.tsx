import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useAdmin() {
  const { user } = useAuth();

  const { data: isAdmin, isLoading, error } = useQuery({
    queryKey: ['admin-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      try {
        // Versão temporária que verifica diretamente na tabela profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking admin status:', error);
          return false;
        }
        
        return data?.role === 'admin';
      } catch (err) {
        console.error('Error in admin check:', err);
        return false;
      }
    },
    enabled: !!user?.id,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    isAdmin: isAdmin || false,
    isLoading,
    error,
  };
}
