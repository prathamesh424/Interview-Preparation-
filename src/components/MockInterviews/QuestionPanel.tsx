import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { mockInterviewService } from "@/services/mockInterviewService";
import { useToast } from "@/hooks/use-toast";

type Question = {
  id: string;
  text: string;
};

type QuestionPanelProps = {
  interviewId: string;
  questions: Question[];
  isInterviewer: boolean;
};

const QuestionPanel = ({
  interviewId,
  questions: initialQuestions,
  isInterviewer
}: QuestionPanelProps) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || []);
  const [newQuestion, setNewQuestion] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  // Set up Supabase Realtime for syncing questions
  useEffect(() => {
    // Create a unique channel for this interview's questions
    const channel = supabase.channel(`questions-${interviewId}`);
    
    channel.on('broadcast', { event: 'questions-updated' }, ({ payload }) => {
      if (payload.questions) {
        setQuestions(payload.questions);
      }
    });
    
    channel.subscribe();
    channelRef.current = channel;
    
    return () => {
      channel.unsubscribe();
    };
  }, [interviewId]);

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return;
    
    try {
      // Add question to the list
      const newId = crypto.randomUUID();
      const updatedQuestions = [...questions, { id: newId, text: newQuestion }];
      
      // Update state
      setQuestions(updatedQuestions);
      setNewQuestion('');
      
      // Save to database
      await mockInterviewService.updateMockInterview({
        id: interviewId,
        questions: updatedQuestions
      });
      
      // Broadcast to other participant
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'questions-updated',
          payload: {
            questions: updatedQuestions
          }
        });
      }
      
      toast({
        title: "Question added",
        description: "The question has been added successfully",
      });
    } catch (error) {
      console.error('Failed to add question:', error);
      toast({
        title: "Error",
        description: "Failed to add the question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    setCurrentIndex(i => Math.max(0, i - 1));
  };

  const handleNext = () => {
    setCurrentIndex(i => Math.min(questions.length - 1, i + 1));
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Interview Questions</h3>
      
      {questions.length > 0 ? (
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium">Question {currentIndex + 1}:</p>
            <p>{questions[currentIndex].text}</p>
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
              className="flex items-center"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">No questions added yet.</p>
      )}

      {isInterviewer && (
        <div className="flex gap-2">
          <Input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Type a new question..."
            onKeyPress={(e) => e.key === 'Enter' && handleAddQuestion()}
          />
          <Button 
            onClick={handleAddQuestion}
            disabled={!newQuestion.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionPanel;
