 
import { useState, useCallback, useEffect } from "react"; // Add useEffect
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Import Popover
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"; // Import Command
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronUp,
  LoaderCircle,
  XCircle,
  Check, // Icon for Combobox
  ChevronsUpDown // Icon for Combobox
} from "lucide-react";

// --- CodeMirror Imports ---
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';


// --- Type Imports ---
// Ensure this type definition includes questionText, codeSnippet, codeLanguage
import {
  Question,
  QuestionFeedback,
  SavedQuestion,
  QuestionType,
  QuestionDifficulty // Using QuestionDifficulty based on previous refactor
} from "@/types";
import { graqService } from "@/services/graqService";
// import { storageService } from "@/services/storageService"; // Replace with practiceService
import { practiceService } from "@/services/practiceService"; // Import the new service
import { useToast } from "@/components/ui/use-toast";

// --- Props ---
interface QuestionCardProps {
  // Expect the Question object with potentially separate text/code fields
  question: Question;
  onSave?: (savedQuestion: SavedQuestion) => void;
}

// --- Helper Functions ---

// Helper to get CodeMirror language extension based on string
const getLanguageExtension = (lang?: string) => {
  switch (lang?.toLowerCase()) {
    case 'javascript': case 'js': case 'jsx':
      return [javascript({ jsx: true })];
    case 'css':
      return [css()];
    case 'python': case 'py':
      return [python()];
    // Add more languages as needed
    default:
      return []; // No specific language highlighting
  }
};

// Simple heuristic to check if a string likely contains code
const looksLikeCode = (text?: string): boolean => {
  if (!text) return false;
  // Check for multiple lines, indentation, common code symbols like ;, {, }, (, ), =, etc.
  const lines = text.split('\n');
  if (lines.length > 1) return true; // Multiple lines are a good indicator
  if (text.includes(';') || text.includes('{') || text.includes('}') || text.includes('=>') || text.includes('def ')) return true; // Common symbols
  if (text.trim().startsWith('function') || text.trim().startsWith('class') || text.trim().startsWith('import')) return true; // Keywords
  return false;
};


// --- Badge Color Helpers (using QuestionDifficulty) ---
const getDifficultyColor = (difficulty: QuestionDifficulty) => {
  switch (difficulty) {
    case "Easy": // Assuming 'Easy' instead of 'Beginner' based on previous types
      return "bg-green-100 text-green-800 hover:bg-green-100 border-green-400";
    case "Medium": // Assuming 'Medium' instead of 'Intermediate'
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-400";
    case "Hard":
      return "bg-red-100 text-red-800 hover:bg-red-100 border-red-400";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-400";
  }
};

const getTypeColor = (type: QuestionType) => {
  switch (type) {
    case "Theory":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-400";
    case "Code Writing":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-400";
    case "Find the Error in Code":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-400";
    case "Scenario-Based":
      return "bg-teal-100 text-teal-800 hover:bg-teal-100 border-teal-400";
    default:
      // Consider if 'Other' needs a specific color or falls back to gray
      return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-400";
  }
};


