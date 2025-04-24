import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Re-added useCallback
import { systemDesignTopics as initialSystemDesignTopics } from '../mockData'; // Only import topics initially
import { StudyQuestion, StudyTopic } from '@/types'; // Import StudyTopic
import { useOutletContext } from 'react-router-dom'; // Import useOutletContext
// Re-add Supabase/Auth related imports
import { useAuth } from '@/context/AuthContext'; 
import { fetchStudyProgress, updateStudyProgress } from '@/services/studyHubService'; 
import { toast } from "@/components/ui/use-toast"; 
import { Skeleton } from "@/components/ui/skeleton"; 
import { cn } from "@/lib/utils"; 
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

const SystemDesignView: React.FC = () => {
  const { user } = useAuth(); // Get user info
  const { allQuestions, handleQuestionCompletionChange: contextHandleChange } = useOutletContext<StudyHubContextType>();

  // Get IDs relevant to this section only
  const systemDesignQuestionIds = useMemo(() => initialSystemDesignTopics.flatMap(topic => 
    allQuestions.filter(q => q.topicId === topic.id).map(q => q.id)
  ), [allQuestions]); 

  // Filter questions relevant to this view from context
  const systemDesignQuestions = useMemo(() => allQuestions.filter(q => 
    systemDesignQuestionIds.includes(q.id)
  ), [allQuestions, systemDesignQuestionIds]);

  // State for topics remains local, calculated based on filtered questions
  const [topics, setTopics] = useState<StudyTopic[]>(initialSystemDesignTopics);
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true); // Re-add loading state
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({}); // Re-add updating state

  // Fetch initial progress from Supabase
  const loadProgress = useCallback(async () => {
    if (!user || systemDesignQuestionIds.length === 0) { setIsLoading(false); return; } 
    setIsLoading(true);
    try {
      const progressMap = await fetchStudyProgress(user.id, systemDesignQuestionIds);
      systemDesignQuestionIds.forEach(id => {
         if (progressMap.hasOwnProperty(id)) {
            const currentQuestionState = allQuestions.find(q => q.id === id);
            if (currentQuestionState && currentQuestionState.isCompleted !== progressMap[id]) {
               contextHandleChange(id, progressMap[id]);
            }
         }
      });
    } catch (error) {
       console.error("Failed to load System Design progress", error);
       if ((error as any)?.code !== 'PGRST116' && (error as any)?.message !== 'Not Found') {
         toast({ title: "Error", description: "Could not load System Design progress.", variant: "destructive" });
       }
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, systemDesignQuestionIds, contextHandleChange]); // Removed allQuestions from deps

  useEffect(() => {
    loadProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProgress]); 

  // Update topic progress whenever the relevant questions (from context) change
  useEffect(() => {
    setTopics(currentTopics => 
      currentTopics.map(topic => {
        const topicQuestions = systemDesignQuestions.filter(q => q.topicId === topic.id); // Use filtered questions
        const completedCount = topicQuestions.filter(q => q.isCompleted).length;
        return { ...topic, completedCount, questionCount: topicQuestions.length };
      })
    );
  }, [systemDesignQuestions]); // Depend on filtered questions


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

  // Get questions for a topic from the filtered state
  const getQuestionsForTopic = (topicId: string): StudyQuestion[] => {
    return systemDesignQuestions.filter(q => q.topicId === topicId); // Use filtered questions
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
  const totalSectionQuestions = systemDesignQuestions.length; 
  const completedSectionQuestions = systemDesignQuestions.filter(q => q.isCompleted).length; 

  // --- Render Logic ---
  // Re-add loading state display
  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">System Design</h1>
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">System Design</h1>
      
      {/* Section Progress - Calculated from filtered state */}
      <SectionProgressDisplay 
        sectionName="System Design"
        totalQuestions={totalSectionQuestions}
        completedQuestions={completedSectionQuestions}
      />

      <Accordion type="multiple" className="w-full space-y-4">
        {topics.map((topic) => ( // Use state variable
          <AccordionItem value={topic.id} key={topic.id} className="border rounded-lg bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex justify-between items-center w-full">
                <span className="text-lg font-medium text-card-foreground">{topic.name}</span>
                <Badge variant={topic.completedCount === topic.questionCount && topic.questionCount > 0 ? "default" : "outline"}>
                  {`${topic.completedCount}/${topic.questionCount}`}
                </Badge> 
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-0 pb-4 space-y-3">
              <p className="text-sm text-muted-foreground mb-3">{topic.description}</p>
              {getQuestionsForTopic(topic.id).map((question) => (
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
                      {expandedAnswers[question.id] ? 'Hide Answer' : 'Show Answer'}
                    </Button>
                    {expandedAnswers[question.id] && (
                      <div className="text-sm space-y-2 p-3 bg-muted rounded-md">
                        {question.answer && <p><strong>Answer:</strong> {question.answer}</p>}
                        {question.explanation && <p><em>Explanation:</em> {question.explanation}</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {getQuestionsForTopic(topic.id).length === 0 && (
                 <p className="text-sm text-muted-foreground">No questions added for this topic yet.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default SystemDesignView;
