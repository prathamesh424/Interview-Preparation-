import { useState, useEffect, useCallback, useMemo } from 'react'; // Add useMemo
import { sheetService, SheetQuestion } from '@/services/sheetService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge"; // Re-add Badge import
import {
  Select, // Add Select components
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion, // Add Accordion components
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import SheetQuestionCard from './SheetQuestionCard';

interface SheetDetailViewProps {
  sheetId: string;
  sheetName: string;
  onBack: () => void; // Function to go back to the list
}

const SheetDetailView = ({ sheetId, sheetName, onBack }: SheetDetailViewProps) => {
  const [allQuestions, setAllQuestions] = useState<SheetQuestion[]>([]); // Store all questions for the sheet
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all"); // Filter state
  const [selectedType, setSelectedType] = useState<string>("all"); // Filter state
  const { toast } = useToast();

  // --- Data Fetching ---

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch questions and progress concurrently
      const [fetchedQuestions, fetchedProgress] = await Promise.all([
        sheetService.getSheetQuestions(sheetId),
        sheetService.getUserSheetProgress(sheetId)
      ]);
      setAllQuestions(fetchedQuestions); // Store all fetched questions
      setCompletedQuestions(fetchedProgress);
    } catch (err: any) {
      setError(err.message || 'Failed to load sheet details.');
      console.error("Error fetching sheet details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sheetId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Filtering and Grouping Logic ---
  const uniqueDifficulties = useMemo(() => Array.from(new Set(allQuestions.map(q => q.difficulty).filter(Boolean) as string[])).sort(), [allQuestions]);
  const uniqueTypes = useMemo(() => Array.from(new Set(allQuestions.map(q => q.question_type).filter(Boolean) as string[])).sort(), [allQuestions]);

  const filteredAndGroupedQuestions = useMemo(() => {
    // Apply filters first
    const filtered = allQuestions.filter(q =>
      (selectedDifficulty === "all" || q.difficulty === selectedDifficulty) &&
      (selectedType === "all" || q.question_type === selectedType)
    );

    // Then group by topic
    return filtered.reduce((acc, question) => {
      const topic = question.topic || "General"; // Group null topics under "General"
      if (!acc[topic]) {
        acc[topic] = [];
      }
      acc[topic].push(question);
      return acc;
    }, {} as Record<string, SheetQuestion[]>);

  }, [allQuestions, selectedDifficulty, selectedType]);

  const topics = useMemo(() => Object.keys(filteredAndGroupedQuestions).sort(), [filteredAndGroupedQuestions]);

  // --- Progress Calculation ---
  // Calculate progress based on FILTERED questions to reflect current view
  const totalFilteredQuestions = useMemo(() => Object.values(filteredAndGroupedQuestions).flat().length, [filteredAndGroupedQuestions]);
  const completedFilteredCount = useMemo(() => {
      const filteredIds = new Set(Object.values(filteredAndGroupedQuestions).flat().map(q => q.id));
      return Array.from(completedQuestions).filter(id => filteredIds.has(id)).length;
  }, [completedQuestions, filteredAndGroupedQuestions]);
  const progressPercentage = totalFilteredQuestions > 0 ? (completedFilteredCount / totalFilteredQuestions) * 100 : 0;


  // --- Event Handlers ---
  const handleToggleComplete = async (questionId: string, isCurrentlyComplete: boolean) => {
    const originalProgress = new Set(completedQuestions); // Keep original for rollback
    setCompletedQuestions(prev => {
      const newProgress = new Set(prev);
      if (isCurrentlyComplete) {
        newProgress.delete(questionId);
      } else {
        newProgress.add(questionId);
      }
      return newProgress;
    });

    try {
      if (isCurrentlyComplete) {
        await sheetService.markQuestionIncomplete(sheetId, questionId);
      } else {
        await sheetService.markQuestionComplete(sheetId, questionId);
      }
      // Optional: show success toast
    } catch (err: any) {
      // Revert UI on error
      setCompletedQuestions(originalProgress);
      toast({
        title: "Error updating progress",
        description: err.message || "Could not update question status.",
        variant: "destructive",
      });
      console.error("Error toggling complete status:", err);
    }
  };

  const handleDifficultyChange = (value: string) => setSelectedDifficulty(value);
  const handleTypeChange = (value: string) => setSelectedType(value);


  // --- Render Logic ---
  return (
    <div className="sheet-detail-view space-y-6">
      {/* Back Button and Sheet Title */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="flex-shrink-0">
          &larr; Back to Sheets
        </Button>
        <h2 className="text-2xl sm:text-3xl font-bold truncate text-center">{sheetName}</h2>
        <div className="w-[calc(theme(space.10)+theme(space.4))] flex-shrink-0"></div> {/* Spacer to balance title */}
      </div>


      {/* Filters */}
      <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
         {/* Difficulty Filter */}
         {uniqueDifficulties.length > 0 && (
            <Select value={selectedDifficulty} onValueChange={handleDifficultyChange}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
                <SelectValue placeholder="Filter by Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                {uniqueDifficulties.map(diff => (
                  <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                ))}
              </SelectContent>
            </Select>
         )}
         {/* Type Filter */}
         {uniqueTypes.length > 0 && (
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
         )}
      </div>

      {/* Progress Bar - Based on filtered questions */}
      {totalFilteredQuestions > 0 && (
        <div className="space-y-2">
           <div className="flex justify-between text-sm text-muted-foreground">
             <span>Filtered Progress</span>
             <span>{completedFilteredCount} / {totalFilteredQuestions} Completed</span>
           </div>
           <Progress value={progressPercentage} className="w-full" />
        </div>
      )}


      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-2 text-muted-foreground">Loading questions...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && allQuestions.length === 0 && ( // Check allQuestions for initial empty state
        <p className="text-muted-foreground text-center py-6">This sheet has no questions yet.</p>
      )}

      {!isLoading && !error && allQuestions.length > 0 && topics.length === 0 && ( // Check if filters resulted in no topics
         <p className="text-muted-foreground text-center py-6">No questions match the current filters.</p>
      )}

      {!isLoading && !error && topics.length > 0 && (
        <Accordion type="multiple" className="w-full space-y-3">
          {topics.map((topic) => (
            <AccordionItem value={topic} key={topic} className="border rounded-md px-4 bg-card">
              <AccordionTrigger className="text-lg font-medium hover:no-underline py-3">
                {topic}
                <Badge variant="secondary" className="ml-3">
                  {filteredAndGroupedQuestions[topic].length} Qs
                </Badge>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                {filteredAndGroupedQuestions[topic].map((q) => (
                   <SheetQuestionCard
                     key={q.id}
                     question={q}
                     isComplete={completedQuestions.has(q.id)}
                     onToggleComplete={handleToggleComplete}
                   />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default SheetDetailView;
