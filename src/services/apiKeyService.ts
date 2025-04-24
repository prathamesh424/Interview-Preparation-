
import { supabase } from "@/integrations/supabase/client";

// Service for managing Gemini API keys in Supabase
export const apiKeyService = {
  // Save API key to Supabase database
  async saveApiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: "Not authenticated" };
      }

      // Check if an API key already exists for this user
      const { data: existingKey, error: fetchError } = await supabase
        .from('api_keys')
        .select('id')
        .eq('service_name', 'gemini')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // If API key exists, update it; otherwise, insert a new one
      if (existingKey) {
        const { error } = await supabase
          .from('api_keys')
          .update({ 
            key_value: apiKey, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', existingKey.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('api_keys')
          .insert({
            user_id: user.id,
            service_name: 'gemini',
            key_value: apiKey
          });

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error("Error saving API key:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      };
    }
  },

  // Get API key from Supabase database
  async getApiKey(): Promise<{ key?: string; error?: string }> {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { error: "Not authenticated" };
      }

      const { data, error } = await supabase
        .from('api_keys')
        .select('key_value')
        .eq('service_name', 'gemini')
        .eq('user_id', user.id)
        .single();

      if (error) {
        return { error: error.message };
      }

      return { key: data?.key_value };
    } catch (error) {
      console.error("Error getting API key:", error);
      return { 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      };
    }
  },

  // Delete API key from Supabase database
  async clearApiKey(): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: "Not authenticated" };
      }

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('service_name', 'gemini')
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error clearing API key:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      };
    }
  },

  // Check if API key exists in Supabase database
  async hasApiKey(): Promise<boolean> {
    const { key, error } = await this.getApiKey();
    return !error && !!key;
  }
};
