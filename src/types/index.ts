export type User = {
  id: string;
  email: string;
  name: string;
};

export type QuestionType = 
  | 'Theory' 
  | 'Code Writing' 
  | 'Find the Error in Code' 
  | 'Scenario-Based'
  | 'Other';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Hard';

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard'; // Or your specific levels

export interface Question {
  id: string;
  questionText: string; // The descriptive part of the question
  codeSnippet?: string; // The code block, if any
  codeLanguage?: string; // Language hint (e.g., 'javascript', 'python', 'css')
  type: QuestionType;
  difficulty: QuestionDifficulty;
  createdAt: Date;
  // Potentially add the original full question string if needed for debugging
  // originalQuestion?: string;
}

export type SavedQuestion = Question & {
  userAnswer?: string;
  feedback?: QuestionFeedback;
  tags: string[];
  notes?: string;
  subject?: string;
};



export interface QuestionFeedback {
  correct: string[];
  missed: string[];
  correctAnswer?: string; // Could be text or corrected code
  suggestions?: string;
  score: number; // 0-10
}

export type GenerateQuestionsParams = {
  content: string;
  types: QuestionType[];
  difficulties: DifficultyLevel[];
  count?: number;
};

// export type CheckAnswerParams = {
//   question: string;
//   userAnswer: string;
//   questionType: QuestionType;
//   difficulty: DifficultyLevel;
// };

export interface CheckAnswerParams {
  question: string; // Send the original question text for context
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  userAnswer: string; // Can be plain text or code
  // Maybe include the original code snippet if relevant for checking?
  // originalCodeSnippet?: string;
}



// Prep Planner types
export type StudyCategory = 
  | 'Data Structures' 
  | 'Algorithms' 
  | 'System Design' 
  | 'Behavioral' 
  | 'Language Specific' 
  | 'Other';

export type StudyPlanStatus = 'Not Started' | 'In Progress' | 'Completed';

export type StudyPlanItem = {
  id: string;
  title: string;
  description?: string;
  category: StudyCategory;
  startDate: Date;
  endDate: Date;
  status: StudyPlanStatus;
  priority: 'Low' | 'Medium' | 'High';
  resources?: string[];
  notes?: string;
  userId: string;
};

// Mock Interview types
export type InterviewRole = 'Interviewer' | 'Interviewee';

export type InterviewStatus = 
  | 'Scheduled' 
  | 'In Progress' 
  | 'Completed' 
  | 'Cancelled';

export type InterviewFeedbackCriterion = 
  | 'Problem Solving' 
  | 'Technical Knowledge' 
  | 'Communication' 
  | 'Code Quality' 
  | 'System Design';

export type InterviewFeedbackItem = {
  criterion: InterviewFeedbackCriterion;
  score: 1 | 2 | 3 | 4 | 5;
  comment?: string;
};

export type InterviewFeedback = {
  id: string;
  interviewId: string;
  intervieweeId: string;
  interviewerId: string;
  feedbackItems: InterviewFeedbackItem[];
  overallComment?: string;
  createdAt: Date;
};

export type MockInterview = {
  id: string;
  title: string;
  description?: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  timeZone: string;
  status: InterviewStatus;
  interviewerId: string;
  intervieweeId: string;
  intervieweeEmail?: string;
  interviewerName?: string;
  questions: string[];
  feedback?: InterviewFeedback;
  createdAt: Date;
  updatedAt: Date;
};

// Type for AI-generated Cheat Sheet
export type LearningPace = "Slow" | "Medium" | "Fast";

export interface CheatSheetData {
  dailyBreakdown: {
    day: number;
    subtopic: string;
    resources: { title: string; url: string; type: "YouTube" | "Article" | "Docs" }[];
    schedule: string;
  }[];
}

// Params for generating cheat sheet
export type GenerateCheatSheetParams = {
  topic: string;
  days: number;
  pace: LearningPace;
};

// --- Study Hub Types ---

export type StudyHubSection = 'DSA' | 'System Design' | 'HR' | 'Core Subjects' | 'Others';

export type StudyTopicStatus = 'Not Started' | 'In Progress' | 'Completed';

// Represents a specific topic within a section (e.g., "Arrays" within "DSA")
export interface StudyTopic {
  id: string;
  name: string;
  section: StudyHubSection;
  description?: string;
  status: StudyTopicStatus;
  questionCount: number; // Total questions in this topic
  completedCount: number; // Completed questions in this topic
  // Potentially add parentTopicId for nested topics
}

// Represents a resource link (article, video, etc.)
export interface StudyResource {
  id: string;
  title: string;
  url: string;
  type: 'Article' | 'Video' | 'Docs' | 'Other';
  // Could link to topicId or questionId
}

// Represents a user's note for a topic or question
export interface RevisionNote {
  id: string;
  content: string;
  isRevised: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Should link to topicId or questionId
  topicId?: string;
  questionId?: string;
}

// Represents a single question within a study topic
export interface StudyQuestion {
  id: string;
  topicId: string; // Link back to the parent topic
  questionText: string;
  difficulty: DifficultyLevel; // Re-use existing DifficultyLevel type
  isCompleted: boolean;
  answer?: string; // Could be pre-filled or user-generated
  explanation?: string; // Explanation for the answer
  resources?: StudyResource[]; // Associated resources
  notes?: RevisionNote[]; // User's notes specific to this question
  // Optional: Link to an integrated IDE session/ID
  ideSessionId?: string;
}

// Represents overall progress for a major section
export interface SectionProgress {
  section: StudyHubSection;
  totalTopics: number;
  completedTopics: number;
  totalQuestions: number;
  completedQuestions: number;
}
