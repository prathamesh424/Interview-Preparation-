import { v4 as uuidv4 } from "uuid";
import { InterviewFeedback, MockInterview } from "@/types"; // Assuming MockInterview is defined in @/types
import { supabase } from "@/integrations/supabase/client";

// Re-export MockInterview if it's defined in @/types, otherwise define and export here if needed.
// Assuming it's correctly defined and exported from '@/types' based on the original import.
export type { MockInterview }; // Re-export if needed, or ensure it's exported from '@/types'

// Keep the localStorage keys for backward compatibility during transition
const MOCK_INTERVIEWS_KEY = 'interviewAce_mock_interviews';
const INTERVIEW_FEEDBACK_KEY = 'interviewAce_interview_feedback';

 const mapSupabaseToMockInterview = (data: any): MockInterview => {
  return {
    id: data.id,
    title: data.title,
    description: data.description || undefined,
    scheduledStartTime: new Date(data.scheduled_start_time),
    scheduledEndTime: new Date(data.scheduled_end_time),
    timeZone: data.time_zone,
    status: data.status,
    interviewerId: data.interviewer_id,
    intervieweeId: data.interviewee_id || 'pending-user-registration',
    intervieweeEmail: data.interviewee_email,
    interviewerName: data.interviewer_name,
    questions: data.questions || [],
    feedback: undefined, // Fetch separately if needed
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
};

 const mapMockInterviewToSupabase = (interview: MockInterview | Omit<MockInterview, 'id' | 'createdAt' | 'updatedAt'>) => {
  return {
    id: 'id' in interview ? interview.id : undefined,
    title: interview.title,
    description: interview.description,
    scheduled_start_time: interview.scheduledStartTime,
    scheduled_end_time: interview.scheduledEndTime,
    time_zone: interview.timeZone,
    status: interview.status,
    interviewer_id: interview.interviewerId,
    interviewee_id: interview.intervieweeId !== 'pending-user-registration' ? interview.intervieweeId : null,
    interviewee_email: interview.intervieweeEmail,
    interviewer_name: interview.interviewerName,
    questions: interview.questions
  };
};

export const mockInterviewService = {
   async getMockInterviews(): Promise<MockInterview[]> {
    try {
      // Try to get interviews from Supabase
      const { data, error } = await supabase
        .from('mock_interviews')
        .select('*');
        
      if (error) {
        console.error("Error fetching interviews from Supabase:", error);
        
        // Fallback to localStorage if Supabase fails
        const storedInterviews = localStorage.getItem(MOCK_INTERVIEWS_KEY);
        return storedInterviews ? JSON.parse(storedInterviews) : [];
      }
      
      // Convert Supabase data to our app's format
      return data.map(mapSupabaseToMockInterview);
    } catch (error) {
      console.error("Error loading mock interviews:", error);
      
      // Fallback to localStorage if Supabase access fails
      const storedInterviews = localStorage.getItem(MOCK_INTERVIEWS_KEY);
      return storedInterviews ? JSON.parse(storedInterviews) : [];
    }
  },

   async getMockInterviewsByUserId(userId: string): Promise<MockInterview[]> {
    try {
      // Get interviews where user is either interviewer or interviewee
      const { data, error } = await supabase
        .from('mock_interviews')
        .select('*')
        .or(`interviewer_id.eq.${userId},interviewee_id.eq.${userId}`);
        
      if (error) {
        console.error("Error fetching interviews by user ID:", error);
        
        // Fallback to localStorage
        const allInterviews = await this.getMockInterviews();
        return allInterviews.filter(
          interview => interview.interviewerId === userId || interview.intervieweeId === userId
        );
      }
      
      return data.map(mapSupabaseToMockInterview);
    } catch (error) {
      console.error("Error filtering mock interviews:", error);
      
      // Fallback to localStorage
      const allInterviews = await this.getMockInterviews();
      return allInterviews.filter(
        interview => interview.interviewerId === userId || interview.intervieweeId === userId
      );
    }
  },

   async getMockInterviewsByEmail(email: string): Promise<MockInterview[]> {
    try {
      // Get interviews where user is the interviewee by email
      const { data, error } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('interviewee_email', email);
        
      if (error) {
        console.error("Error fetching interviews by email:", error);
        
        // Fallback to localStorage
        const allInterviews = await this.getMockInterviews();
        return allInterviews.filter(
          interview => interview.intervieweeEmail === email
        );
      }
      
      return data.map(mapSupabaseToMockInterview);
    } catch (error) {
      console.error("Error filtering mock interviews by email:", error);
      
      // Fallback to localStorage
      const allInterviews = await this.getMockInterviews();
      return allInterviews.filter(
        interview => interview.intervieweeEmail === email
      );
    }
  },

   async getMockInterviewById(interviewId: string): Promise<MockInterview | undefined> {
    try {
      // Get interview by ID
      const { data, error } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('id', interviewId)
        .single();
        
      if (error) {
        console.error("Error fetching interview by ID:", error);
        
        // Fallback to localStorage
        const allInterviews = await this.getMockInterviews();
        return allInterviews.find(interview => interview.id === interviewId);
      }
      
      return mapSupabaseToMockInterview(data);
    } catch (error) {
      console.error("Error finding mock interview:", error);
      
      // Fallback to localStorage
      const allInterviews = await this.getMockInterviews();
      return allInterviews.find(interview => interview.id === interviewId);
    }
  },

  async getUserIdByEmail(email: string): Promise<string | null> {
   try {
    const { data, error } = await supabase.auth.admin.listUsers({ email });

    if (error) {
      console.error('Error fetching user from auth.users:', error);
      return null;
    }

    const user = data?.users?.[0];
    return user?.id ?? null;
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
  } ,

   async sendInterviewInvitationEmail(interview: MockInterview): Promise<boolean> {
    try {
      // Call Supabase Edge Function to send email
      const { data, error } = await supabase.functions.invoke('send-interview-email', {
        body: {
          to: interview.intervieweeEmail,
          subject: `You've been invited to a mock interview: ${interview.title}`,
          interviewDetails: {
            id: interview.id,
            title: interview.title,
            description: interview.description,
            date: interview.scheduledStartTime,
            startTime: new Date(interview.scheduledStartTime).toLocaleTimeString(),
            endTime: new Date(interview.scheduledEndTime).toLocaleTimeString(),
            interviewerName: interview.interviewerName
          }
        },
      });

      if (error) {
        console.error("Error sending invitation email:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to send invitation email:", error);
      return false;
    }
  },

   async scheduleMockInterview(interview: Omit<MockInterview, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockInterview> {
    try {
      // Generate a UUID for the new interview (we'll use this for both Supabase and localStorage)
      const interviewId = uuidv4();
      
      // Prepare the data for Supabase
      const supabaseData = {
        ...mapMockInterviewToSupabase(interview),
        id: interviewId
      };
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('mock_interviews')
        .insert(supabaseData)
        .select('*')
        .single();
        
      if (error) {
        console.error("Error inserting interview into Supabase:", error);
        
        // Fallback to localStorage
        const allInterviews = await this.getMockInterviews();
        const newInterview: MockInterview = {
          ...interview,
          id: interviewId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        allInterviews.push(newInterview);
        localStorage.setItem(MOCK_INTERVIEWS_KEY, JSON.stringify(allInterviews));
        
        // Send invitation email
        if (newInterview.intervieweeEmail) {
          await this.sendInterviewInvitationEmail(newInterview);
        }
        
        return newInterview;
      }
      
      // Convert the data back to our app's format
      const newInterview = mapSupabaseToMockInterview(data);
      
      // Send invitation email
      if (newInterview.intervieweeEmail) {
        await this.sendInterviewInvitationEmail(newInterview);
      }
      
      return newInterview;
    } catch (error) {
      console.error("Error scheduling mock interview:", error);
      throw error;
    }
  },

   async updateMockInterview(interview: MockInterview): Promise<MockInterview> {
    try {
      // Prepare the data for Supabase
      const supabaseData = mapMockInterviewToSupabase(interview);
      
      // Update in Supabase
      const { data, error } = await supabase
        .from('mock_interviews')
        .update({
          ...supabaseData,
          updated_at: new Date().toISOString()
        })
        .eq('id', interview.id)
        .select('*')
        .single();
        
      if (error) {
        console.error("Error updating interview in Supabase:", error);
        
        // Fallback to localStorage
        const allInterviews = await this.getMockInterviews();
        const interviewIndex = allInterviews.findIndex(i => i.id === interview.id);
        
        if (interviewIndex >= 0) {
          const updatedInterview = {
            ...interview,
            updatedAt: new Date()
          };
          allInterviews[interviewIndex] = updatedInterview;
          localStorage.setItem(MOCK_INTERVIEWS_KEY, JSON.stringify(allInterviews));
          return updatedInterview;
        } else {
          throw new Error("Mock interview not found");
        }
      }
      
      // Convert the data back to our app's format
      return mapSupabaseToMockInterview(data);
    } catch (error) {
      console.error("Error updating mock interview:", error);
      throw error;
    }
  },

   async cancelMockInterview(interviewId: string): Promise<void> {
    try {
      // Update the status in Supabase
      const { error } = await supabase
        .from('mock_interviews')
        .update({
          status: 'Cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId);
        
      if (error) {
        console.error("Error cancelling interview in Supabase:", error);
        
        // Fallback to localStorage
        const allInterviews = await this.getMockInterviews();
        const interviewIndex = allInterviews.findIndex(i => i.id === interviewId);
        
        if (interviewIndex >= 0) {
          allInterviews[interviewIndex].status = 'Cancelled';
          allInterviews[interviewIndex].updatedAt = new Date();
          localStorage.setItem(MOCK_INTERVIEWS_KEY, JSON.stringify(allInterviews));
        } else {
          throw new Error("Mock interview not found");
        }
      }
    } catch (error) {
      console.error("Error cancelling mock interview:", error);
      throw error;
    }
  },

   async saveFeedback(feedback: any): Promise<InterviewFeedback> {
    try {
      // Generate a UUID for the feedback
      const feedbackId = uuidv4();
      
      // Handle both camelCase and snake_case field names to ensure compatibility
      const feedbackData = {
        id: feedbackId,
        interview_id: feedback.interviewId || feedback.interview_id,
        interviewee_email:feedback.interviewee_email,
        overall_rating: feedback.overallRating || feedback.overall_rating || 3,
        communication_rating: feedback.communicationRating || feedback.communication_rating || 3,
        technical_rating: feedback.technicalRating || feedback.technical_rating || 3,
        problem_solving_rating: feedback.problemSolvingRating || feedback.problem_solving_rating || 3,
        strengths: feedback.strengths || '',
        areas_for_improvement: feedback.areasForImprovement || feedback.areas_for_improvement || '',
        additional_comments: feedback.additionalComments || feedback.additional_comments || '',
        interviewer_id: feedback.interviewerId || feedback.interviewer_id,
        interviewee_id: feedback.intervieweeId || feedback.interviewee_id
      };
      
      // Insert feedback into Supabase
      const { data: feedbackResult, error: feedbackError } = await supabase
        .from('interview_feedback')
        .insert(feedbackData)
        .select('*')
        .single();
        
      if (feedbackError) {
        console.error("Error saving feedback to Supabase:", feedbackError);
        
        // Fallback to localStorage
        const storedFeedback = localStorage.getItem(INTERVIEW_FEEDBACK_KEY);
        const allFeedback: InterviewFeedback[] = storedFeedback ? JSON.parse(storedFeedback) : [];
        
        const newFeedback: InterviewFeedback = {
          id: feedbackId,
          interviewId: feedbackData.interview_id,
          overallRating: feedbackData.overall_rating,
          communicationRating: feedbackData.communication_rating,
          technicalRating: feedbackData.technical_rating,
          problemSolvingRating: feedbackData.problem_solving_rating,
          strengths: feedbackData.strengths,
          areasForImprovement: feedbackData.areas_for_improvement,
          additionalComments: feedbackData.additional_comments,
          interviewerId: feedbackData.interviewer_id,
          intervieweeId: feedbackData.interviewee_id,
          createdAt: new Date()
        };
        
        allFeedback.push(newFeedback);
        localStorage.setItem(INTERVIEW_FEEDBACK_KEY, JSON.stringify(allFeedback));
        
        // Update the interview with the feedback ID
        const allInterviews = await this.getMockInterviews();
        const interviewIndex = allInterviews.findIndex(i => i.id === feedbackData.interview_id);
        
        if (interviewIndex >= 0) {
          allInterviews[interviewIndex].feedback = newFeedback;
          allInterviews[interviewIndex].status = 'Completed';
          allInterviews[interviewIndex].updatedAt = new Date();
          localStorage.setItem(MOCK_INTERVIEWS_KEY, JSON.stringify(allInterviews));
        }
        
        return newFeedback;
      }
      
      // Update the interview with the feedback ID
      await supabase
        .from('mock_interviews')
        .update({
          feedback_id: feedbackId,
          status: 'Completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', feedbackData.interview_id);
      
      // Convert the feedback data to our app's format
      const newFeedback: InterviewFeedback = {
        id: feedbackResult.id,
        interviewId: feedbackResult.interview_id,
        overallRating: feedbackResult.overall_rating,
        communicationRating: feedbackResult.communication_rating,
        technicalRating: feedbackResult.technical_rating,
        problemSolvingRating: feedbackResult.problem_solving_rating,
        strengths: feedbackResult.strengths,
        areasForImprovement: feedbackResult.areas_for_improvement,
        additionalComments: feedbackResult.additional_comments,
        interviewerId: feedbackResult.interviewer_id,
        intervieweeId: feedbackResult.interviewee_id,
        createdAt: new Date(feedbackResult.created_at)
      };
      
      return newFeedback;
    } catch (error) {
      console.error("Error saving feedback:", error);
      throw error;
    }
  },

   async getFeedbackByInterviewId(interviewId: string): Promise<InterviewFeedback | undefined> {
    try {
      // Get feedback from Supabase

      const { data, error } = await supabase
        .from('interview_feedback')
        .select('*')
        .eq('interview_id', interviewId)
        .single();
        
      if (error) {
        console.error("Error fetching feedback from Supabase:", error);
        
        // Fallback to localStorage
        const storedFeedback = localStorage.getItem(INTERVIEW_FEEDBACK_KEY);
        const allFeedback: InterviewFeedback[] = storedFeedback ? JSON.parse(storedFeedback) : [];
        
        return allFeedback.find(feedback => feedback.interviewId === interviewId);
      }
      
      if (!data) return undefined;
      
      // Convert to our app's format
      return {
        id: data.id,
        interviewId: data.interview_id,
        overallRating: data.overall_rating,
        communicationRating: data.communication_rating,
        technicalRating: data.technical_rating,
        problemSolvingRating: data.problem_solving_rating,
        strengths: data.strengths,
        areasForImprovement: data.areas_for_improvement,
        additionalComments: data.additional_comments,
        interviewerId: data.interviewer_id,
        intervieweeId: data.interviewee_id,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("Error getting feedback:", error);
      
      // Fallback to localStorage
      const storedFeedback = localStorage.getItem(INTERVIEW_FEEDBACK_KEY);
      const allFeedback: InterviewFeedback[] = storedFeedback ? JSON.parse(storedFeedback) : [];
      
      return allFeedback.find(feedback => feedback.interviewId === interviewId);
    }
  },

   async getAllFeedbackForUser(userId: string  , userEmail: string): Promise<InterviewFeedback[]> {
    try {
       console.log(userId , userEmail)
      const { data, error } = await supabase
        .from('interview_feedback')
        .select('*')
  .     or(`interviewee_email.eq."${userEmail}",interviewer_id.eq.${userId}`);
        
      console.log(data)
      if (error) {
        console.error("Error fetching user feedback from Supabase:", error);
        
         const storedFeedback = localStorage.getItem(INTERVIEW_FEEDBACK_KEY);
        const allFeedback: InterviewFeedback[] = storedFeedback ? JSON.parse(storedFeedback) : [];
        
        return allFeedback.filter(
          feedback => feedback.intervieweeId === userId || feedback.interviewerId === userId || feedback.intervieweeEmail === userEmail || feedback.intetviewee_email === userEmail
        );
      }
      
       return data.map(item => ({
        id: item.id,
        interviewId: item.interview_id,
        overallRating: item.overall_rating,
        communicationRating: item.communication_rating,
        technicalRating: item.technical_rating,
        problemSolvingRating: item.problem_solving_rating,
        strengths: item.strengths,
        areasForImprovement: item.areas_for_improvement,
        additionalComments: item.additional_comments,
        interviewerId: item.interviewer_id,
        intervieweeEmail: item.interviewee_email,
        intervieweeId: item.interviewee_id,
        createdAt: new Date(item.created_at)
      }));
    } catch (error) {
      console.error("Error getting user feedback:", error);
      
      // Fallback to localStorage
      const storedFeedback = localStorage.getItem(INTERVIEW_FEEDBACK_KEY);
      const allFeedback: InterviewFeedback[] = storedFeedback ? JSON.parse(storedFeedback) : [];
      
      return allFeedback.filter(
        feedback => feedback.intervieweeId === userId || feedback.interviewerId === userId || feedback.intervieweeEmail === userEmail
      );  
    }
  }
};
