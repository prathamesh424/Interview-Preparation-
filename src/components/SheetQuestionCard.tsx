import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Using Textarea for now
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronUp,
  LoaderCircle,
  XCircle,
  CheckSquare, // For completed state
  Square // For incomplete state
} from "lucide-react";
import { SheetQuestion } from "@/services/sheetService"; // Use types from sheetService
import { QuestionFeedback, QuestionType, QuestionDifficulty } from "@/types"; // Import missing types from main types file
import { graqService } from "@/services/graqService";
import { useToast } from "@/components/ui/use-toast";

// --- Props ---
interface SheetQuestionCardProps {
  question: SheetQuestion;
  isComplete: boolean;
  onToggleComplete: (questionId: string, isCurrentlyComplete: boolean) => void;
}

// --- Badge Color Helpers (Simplified - adapt if needed) ---
const getDifficultyColor = (difficulty?: string | null) => {
  switch (difficulty) {
    case "Easy": return "bg-green-100 text-green-800";
    case "Medium": return "bg-yellow-100 text-yellow-800";
    case "Hard": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

// --- Component ---
const SheetQuestionCard = ({ question, isComplete, onToggleComplete }: SheetQuestionCardProps) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const { toast } = useToast();

  const handleCheckAnswer = async () => {
    if (!userAnswer.trim()) {
      toast({ title: "Empty Answer", description: "Please write your answer.", variant: "destructive" });
      return;
    }
    setIsChecking(true);
    setFeedback(null);
    setShowFeedback(false);
    try {
      // Pass topic as type if available, otherwise 'Other'. Cast difficulty.
      const feedbackResult = await graqService.checkAnswer({
        question: question.question_text,
        userAnswer,
        questionType: (question.topic || 'Other') as QuestionType, // Use topic or default
        difficulty: (question.difficulty || 'Medium') as QuestionDifficulty, // Cast difficulty, provide default
      });
      setFeedback(feedbackResult);
      setShowFeedback(true);
    } catch (error: any) {
      toast({ title: "Error Checking Answer", description: `Failed to get feedback: ${error.message || 'Please try again.'}`, variant: "destructive" });
      console.error("Error checking answer:", error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className={`sheet-question-card w-full border shadow-sm transition-colors ${isComplete ? 'bg-green-50/50 border-green-200' : 'bg-card'}`}>
      <CardHeader className="space-y-2">
        <div className="flex justify-between items-start gap-2">
           {/* Completion Toggle */}
           <Button
             variant="ghost"
             size="icon"
             className={`h-6 w-6 flex-shrink-0 ${isComplete ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-primary'}`}
             onClick={() => onToggleComplete(question.id, isComplete)}
             aria-label={isComplete ? "Mark as incomplete" : "Mark as complete"}
           >
             {isComplete ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
           </Button>
           {/* Question Text */}
           <CardTitle className={`text-base font-medium flex-grow ${isComplete ? 'line-through text-muted-foreground' : ''}`}>
             {question.question_text}
           </CardTitle>
        </div>
         {/* Badges */}
         <div className="flex flex-wrap gap-2 text-xs pl-8"> {/* Indent badges slightly */}
           {question.difficulty && <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>{question.difficulty}</Badge>}
           {question.topic && <Badge variant="secondary">{question.topic}</Badge>}
         </div>
      </CardHeader>

      {!isComplete && ( // Only show answer/feedback if not marked complete
        <CardContent className="space-y-4 pt-2 pl-8"> {/* Indent content */}
          {/* Answer Input Area */}
          <div className="answer-input-area space-y-2">
            <Textarea
              placeholder="Write your answer here..."
              rows={4}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={isChecking}
              className="w-full p-2 border rounded-md min-h-[80px] focus:ring-1 focus:ring-ring disabled:opacity-70 disabled:bg-muted/20 text-sm"
            />
          </div>

           {/* Check Answer Button */}
           <Button
             variant="default"
             onClick={handleCheckAnswer}
             disabled={isChecking || !userAnswer.trim()}
             size="sm"
           >
             {isChecking ? (
               <> <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Checking... </>
             ) : (
               <> Check Answer <ArrowRight className="ml-1.5 h-4 w-4" /> </>
             )}
           </Button>

          {/* Feedback Display Area */}
          {feedback && showFeedback && (
            <div className="feedback-section space-y-3 p-3 rounded-md border bg-muted/30 mt-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center">
                  Feedback
                  <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                    feedback.score >= 8 ? "bg-green-100 text-green-800 border border-green-300"
                    : feedback.score >= 5 ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                    : "bg-red-100 text-red-800 border border-red-300"
                  }`}>
                    Score: {feedback.score}/10
                  </span>
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-accent" onClick={() => setShowFeedback(false)} aria-label="Hide feedback">
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              <Accordion type="single" collapsible defaultValue={feedback.missed.length > 0 ? "missed" : feedback.correct.length > 0 ? "correct" : undefined} className="w-full">
                {feedback.correct.length > 0 && (
                  <AccordionItem value="correct">
                    <AccordionTrigger className="text-xs font-medium text-green-700 hover:no-underline"><CheckCircle2 className="h-3 w-3 mr-1.5 flex-shrink-0" />What you got right</AccordionTrigger>
                    <AccordionContent className="text-xs"><ul className="list-disc pl-5 space-y-1 mt-1">{feedback.correct.map((point, index) => (<li key={`correct-${index}`}>{point}</li>))}</ul></AccordionContent>
                  </AccordionItem>
                )}
                {feedback.missed.length > 0 && (
                  <AccordionItem value="missed">
                    <AccordionTrigger className="text-xs font-medium text-red-700 hover:no-underline"><XCircle className="h-3 w-3 mr-1.5 flex-shrink-0" />Areas for improvement</AccordionTrigger>
                    <AccordionContent className="text-xs"><ul className="list-disc pl-5 space-y-1 mt-1">{feedback.missed.map((point, index) => (<li key={`missed-${index}`}>{point}</li>))}</ul></AccordionContent>
                  </AccordionItem>
                )}
                {/* Add sections for correctAnswer and suggestions if needed */}
              </Accordion>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default SheetQuestionCard;
