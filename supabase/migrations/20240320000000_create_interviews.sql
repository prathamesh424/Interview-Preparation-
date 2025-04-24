

-- Create mock_interviews table
CREATE TABLE IF NOT EXISTS mock_interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  time_zone TEXT NOT NULL,
  status TEXT NOT NULL, -- "Scheduled", "Completed", "Cancelled", "InProgress"
  interviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interviewee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interviewee_email TEXT,
  interviewer_name TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array of question IDs
  feedback_id UUID, -- Can be null
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;

-- Allow users to view interviews they're part of (either as interviewer or interviewee)
CREATE POLICY "Users can view their own interviews"
  ON mock_interviews
  FOR SELECT
  USING (
    interviewer_id = auth.uid() OR 
    interviewee_id = auth.uid() OR
    interviewee_email = auth.jwt() ->> 'email'
  );

-- Allow users to insert interviews they're conducting
CREATE POLICY "Users can insert interviews they conduct"
  ON mock_interviews
  FOR INSERT
  WITH CHECK (interviewer_id = auth.uid());

-- Allow users to update interviews they're part of
CREATE POLICY "Users can update interviews they're part of"
  ON mock_interviews
  FOR UPDATE
  USING (interviewer_id = auth.uid() OR interviewee_id = auth.uid())
  WITH CHECK (interviewer_id = auth.uid() OR interviewee_id = auth.uid());

-- Allow users to delete interviews they're conducting
CREATE POLICY "Users can delete interviews they conduct"
  ON mock_interviews
  FOR DELETE
  USING (interviewer_id = auth.uid());

-- Create interview feedback table
CREATE TABLE IF NOT EXISTS interview_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES mock_interviews(id) ON DELETE CASCADE,
  overall_rating INTEGER NOT NULL, -- e.g., 1-5
  communication_rating INTEGER NOT NULL,
  technical_rating INTEGER NOT NULL,
  problem_solving_rating INTEGER NOT NULL,
  strengths TEXT,
  areas_for_improvement TEXT,
  additional_comments TEXT,
  interviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Who gave the feedback
  interviewee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Who received the feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for feedback
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;

-- Allow users to view feedback for interviews they're part of
CREATE POLICY "Users can view feedback for their interviews"
  ON interview_feedback
  FOR SELECT
  USING (
    interview_id IN (
      SELECT id FROM mock_interviews
      WHERE interviewer_id = auth.uid() OR interviewee_id = auth.uid()
    )
  );

-- Allow users to insert feedback for interviews they conducted
CREATE POLICY "Users can insert feedback for interviews they conduct"
  ON interview_feedback
  FOR INSERT
  WITH CHECK (
    interview_id IN (
      SELECT id FROM mock_interviews
      WHERE interviewer_id = auth.uid()
    )
  );

-- Create indexes for faster queries
CREATE INDEX mock_interviews_interviewer_id_idx ON mock_interviews(interviewer_id);
CREATE INDEX mock_interviews_interviewee_id_idx ON mock_interviews(interviewee_id);
CREATE INDEX mock_interviews_interviewee_email_idx ON mock_interviews(interviewee_email);
CREATE INDEX interview_feedback_interview_id_idx ON interview_feedback(interview_id); 



-- Create code_snippets table
CREATE TABLE IF NOT EXISTS code_snippets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES mock_interviews(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE code_snippets ENABLE ROW LEVEL SECURITY;

-- Allow users to view snippets for interviews they're part of
CREATE POLICY "Users can view snippets for their interviews"
  ON code_snippets
  FOR SELECT
  USING (
    interview_id IN (
      SELECT id FROM mock_interviews
      WHERE interviewer_id = auth.uid()
      OR interviewee_id = auth.uid()
    )
  );

-- Allow users to insert snippets for interviews they're part of
CREATE POLICY "Users can insert snippets for their interviews"
  ON code_snippets
  FOR INSERT
  WITH CHECK (
    interview_id IN (
      SELECT id FROM mock_interviews
      WHERE interviewer_id = auth.uid()
      OR interviewee_id = auth.uid()
    )
  );

-- Allow users to update their own snippets
CREATE POLICY "Users can update their own snippets"
  ON code_snippets
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own snippets
CREATE POLICY "Users can delete their own snippets"
  ON code_snippets
  FOR DELETE
  USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX code_snippets_interview_id_idx ON code_snippets(interview_id);
CREATE INDEX code_snippets_user_id_idx ON code_snippets(user_id);