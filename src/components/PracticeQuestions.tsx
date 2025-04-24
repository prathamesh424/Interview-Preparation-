import QuestionGenerator from "@/components/QuestionGenerator";
import QuestionCard from "@/components/QuestionCard";
import { Question, SavedQuestion } from "@/types";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { storageService } from "@/services/storageService";

const PracticeQuestions = () => {
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const { toast } = useToast();

  const handleQuestionsGenerated = (questions: Question[]) => {
    setGeneratedQuestions(questions);
    toast({
      title: "Questions Generated",
      description: `${questions.length} questions have been generated.`,
    });
  };

  const handleSaveQuestion = (savedQuestion: SavedQuestion) => {
    storageService.saveQuestion(savedQuestion);
    toast({
      title: "Question Saved",
      description: "Saved to your profile.",
    });
  };

  return (
    <div className="flex gap-6">
      <div className="w-1/3">
        <h2 className="text-xl font-semibold mb-4 text-center">Generate Questions</h2>
        <QuestionGenerator onQuestionsGenerated={handleQuestionsGenerated} />
      </div>

      {generatedQuestions.length > 0 ? (
        <div className="w-2/3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Practice Questions</h2>
            <Button variant="outline" size="sm" onClick={() => setGeneratedQuestions([])}>
              Clear All
            </Button>
          </div>
          <Separator className="mb-6" />
          <div className="space-y-6">
            {generatedQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} onSave={handleSaveQuestion} />
            ))}
          </div>
        </div>
      ) : (
        <div className="w-2/3 flex items-center justify-center border border-dashed rounded-lg p-8">
          <p className="text-muted-foreground text-center">Generate questions to see them here</p>
        </div>
      )}
    </div>
  );
};

export default PracticeQuestions;
