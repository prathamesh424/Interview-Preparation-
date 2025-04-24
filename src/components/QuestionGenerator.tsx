
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox"; // Will remove later if not needed
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"; // Add Card parts
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Import ToggleGroup
import { Alert, AlertDescription } from "@/components/ui/alert"; // Import Alert
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoaderCircle } from "lucide-react";
import ContentInput from "./ContentInput";
import ApiKeyForm from "./ApiKeyForm";
import { graqService } from "@/services/graqService";
import { apiKeyService } from "@/services/apiKeyService";
import { DifficultyLevel, Question, QuestionType } from "@/types";
import { useToast } from "@/components/ui/use-toast";

interface QuestionGeneratorProps {
  onQuestionsGenerated: (questions: Question[]) => void;
}

const QuestionGenerator = ({ onQuestionsGenerated }: QuestionGeneratorProps) => {
  const [content, setContent] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [numQuestions, setNumQuestions] = useState(3);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    "Theory",
    "Code Writing",
  ]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<DifficultyLevel[]>([
    "Beginner", 
    "Intermediate"
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth(); // Get user and loading state

  // Check if API key exists on component mount
  useEffect(() => {
    const checkApiKey = async () => {
      const hasKey = await apiKeyService.hasApiKey();
      setHasApiKey(hasKey);
    };
    
    checkApiKey();
  }, []);

  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: "Theory", label: "Theory" },
    { value: "Code Writing", label: "Code Writing" },
    { value: "Find the Error in Code", label: "Find the Error in Code" },
    { value: "Scenario-Based", label: "Scenario-Based" },
    { value: "Other", label: "Other" },
  ];

  const difficultyLevels: { value: DifficultyLevel; label: string }[] = [
    { value: "Beginner", label: "Beginner" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Hard", label: "Hard" },
  ];

  // Handlers for ToggleGroup (expects array of strings)
  const handleTypeChange = (value: QuestionType[]) => {
    // Ensure at least one type is selected if needed, or handle empty array
    setSelectedTypes(value);
  };

  const handleDifficultyChange = (value: DifficultyLevel[]) => {
    // Ensure at least one difficulty is selected if needed, or handle empty array
    setSelectedDifficulties(value);
  };

  const handleNumQuestionsChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      setNumQuestions(num);
    }
  };

  const handleContentSet = (newContent: string) => {
    setContent(newContent);
  };

  const handleApiKeySet = () => {
    setHasApiKey(true);
  };

  const handleGenerate = async () => {
    // Check for authentication first
    if (!user) {
      setError("Please log in to generate questions.");
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to use this feature.",
        variant: "destructive",
      });
      return;
    }

    if (!hasApiKey) {
      setError("Please set your Gemini API key first.");
      return;
    }

    if (!content) {
      setError("Please provide content for question generation.");
      return;
    }

    if (selectedTypes.length === 0) {
      setError("Please select at least one question type.");
      return;
    }

    if (selectedDifficulties.length === 0) {
      setError("Please select at least one difficulty level.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    console.log("here 1")

    try {
      const questions = await graqService.generateQuestions({
        content,
        types: selectedTypes,
        difficulties: selectedDifficulties,
        count: numQuestions,
      });

      console.log("hereerere",questions)

      onQuestionsGenerated(questions);
      
      // Clear content after successful generation
      setContent("");
    } catch (err) {
      setError("Failed to generate questions. Please try again.");
      toast({
        title: "Error generating questions",
        description: "There was a problem generating your questions. Please try again.",
        variant: "destructive"
      });
      console.error("Error generating questions:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // If no API key is set, show the form to set it
  if (!hasApiKey) {
    return <ApiKeyForm onApiKeySet={handleApiKeySet} />;
  }

  // Main component structure using Card parts
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Generate Interview Questions</CardTitle>
        <CardDescription>Provide content and configure options to generate relevant questions using AI.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Content Input */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Step 1: Provide Content</Label>
          <ContentInput onContentSet={handleContentSet} />
          {content && (
            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Content Preview:</Label>
              <div className="border rounded-md p-3 mt-1 text-sm bg-muted/30 max-h-32 overflow-y-auto scrollbar-thin">
                {content.substring(0, 300)}
                {content.length > 300 ? "..." : ""}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Configure Questions */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Step 2: Configure Questions</Label>
          
          {/* Question Types using ToggleGroup */}
          <div className="space-y-2">
            <Label>Question Types (Select one or more)</Label>
            <ToggleGroup
              type="multiple" // Allow multiple selections
              variant="outline"
              value={selectedTypes}
              onValueChange={handleTypeChange} // Use new handler
              className="flex flex-wrap gap-2"
            >
              {questionTypes.map((type) => (
                <ToggleGroupItem key={type.value} value={type.value} aria-label={`Toggle ${type.label}`}>
                  {type.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Difficulty Levels using ToggleGroup */}
          <div className="space-y-2">
            <Label>Difficulty Levels (Select one or more)</Label>
            <ToggleGroup
              type="multiple"
              variant="outline"
              value={selectedDifficulties}
              onValueChange={handleDifficultyChange} // Use new handler
              className="flex flex-wrap gap-2"
            >
              {difficultyLevels.map((level) => (
                <ToggleGroupItem key={level.value} value={level.value} aria-label={`Toggle ${level.label}`}>
                  {level.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Number of Questions */}
          <div className="space-y-2">
            <Label htmlFor="num-questions">Number of Questions</Label>
            <Select
              value={numQuestions.toString()}
              onValueChange={handleNumQuestionsChange}
            >
              <SelectTrigger id="num-questions" className="w-full">
                <SelectValue placeholder="Number of questions" />
              </SelectTrigger>
              <SelectContent>
                {[1, 3, 5, 10].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error Display using Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-4 pt-4">
        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !content || isAuthLoading || !user || selectedTypes.length === 0 || selectedDifficulties.length === 0} // Updated disabled check
          className="w-full"
        >
          {isAuthLoading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading Auth...
            </>
          ) : isGenerating ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Generating...
            </>
          ) : (
            "Generate Questions"
          )}
        </Button>
        {/* Change API Key Link */}
        <div className="text-xs text-muted-foreground text-right">
          <Button
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={() => {
              apiKeyService.clearApiKey();
              setHasApiKey(false);
            }}
          >
            Change API Key
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default QuestionGenerator;