import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types"; // Import the generated Database type

// Define types based on the new tables (using generated types is safer)
// Define types based on the new tables (using generated types is safer)
export type QuestionSheet = Database['public']['Tables']['question_sheets']['Row']; // Use generated type directly
export type SheetQuestion = Database['public']['Tables']['sheet_questions']['Row'];
export type UserSheetProgress = Database['public']['Tables']['user_sheet_progress']['Row'];

export const sheetService = {
  /**
   * Fetches all available question sheets.
   */
  async getQuestionSheets(): Promise<QuestionSheet[]> {
    console.log("Fetching question sheets...");
    // Reverting to underscore as expected by TypeScript types
    // Fetching question sheets, ordering by 'name' as expected by generated types
    const { data, error } = await supabase
      .from('question_sheets')
      .select('*')
      .order('name', { ascending: true }); // Order by name

    if (error) {
      console.error("Error fetching question sheets:", error);
      throw new Error(`Database error: ${error.message}`);
    }
    console.log(`Fetched ${data?.length ?? 0} question sheets.`);
    return data || [];
  },

  /**
   * Fetches all questions for a specific sheet.
   * @param sheetId - The ID of the sheet.
   */
  async getSheetQuestions(sheetId: string): Promise<SheetQuestion[]> {
    console.log(`Fetching questions for sheet ID: ${sheetId}...`);
    // Assuming sheet_questions table name uses underscore as generated
    const { data, error } = await supabase
      .from('sheet_questions')
      .select('*')
      .eq('sheet_id', sheetId) // This assumes sheet_id in sheet_questions references the ID from question—sheets
      .order('created_at', { ascending: true }); // Or order by topic, difficulty etc.

    if (error) {
      console.error(`Error fetching questions for sheet ${sheetId}:`, error);
      throw new Error(`Database error: ${error.message}`);
    }
    console.log(`Fetched ${data?.length ?? 0} questions for sheet ${sheetId}.`);
    return data || [];
  },

  /**
   * Fetches the progress (completed question IDs) for a specific user and sheet.
   * @param sheetId - The ID of the sheet.
   */
  async getUserSheetProgress(sheetId: string): Promise<Set<string>> {
    console.log(`Fetching progress for sheet ID: ${sheetId}...`);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.log("User not authenticated, returning empty progress.");
      return new Set();
    }
    const userId = session.user.id;

    const { data, error } = await supabase
      .from('user_sheet_progress')
      .select('question_id') // Only need the question IDs
      .eq('user_id', userId)
      .eq('sheet_id', sheetId);

    if (error) {
      console.error(`Error fetching progress for sheet ${sheetId}:`, error);
      throw new Error(`Database error: ${error.message}`);
    }

    const completedIds = new Set(data?.map(item => item.question_id) || []);
    console.log(`Fetched progress for sheet ${sheetId}, completed count: ${completedIds.size}`);
    return completedIds;
  },

  /**
   * Marks a question on a sheet as completed for the current user.
   * @param sheetId - The ID of the sheet.
   * @param questionId - The ID of the question.
   */
  async markQuestionComplete(sheetId: string, questionId: string): Promise<void> {
    console.log(`Marking question ${questionId} on sheet ${sheetId} as complete...`);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error("User not authenticated.");
    }
    const userId = session.user.id;

    const { error } = await supabase
      .from('user_sheet_progress')
      .insert({
        user_id: userId,
        sheet_id: sheetId,
        question_id: questionId,
        // completed_at is handled by default value
      });
      // .upsert(...) // Use upsert if you want to handle potential re-marking without error

    if (error) {
       // Ignore primary key violation errors if using insert (means already marked)
       if (error.code === '23505') { // Unique violation code
         console.log(`Question ${questionId} already marked complete.`);
         return;
       }
      console.error(`Error marking question ${questionId} complete:`, error);
      throw new Error(`Database error: ${error.message}`);
    }
    console.log(`Question ${questionId} marked complete.`);
  },

  /**
   * Marks a question on a sheet as incomplete (removes progress entry).
   * @param sheetId - The ID of the sheet.
   * @param questionId - The ID of the question.
   */
  async markQuestionIncomplete(sheetId: string, questionId: string): Promise<void> {
    console.log(`Marking question ${questionId} on sheet ${sheetId} as incomplete...`);
     const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error("User not authenticated.");
    }
    const userId = session.user.id;

    const { error } = await supabase
      .from('user_sheet_progress')
      .delete()
      .eq('user_id', userId)
      .eq('sheet_id', sheetId)
      .eq('question_id', questionId);

    if (error) {
      console.error(`Error marking question ${questionId} incomplete:`, error);
      throw new Error(`Database error: ${error.message}`);
    }
     console.log(`Question ${questionId} marked incomplete.`);
  },

  /**
   * Fetches all completion timestamps for the current user across all sheets.
   */
  async getUserSheetProgressTimestamps(): Promise<Date[]> {
    console.log(`Fetching all sheet progress timestamps for user...`);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.log("User not authenticated, returning empty timestamps.");
      return [];
    }
    const userId = session.user.id;

    // Select the correct timestamp column 'completed_at'
    const { data, error } = await supabase
      .from('user_sheet_progress')
      .select('completed_at') // Correct column name
      .eq('user_id', userId);

    if (error) {
      console.error(`Error fetching progress timestamps:`, error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Extract and convert timestamps to Date objects
    const timestamps = data?.map(item => new Date(item.completed_at)).filter(Boolean) || []; // Use completed_at
    console.log(`Fetched ${timestamps.length} progress timestamps.`);
    return timestamps;
  }
};
