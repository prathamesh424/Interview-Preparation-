import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { mockInterviewService } from "@/services/mockInterviewService";
import { InterviewFeedbackCriterion, InterviewFeedbackItem, MockInterview } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import InterviewTimer from "./InterviewTimer";
import QuestionPanel from "./QuestionPanel";
import ChatPanel from "./ChatPanel";
import VideoPanel from "./VideoPanel";
import CodeEditor from "./CodeEditor";
import FeedbackForm from "./FeedbackForm";

type InterviewSessionProps = {
  interview: MockInterview;
  onClose: () => void;
};

const InterviewSession: React.FC<InterviewSessionProps> = ({ interview, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isInterviewer, setIsInterviewer] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<InterviewFeedbackItem[]>([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState<boolean>(false);
  const [codeValue, setCodeValue] = useState<string>("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const router = useNavigate();
  const [questions, setQuestions] = useState(interview.questions || []);
  
  useEffect(() => {
    if (user) {
      setIsInterviewer(interview.interviewerId === user.id);
    }
  }, [interview, user]);

  useEffect(() => {
    const checkSessionTime = () => {
      const now = new Date();
      const startTime = new Date(interview.scheduledStartTime);
      const endTime = new Date(interview.scheduledEndTime);
      
      // Allow entry 5 minutes before the scheduled time
      const canJoin = now >= new Date(startTime.getTime() - 5 * 60000) && now <= endTime;
      
      if (!canJoin) {
        toast({
          title: "Cannot join session",
          description: `This interview is scheduled for ${format(startTime, 'PPp')}`,
          variant: "destructive"
        });
        onClose();
        router('/dashboard');
        return;
      }
      
      setIsSessionActive(true);
    };

    checkSessionTime();
    const interval = setInterval(checkSessionTime, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [interview, onClose, router, toast]);

  useEffect(() => {
    // Redirect if no user or interview
    if (!user || !interview) {
      router('/dashboard');
      return;
    }

    // Update interview status to "In Progress" when joining
    const updateStatus = async () => {
      if (interview.status === 'Scheduled') {
        try {
          await mockInterviewService.updateMockInterview({
            ...interview,
            status: 'In Progress'
          });
        } catch (error) {
          console.error('Failed to update interview status:', error);
        }
      } 
      if (interview.status === 'In Progress' && interview.scheduledEndTime < new Date()) { 
        try {
          await mockInterviewService.updateMockInterview({
            ...interview,
            status: 'Completed'
          });
        } catch (error) {
          console.error('Failed to update interview status:', error);
        }
      }
    };

    updateStatus();
  }, [user, interview, router]);

  
  const handleCodeChange = (value: string) => {
    setCodeValue(value);
  };
  
  const handleCompleteFeedback = () => {
    setShowFeedbackForm(true);
    
    const criteria: InterviewFeedbackCriterion[] = [
      'Problem Solving',
      'Technical Knowledge',
      'Communication',
      'Code Quality',
      'System Design'
    ];
    
    setFeedback(criteria.map(criterion => ({
      criterion,
      score: 3 
    })));
  };
  

  const handleQuestionsUpdate = (updatedQuestions: Question[]) => {
    setQuestions(updatedQuestions);
  };

  if (!isSessionActive) {
    return null;
  }

  if (showFeedbackForm) {
    return (
      <FeedbackForm
        interview={interview}
        onClose={onClose}
        interviewerId={interview.interviewerId}
        intervieweeId={interview.intervieweeEmail}
      />
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
       <div className="lg:col-span-1 space-y-4">
        <InterviewTimer
          startTime={new Date(interview.scheduledStartTime)}
          endTime={new Date(interview.scheduledEndTime)}
        />
        
        <QuestionPanel
          interviewId={interview.id}
          questions={questions}
          isInterviewer={interview.interviewerId === user?.id}
          onQuestionsUpdate={handleQuestionsUpdate}
        />
        
         <ChatPanel
          interviewId={interview.id}
          userId={user?.id || ''}
          userName={user?.name || 'Anonymous'}
        />
        
        {isInterviewer && (
          <Button 
            className="w-full"
            onClick={handleCompleteFeedback}
          >
            Complete & Provide Feedback
          </Button>
        )}
      </div>
      
       <div className="lg:col-span-1">
        <VideoPanel
          interviewId={interview.id}
          isInterviewer={interview.interviewerId === user?.id}
          userId={user?.id || ''}
        />
      </div>
      
       <div className="lg:col-span-1">
        <CodeEditor
          codeValue={codeValue}
          onCodeChange={handleCodeChange}
          interviewId={interview.id}
          isInterviewer={interview.interviewerId === user?.id}
        />
      </div>
    </div>
  );
};

export default InterviewSession;
