import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Re-added useCallback
// Removed initialHrQuestions import
import { StudyQuestion } from '@/types';
import { useOutletContext } from 'react-router-dom'; // Import useOutletContext
// Re-add Supabase/Auth related imports
import { useAuth } from '@/context/AuthContext'; 
import { fetchStudyProgress, updateStudyProgress } from '@/services/studyHubService'; 
import { toast } from "@/components/ui/use-toast"; 
import { Skeleton } from "@/components/ui/skeleton"; 
import { cn } from "@/lib/utils"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import SectionProgressDisplay from '../SectionProgressDisplay'; // Import section progress

// Define the type for the context passed from StudyHub
type StudyHubContextType = {
  allQuestions: StudyQuestion[];
  handleQuestionCompletionChange: (questionId: string, isCompleted: boolean) => void;
};

const HrView: React.FC = () => {
  const { user } = useAuth(); // Get user info
  const { allQuestions, handleQuestionCompletionChange: contextHandleChange } = useOutletContext<StudyHubContextType>();

  // Filter questions relevant to this view (using the generic topicId from mockData)
  const hrQuestionIds = useMemo(() => allQuestions.filter(q => q.topicId === 'hr-general').map(q => q.id), [allQuestions]);

  const hrQuestions = useMemo(() => allQuestions.filter(q => 
    hrQuestionIds.includes(q.id)
  ), [allQuestions, hrQuestionIds]);

  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true); // Re-add loading state
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({}); // Re-add updating state

  // Fetch initial progress from Supabase
  const loadProgress = useCallback(async () => {
    if (!user || hrQuestionIds.length === 0) { setIsLoading(false); return; } 
    setIsLoading(true);
    try {
      const progressMap = await fetchStudyProgress(user.id, hrQuestionIds);
      hrQuestionIds.forEach(id => {
         if (progressMap.hasOwnProperty(id)) {
            const currentQuestionState = allQuestions.find(q => q.id === id);
            if (currentQuestionState && currentQuestionState.isCompleted !== progressMap[id]) {
               contextHandleChange(id, progressMap[id]);
            }
         }
      });
    } catch (error) {
       console.error("Failed to load HR progress", error);
       if ((error as any)?.code !== 'PGRST116' && (error as any)?.message !== 'Not Found') {
         toast({ title: "Error", description: "Could not load HR progress.", variant: "destructive" });
       }
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hrQuestionIds, contextHandleChange]); // Removed allQuestions from deps

  useEffect(() => {
    loadProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProgress]); 

  const toggleAnswer = (questionId: string) => {
    setExpandedAnswers(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // Use the handler passed from context AND call Supabase
  const handleCheckboxChange = async (questionId: string, checked: boolean) => {
     if (!user) {
      toast({ title: "Not Logged In", description: "Please log in to save progress.", variant: "destructive" });
      return;
    }
    contextHandleChange(questionId, checked); // Optimistic UI update via context
    setIsUpdating(prev => ({ ...prev, [questionId]: true })); 
    try {
      await updateStudyProgress(user.id, questionId, checked);
    } catch (error) {
      console.error("Failed to update progress", error);
      if ((error as any)?.code !== 'PGRST116' && (error as any)?.message !== 'Not Found') {
        toast({ title: "Update Failed", description: "Could not save progress change.", variant: "destructive" });
      }
      contextHandleChange(questionId, !checked); // Revert central state
    } finally {
       setIsUpdating(prev => ({ ...prev, [questionId]: false })); 
    }
  };

  const getDifficultyBadgeVariant = (difficulty: StudyQuestion['difficulty']): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
    switch (difficulty) {
      case 'Beginner': return 'default';
      case 'Intermediate': return 'secondary';
      case 'Hard': return 'destructive';
      default: return 'outline';
    }
  };

  // Calculate section progress from filtered state (derived from context)
  const totalQuestions = hrQuestions.length; 
  const completedQuestions = hrQuestions.filter(q => q.isCompleted).length; 

  // --- Render Logic ---
  // Re-add loading state display
  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">HR Questions</h1>
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">HR Questions</h1>

      {/* Section Progress - Calculated from filtered state */}
      <SectionProgressDisplay 
        sectionName="HR"
        totalQuestions={totalQuestions}
        completedQuestions={completedQuestions}
      />
      
      <div className="space-y-4">
        {hrQuestions.map((question) => ( // Use filtered questions
          <Card key={question.id} className="bg-background">
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-normal flex items-center">
                  <Checkbox 
                          id={`q-${question.id}`} 
                          className="mr-3" 
                          checked={question.isCompleted} // Use value from context-derived state
                          onCheckedChange={(checked) => handleCheckboxChange(question.id, !!checked)} // Use updated handler
                          disabled={isUpdating[question.id]} // Re-add disabled state
                        />
                        <label 
                          htmlFor={`q-${question.id}`} 
                          className={cn("cursor-pointer flex-1", isUpdating[question.id] && "opacity-50")} // Re-add dimming
                        >
                          {question.questionText}
                  </label>
                </CardTitle>
                <Badge variant={getDifficultyBadgeVariant(question.difficulty)}>
                  {question.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => toggleAnswer(question.id)}
                className="px-0 h-auto py-1 mb-2"
              >
                {expandedAnswers[question.id] ? 'Hide Answer/Tips' : 'Show Answer/Tips'}
              </Button>
              {expandedAnswers[question.id] && (
                <div className="text-sm space-y-2 p-3 bg-muted rounded-md">
                  {question.answer && <p><strong>Tips:</strong> {question.answer}</p>}
                  {question.explanation && <p><em>Explanation:</em> {question.explanation}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {hrQuestions.length === 0 && ( // Use filtered questions
           <p className="text-sm text-muted-foreground">No HR questions added yet.</p>
        )}
      </div>
    </div>
  );
};

export default HrView;
