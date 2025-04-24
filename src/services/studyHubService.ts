import { supabase } from '@/integrations/supabase/client';
import { StudyQuestion } from '@/types'; // Assuming question IDs are sufficient

export type StudyProgressRecord = {
  user_id: string;
  question_id: string;
  is_completed: boolean;
};

// Fetch progress for a list of question IDs for the current user
export const fetchStudyProgress = async (userId: string, questionIds: string[]): Promise<Record<string, boolean>> => {
  if (!userId || questionIds.length === 0) {
    return {};
  }

  // Workaround: Use 'as any' because 'study_progress' is not in generated types yet
  const { data, error } = await (supabase as any) 
    .from('study_progress')
    .select('question_id, is_completed')
    .eq('user_id', userId)
    .in('question_id', questionIds);

  if (error) {
    console.error('Error fetching study progress:', error);
    throw error;
  }

  const progressMap: Record<string, boolean> = {};
  data?.forEach(record => {
    progressMap[record.question_id] = record.is_completed;
  });

  return progressMap;
};

// Update or insert progress for a specific question for the current user
export const updateStudyProgress = async (userId: string, questionId: string, isCompleted: boolean): Promise<StudyProgressRecord | null> => {
   if (!userId || !questionId) {
    throw new Error('User ID and Question ID are required.');
  }
  
  // Workaround: Use 'as any' because 'study_progress' is not in generated types yet
  const { data, error } = await (supabase as any)
    .from('study_progress')
    .upsert(
      { 
        user_id: userId, 
        question_id: questionId, 
        is_completed: isCompleted,
        // updated_at will be handled by the database trigger/default
      },
      { 
        onConflict: 'user_id, question_id', // Specify conflict target
        // defaultToNull: false // Ensure existing rows are updated
      }
    )
    .select() // Select the inserted/updated row
    .single(); // Expect a single row back

  if (error) {
    console.error('Error updating study progress:', error);
    // Handle specific errors like RLS violation if needed
    throw error;
  }

  return data;
};
 