
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

export const authServiceSupabase = {
  async signUp(email: string, password: string, name: string): Promise<User> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;
      
      if (!data.user) {
        throw new Error("Sign up successful, but no user was returned");
      }

      return {
        id: data.user.id,
        email: data.user.email || "",
        name: (data.user.user_metadata as { name?: string })?.name || "",
      };
    } catch (error) {
      console.error("Error in signUp:", error);
      throw error;
    }
  },

  async signIn(email: string, password: string): Promise<User> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (!data.user) {
        throw new Error("Sign in successful, but no user was returned");
      }

      return {
        id: data.user.id,
        email: data.user.email || "",
        name: (data.user.user_metadata as { name?: string })?.name || "",
      };
    } catch (error) {
      console.error("Error in signIn:", error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error in signOut:", error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) return null;

      return {
        id: data.user.id,
        email: data.user.email || "",
        name: (data.user.user_metadata as { name?: string })?.name || "",
      };
    } catch (error) {
      console.error("Error in getCurrentUser:", error);
      return null;
    }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        const user = {
          id: session.user.id,
          email: session.user.email || "",
          name: (session.user.user_metadata as { name?: string })?.name || "",
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  }
};
