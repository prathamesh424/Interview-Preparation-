import { supabase } from "@/integrations/supabase/client";
import { Question, QuestionFeedback } from "@/types"; // Assuming these types are relevant

// Interface for the data structure expected by the Supabase table
// Adjust properties based on your actual table schema
export interface SavedPracticeData {
  question_id?: string; // Original question ID if available
  question_text: string;
  question_type: string;
  difficulty: string;
  user_answer: string;
  feedback: QuestionFeedback | null; // Store the feedback object as JSONB
  category?: string | null;
  sub_category?: string | null; // Add optional sub_category field
  user_id: string; // User who saved it
  created_at?: string; // Add the timestamp field
}

export const practiceService = {
  /**
   * Saves a completed practice question attempt to the database.
   * @param data - The data to save.
   */
  async savePracticeAttempt(data: Omit<SavedPracticeData, 'user_id'>): Promise<any> {
    console.log("Attempting to save practice data:", data);

    // 1. Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error getting session:", sessionError);
      throw new Error("Authentication error: Could not get user session.");
    }
    if (!session?.user?.id) {
      throw new Error("User not authenticated.");
    }

    const userId = session.user.id;

    // 2. Prepare data for insertion
    const dataToInsert: SavedPracticeData = {
      ...data,
      user_id: userId,
    };

    // 3. Insert into the Supabase table, casting feedback to 'any' to satisfy Supabase client types
    const { data: insertedData, error: insertError } = await supabase
      .from('saved_practice_questions') // Make sure 'saved_practice_questions' is your table name
      .insert({ ...dataToInsert, feedback: dataToInsert.feedback as any }) // Cast feedback
      .select() // Optionally select the inserted data back
      .single(); // Assuming you insert one record

    if (insertError) {
      console.error("Error saving practice attempt to Supabase:", insertError);
      // Provide more specific error messages if possible
      if (insertError.code === '23503') { // Example: Foreign key violation
       throw new Error("Failed to save: Invalid reference data.");
      }
      // Log the full error object for detailed debugging
      console.error("Full Supabase insert error object:", JSON.stringify(insertError, null, 2));
      throw new Error(`Database error: ${insertError.message || 'Unknown error during insert'}`); // Provide fallback message
    }

    console.log("Practice attempt saved successfully:", insertedData);
    return insertedData;
  },

  /**
   * Fetches all saved practice attempts for the current user.
   */
  async getSavedPracticeAttempts(): Promise<SavedPracticeData[]> {
    console.log("Fetching saved practice attempts...");

    // 1. Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error getting session:", sessionError);
      throw new Error("Authentication error: Could not get user session.");
    }
    if (!session?.user?.id) {
      // Return empty array if user is not logged in, or throw error depending on desired behavior
      console.log("User not authenticated, returning empty array.");
      return [];
      // throw new Error("User not authenticated.");
    }

    const userId = session.user.id;

    // 2. Fetch data from the Supabase table for the user
    const { data: savedAttempts, error: fetchError } = await supabase
      .from('saved_practice_questions')
      .select('*') // Select all columns
      .eq('user_id', userId) // Filter by the current user's ID
      .order('created_at', { ascending: false }); // Order by creation date, newest first

    if (fetchError) {
      console.error("Error fetching saved practice attempts from Supabase:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    console.log(`Fetched ${savedAttempts?.length ?? 0} saved practice attempts.`);
    // Ensure feedback is parsed if stored as string, though JSONB should handle it
    // Supabase client usually handles JSONB parsing automatically
    // Cast the fetched data back to the expected type safely
    return (savedAttempts?.map(attempt => ({
      ...attempt,
      // Cast to unknown first, then to the specific type
      feedback: attempt.feedback as unknown as QuestionFeedback | null
    })) || []) as SavedPracticeData[];
  },

  /**
   * Fetches unique, non-null categories for the current user.
   */
  async getUniqueCategories(): Promise<string[]> {
    console.log("Fetching unique categories...");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.log("User not authenticated, returning empty categories.");
      return [];
    }

    // Use RPC or a view for distinct potentially, but direct select is fine for moderate data
    const { data, error } = await supabase
      .from('saved_practice_questions')
      .select('category')
      .eq('user_id', session.user.id)
      .not('category', 'is', null); // Exclude null categories

    if (error) {
      console.error("Error fetching unique categories:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Extract unique, non-empty categories
    const uniqueCategories = Array.from(
      new Set(data?.map(item => item.category?.trim()).filter(Boolean) as string[])
    ).sort();

    console.log("Fetched unique categories:", uniqueCategories);
    return uniqueCategories;
  },

  /**
   * Fetches unique, non-null sub-categories for a given category for the current user.
   * @param category - The category to fetch sub-categories for.
   */
  async getUniqueSubCategories(category: string): Promise<string[]> {
    console.log(`Fetching unique sub-categories for category: ${category}...`);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.log("User not authenticated, returning empty sub-categories.");
      return [];
    }

    const { data, error } = await supabase
      .from('saved_practice_questions')
      .select('sub_category')
      .eq('user_id', session.user.id)
      .eq('category', category) // Filter by the provided category
      .not('sub_category', 'is', null); // Exclude null sub-categories

    if (error) {
      console.error("Error fetching unique sub-categories:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Extract unique, non-empty sub-categories
    const uniqueSubCategories = Array.from(
      new Set(data?.map(item => item.sub_category?.trim()).filter(Boolean) as string[])
    ).sort();

    console.log(`Fetched unique sub-categories for ${category}:`, uniqueSubCategories);
    return uniqueSubCategories;
  }
};