// --- Component ---
const QuestionCard = ({ question, onSave }: QuestionCardProps) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [existingSubCategories, setExistingSubCategories] = useState<string[]>([]); // State for fetched sub-categories
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [isSubCategoryPopoverOpen, setIsSubCategoryPopoverOpen] = useState(false); // State for Sub-category Combobox
  const { toast } = useToast();

  // Determine if the answer input should be a code editor
  const requiresCodeEditor = question.type === 'Code Writing' || question.type === 'Find the Error in Code';
  const answerLanguageExtension = getLanguageExtension(question.codeLanguage || (requiresCodeEditor ? 'javascript' : undefined));
  const questionLanguageExtension = getLanguageExtension(question.codeLanguage);

  // useCallback for CodeMirror onChange performance
  const handleAnswerChange = useCallback((value: string) => {
    setUserAnswer(value);
  }, []);

  // Fetch existing categories when feedback is first available
  useEffect(() => {
    if (feedback && !isSaved && existingCategories.length === 0) { // Fetch only once
      practiceService.getUniqueCategories()
        .then(setExistingCategories)
        .catch(err => console.error("Failed to fetch categories:", err));
    }
  }, [feedback, isSaved, existingCategories.length]);

  // Fetch existing sub-categories when a category is selected
  useEffect(() => {
    if (category && feedback && !isSaved) {
      practiceService.getUniqueSubCategories(category)
        .then(setExistingSubCategories)
        .catch(err => console.error("Failed to fetch sub-categories:", err));
    } else {
      setExistingSubCategories([]); // Clear sub-categories if category is cleared
    }
  }, [category, feedback, isSaved]);

  // --- API/Service Calls ---

  const handleCheckAnswer = async () => {
    if (!userAnswer.trim()) {
      toast({
        title: "Empty Answer",
        description: "Please write your answer before checking.",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    setFeedback(null); // Clear previous feedback before checking
    setShowFeedback(false); // Hide feedback section temporarily

    try {
      // *** IMPORTANT: Update the parameters passed to checkAnswer ***
      // Send the relevant parts of the question for context
      const feedbackResult = await graqService.checkAnswer({
        question: question.questionText, // Send the text part
 
        userAnswer,
        questionType: question.type,
        difficulty: question.difficulty,
      });

      setFeedback(feedbackResult);
      setShowFeedback(true); // Show feedback section after getting results

    } catch (error: any) {
      toast({
        title: "Error Checking Answer",
        description: `Failed to get feedback: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
      console.error("Error checking answer:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveQuestion = async () => { // Make async
    if (!feedback) {
      toast({
        title: "Cannot Save Yet",
        description: "Please check your answer first to get feedback before saving.",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for the service, including the category
    const dataToSave = {
      question_id: question.id, // Pass original question ID if available
      question_text: question.questionText, // Use the correct field name
      question_type: question.type,
      difficulty: question.difficulty,
      user_answer: userAnswer,
      feedback: feedback, // Pass the feedback object
      category: category.trim() || null,
      sub_category: subCategory.trim() || null,
    };

    try {
      // --- Add new category/subcategory to state if they don't exist ---
      const trimmedCategory = category.trim();
      const trimmedSubCategory = subCategory.trim();

      if (trimmedCategory && !existingCategories.some(c => c.toLowerCase() === trimmedCategory.toLowerCase())) {
        setExistingCategories(prev => [...prev, trimmedCategory].sort()); // Add and sort
      }
      if (trimmedSubCategory && !existingSubCategories.some(sc => sc.toLowerCase() === trimmedSubCategory.toLowerCase())) {
        setExistingSubCategories(prev => [...prev, trimmedSubCategory].sort()); // Add and sort
      }
      // --- End of addition ---

      await practiceService.savePracticeAttempt(dataToSave); // Call the new service
      setIsSaved(true); 

      toast({
        title: "Practice Attempt Saved",
        description: "Your question, answer, and feedback have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Could not save the practice attempt.",
        variant: "destructive",
      });
      console.error("Error saving practice attempt:", error);
    }
  };

  // --- Render Logic ---
  return (
    <Card className="question-card w-full border shadow-sm">
      <CardHeader className="space-y-3">
        {/* Badges for Difficulty and Type */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={`border ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </Badge>
          <Badge variant="outline" className={`border ${getTypeColor(question.type)}`}>
            {question.type}
          </Badge>
        </div>

        {/* Display Question Text */}
        {/* Use questionText here */}
        <CardTitle className="text-lg font-medium">{question.questionText}</CardTitle>

        {/* Conditionally Display Code Snippet for the Question */}
        {question.codeSnippet && (
          <div className="code-snippet-display mt-2 border rounded-md overflow-hidden bg-[#272822]"> {/* Okaidia bg */}
            <CodeMirror
              value={question.codeSnippet}
              theme={oneDark}
              extensions={questionLanguageExtension}
              height="auto"
              maxHeight="350px"
              readOnly={true}
              basicSetup={{ // Minimal setup for display
                lineNumbers: true,
                foldGutter: false,
                highlightActiveLine: false,
                autocompletion: false,
                drawSelection: false,
              }}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Answer Input Area: CodeMirror or Textarea */}
        <div className="answer-input-area space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Your Answer:</label>
          {requiresCodeEditor ? (
            <div className="border rounded-md overflow-hidden">
              <CodeMirror
                value={userAnswer}
                theme={oneDark} // Use your preferred editor theme
                extensions={answerLanguageExtension}
                height="200px" // Adjust height as needed
                onChange={handleAnswerChange} // Use the useCallback wrapper
                readOnly={isChecking} // Disable while checking
                basicSetup={{ // Common editor setup
                  lineNumbers: true,
                  foldGutter: true,
                  autocompletion: true, // Enable basic completion
                  highlightActiveLineGutter: true,
                  highlightActiveLine: true,
                }}
              />
            </div>
          ) : (
            // Fallback to Textarea for non-code questions
            <textarea
                placeholder="Write your answer here..."
                rows={5}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)} // Direct change handler ok for textarea
                disabled={isChecking}
                className="w-full p-2 border rounded-md min-h-[100px] focus:ring-1 focus:ring-ring disabled:opacity-70 disabled:bg-muted/20"
            />
          )}
        </div>

        {/* Feedback Display Area */}
        {feedback && showFeedback && (
          // Added animation class example (requires setup in tailwind.config.js or global CSS)
          <div className="feedback-section space-y-3 p-4 rounded-md border bg-muted/30 mt-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base flex items-center">
                Feedback
                {/* Score Badge */}
                <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                  feedback.score >= 8 ? "bg-green-100 text-green-800 border border-green-300"
                  : feedback.score >= 5 ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  : "bg-red-100 text-red-800 border border-red-300"
                }`}>
                  Score: {feedback.score}/10
                </span>
              </h3>
              {/* Hide Button */}
              <Button
                variant="ghost"
                size="icon" // Make it smaller
                className="h-6 w-6 text-muted-foreground hover:bg-accent"
                onClick={() => setShowFeedback(false)}
                aria-label="Hide feedback"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>

            {/* Feedback Accordion */}
            <Accordion type="single" collapsible defaultValue={feedback.missed.length > 0 ? "missed" : feedback.correct.length > 0 ? "correct" : undefined} className="w-full">
              {/* Correct Points */}
              {feedback.correct.length > 0 && (
                <AccordionItem value="correct">
                  <AccordionTrigger className="text-sm font-medium text-green-700 hover:no-underline">
                    <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                    What you got right
                  </AccordionTrigger>
                  <AccordionContent className="text-sm">
                    <ul className="list-disc pl-6 space-y-1 mt-1">
                      {feedback.correct.map((point, index) => (
                        <li key={`correct-${index}`}>{point}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Missed Points */}
              {feedback.missed.length > 0 && (
                <AccordionItem value="missed">
                  <AccordionTrigger className="text-sm font-medium text-red-700 hover:no-underline">
                    <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    Areas for improvement
                  </AccordionTrigger>
                  <AccordionContent className="text-sm">
                    <ul className="list-disc pl-6 space-y-1 mt-1">
                      {feedback.missed.map((point, index) => (
                        <li key={`missed-${index}`}>{point}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Correct Answer Display */}
              {feedback.correctAnswer && (
                <AccordionItem value="answer">
                  <AccordionTrigger className="text-sm font-medium hover:no-underline">Correct Answer / Example</AccordionTrigger>
                  <AccordionContent>
                    {looksLikeCode(feedback.correctAnswer) ? (
                       <div className="code-snippet-feedback mt-1 border rounded-md overflow-hidden bg-[#272822]">
                         <CodeMirror
                           value={feedback.correctAnswer}
                           theme={oneDark}
                           // Attempt to get language hint if available, otherwise default
                           extensions={getLanguageExtension(question.codeLanguage)} // Use question's language as a hint
                           readOnly={true}
                           height="auto"
                           maxHeight="300px"
                           basicSetup={{ lineNumbers: true, foldGutter: false }}
                         />
                       </div>
                    ) : (
                      // Render as plain text if it doesn't look like code
                      <div className="p-3 text-sm bg-background/50 rounded-md whitespace-pre-wrap mt-1 border">
                        {feedback.correctAnswer}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Suggestions */}
              {feedback.suggestions && (
                <AccordionItem value="suggestions">
                  <AccordionTrigger className="text-sm font-medium hover:no-underline">Suggestions</AccordionTrigger>
                  <AccordionContent>
                     <div className="p-3 text-sm bg-background/50 rounded-md whitespace-pre-wrap mt-1 border">
                       {feedback.suggestions}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between space-x-2 pt-4">
        {/* Check Answer Button */}
        <Button
          variant="default"
          onClick={handleCheckAnswer}
          disabled={isChecking || !userAnswer.trim()}
          size="sm" // Adjust size if needed
        >
          {isChecking ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Checking...
            </>
          ) : (
            <>
              Check Answer <ArrowRight className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>

        {/* Category/Sub-category Inputs and Save Button Group */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Conditionally render category/sub-category inputs only when feedback is available */}
          {feedback && !isSaved && (
            <>
              {/* Category Combobox */}
              <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isCategoryPopoverOpen}
                    className="w-full sm:w-[200px] justify-between h-9 text-sm font-normal"
                    disabled={isSaved || isChecking}
                  >
                    {category || "Select category..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command shouldFilter={true}> {/* Enable default filtering */}
                    <CommandInput placeholder="Search or add category..." />
                    <CommandList>
                      <CommandEmpty>No category found. Type to add.</CommandEmpty>
                      <CommandGroup>
                        {existingCategories.map((cat) => (
                          <CommandItem
                            key={cat}
                            value={cat}
                            onSelect={(currentValue) => {
                              setCategory(currentValue === category ? "" : currentValue);
                              setIsCategoryPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                category === cat ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {cat}
                          </CommandItem>
                        ))}
                         {/* Allow adding new category implicitly by typing */}
                      </CommandGroup>
                    </CommandList>
                     {/* Handle free text input - update category state directly */}
                     <CommandInput
                        onValueChange={(search) => {
                          // If user types something not in the list, update category state
                          if (!existingCategories.some(c => c.toLowerCase() === search.toLowerCase())) {
                            setCategory(search);
                          }
                        }}
                      />
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Sub-category Combobox (only enabled if category is selected) */}
              <Popover open={isSubCategoryPopoverOpen} onOpenChange={setIsSubCategoryPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isSubCategoryPopoverOpen}
                    className="w-full sm:w-[200px] justify-between h-9 text-sm font-normal"
                    disabled={isSaved || isChecking || !category} // Disable if no category selected
                  >
                    {subCategory || "Select sub-category..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command shouldFilter={true}>
                    <CommandInput placeholder="Search or add sub-category..." />
                    <CommandList>
                      <CommandEmpty>No sub-category found. Type to add.</CommandEmpty>
                      <CommandGroup>
                        {existingSubCategories.map((subCat) => (
                          <CommandItem
                            key={subCat}
                            value={subCat}
                            onSelect={(currentValue) => {
                              setSubCategory(currentValue === subCategory ? "" : currentValue);
                              setIsSubCategoryPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                subCategory === subCat ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {subCat}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                    <CommandInput
                      onValueChange={(search) => {
                        if (!existingSubCategories.some(sc => sc.toLowerCase() === search.toLowerCase())) {
                          setSubCategory(search);
                        }
                      }}
                    />
                  </Command>
                </PopoverContent>
              </Popover>
            </>
          )}
          {/* Save Button */}
          <Button
            variant="outline"
            onClick={handleSaveQuestion}
            disabled={!feedback || isSaved || isChecking}
            size="sm"
            className="flex-shrink-0" // Prevent shrinking
          >
             {isSaved ? (
               <>
                 <BookmarkCheck className="mr-1.5 h-4 w-4" /> Saved
               </>
             ) : (
               <>
                 <Bookmark className="mr-1.5 h-4 w-4" /> Save Question
               </>
             )}
           </Button>
        </div> {/* Closing div */}
      </CardFooter>
    </Card>
  );
};

export default QuestionCard;

// Optional: Add fade-in animation in your global CSS or tailwind.config.js
/* Example in global CSS:
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
*/
/* Example in tailwind.config.js (requires setup):
 theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out forwards',
      },
    },
  },
*/
