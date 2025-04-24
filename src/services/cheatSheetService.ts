import { supabase } from "@/integrations/supabase/client";
import { CheatSheetData, StudyPlanItem } from "@/types"; // Assuming CheatSheetData is defined

// Define the structure of the data stored in the DB if different from CheatSheetData
// For now, assume generated_data directly stores CheatSheetData
export interface SavedCheatSheet {
  id: string;
  user_id: string;
  study_plan_item_id?: string | null;
  topic_title: string;
  generated_data: CheatSheetData;
  completed_subtopics: number[]; // Array of completed day numbers
  created_at: string;
  updated_at: string;
}

interface SaveCheatSheetPayload {
  studyPlanItemId?: string | null; // Optional link
  topicTitle: string;
  generatedData: CheatSheetData;
  userId: string; // Explicitly pass userId
}

export const cheatSheetService = {
  // --- Save a new cheat sheet ---
  async saveCheatSheet(payload: SaveCheatSheetPayload): Promise<{ data?: SavedCheatSheet; error?: any }> {
    console.log("Saving cheat sheet to Supabase", payload);
    try {
      // RLS Policy should ensure user_id matches authenticated user
      const { data, error } = await supabase
        .from('ai_cheat_sheets')
        .insert({
          user_id: payload.userId, // Make sure this matches the authenticated user's ID
          study_plan_item_id: payload.studyPlanItemId,
          topic_title: payload.topicTitle,
          generated_data: payload.generatedData,
          completed_subtopics: [], // Initialize as empty
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error saving cheat sheet:", error);
      return { data: undefined, error };
    }
  },

  // --- Get all cheat sheets for the current user ---
  async getCheatSheetsForUser(userId: string): Promise<{ data?: SavedCheatSheet[]; error?: any }> {
    console.log("Fetching cheat sheets for user from Supabase", userId);
    try {
      // RLS Policy should restrict this to the authenticated user's data
      const { data, error } = await supabase
        .from('ai_cheat_sheets')
        .select('*')
        .eq('user_id', userId) // Filter by user ID (good practice even with RLS)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Error fetching cheat sheets:", error);
      return { data: undefined, error };
    }
  },

  // --- Get a specific cheat sheet by its ID ---
  async getCheatSheetById(id: string, userId: string): Promise<{ data?: SavedCheatSheet; error?: any }> {
    console.log("Fetching cheat sheet by ID from Supabase", id);
    try {
      // RLS Policy must ensure user owns this ID
      const { data, error } = await supabase
        .from('ai_cheat_sheets')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId) // Explicitly check user ID for safety
        .single();

      if (error) {
        // Handle case where sheet not found (PGRST116) vs other errors
        if (error.code === 'PGRST116') {
          return { data: undefined, error: { message: 'Cheat sheet not found or access denied.' } };
        }
        throw error;
      }
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching cheat sheet by ID:", error);
      return { data: undefined, error };
    }
  },

  // --- Update the completed subtopics array ---
  async updateCompletedSubtopics(id: string, completedDaysArray: number[], userId: string): Promise<{ data?: SavedCheatSheet; error?: any }> {
    console.log("Updating completed subtopics in Supabase for", id, completedDaysArray);
    try {
      // RLS Policy must ensure user owns this ID
      const { data, error } = await supabase
        .from('ai_cheat_sheets')
        .update({ 
            completed_subtopics: completedDaysArray,
            updated_at: new Date().toISOString() 
          })
        .eq('id', id)
        .eq('user_id', userId) // Explicitly check user ID for safety
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error updating completed subtopics:", error);
      return { data: undefined, error };
    }
  },

  // --- Delete a specific cheat sheet ---
  async deleteCheatSheet(id: string, userId: string): Promise<{ error?: any }> {
    console.log("Deleting cheat sheet from Supabase", id);
    try {
      // RLS Policy must ensure user owns this ID
      const { error } = await supabase
        .from('ai_cheat_sheets')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // Explicitly check user ID for safety

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error deleting cheat sheet:", error);
      return { error };
    }
  },
};
