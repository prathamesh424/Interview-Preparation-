import { useState, useEffect } from 'react';
import { practiceService, SavedPracticeData } from '@/services/practiceService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoaderCircle, Filter } from 'lucide-react'; // Add Filter icon
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Add Button
import {
  Select, // Add Select components
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Basic display component for a single saved attempt
// Extend SavedPracticeData to include the database ID if needed for keys
interface DisplayableSavedPracticeData extends SavedPracticeData {
  id: string;
  // Add other fields if they are returned and needed, like created_at, updated_at
  created_at: string;
  updated_at: string;
}

const SavedAttemptCard = ({ attempt }: { attempt: DisplayableSavedPracticeData }) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start mb-2 gap-2">
          <CardTitle className="text-lg flex-grow">{attempt.question_text}</CardTitle>
          {/* Display Category/Sub-category Badges */}
          <div className="flex flex-col items-end flex-shrink-0">
             {attempt.category && (
               <Badge variant="secondary" className="mb-1">{attempt.category}</Badge>
             )}
             {/* Display Sub-category only if Category also exists */}
             {attempt.category && attempt.sub_category && (
               <Badge variant="outline" className="text-xs">{attempt.sub_category}</Badge>
             )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3">
          <span>Type: <Badge variant="outline" className="font-normal">{attempt.question_type}</Badge></span>
          <span>Difficulty: <Badge variant="outline" className="font-normal">{attempt.difficulty}</Badge></span>
          {/* Optionally display saved date */}
          {/* <span className="text-xs">Saved: {new Date(attempt.created_at).toLocaleDateString()}</span> */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="font-semibold mb-1">Your Answer:</p>
          <p className="text-sm p-3 bg-muted/30 rounded border whitespace-pre-wrap">{attempt.user_answer}</p>
        </div>
        {attempt.feedback && (
          <div>
            <p className="font-semibold mb-1">Feedback (Score: {attempt.feedback.score}/10):</p>
            <Accordion type="single" collapsible className="w-full text-sm">
              {attempt.feedback.correct.length > 0 && (
                <AccordionItem value="correct">
                  <AccordionTrigger>What you got right</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-5 space-y-1">
                      {attempt.feedback.correct.map((point, index) => <li key={`c-${index}`}>{point}</li>)}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
              {attempt.feedback.missed.length > 0 && (
                <AccordionItem value="missed">
                  <AccordionTrigger>Areas for improvement</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-5 space-y-1">
                      {attempt.feedback.missed.map((point, index) => <li key={`m-${index}`}>{point}</li>)}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
              {/* Add sections for correctAnswer and suggestions if needed */}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


const SavedPracticeList = () => {
  const [allAttempts, setAllAttempts] = useState<DisplayableSavedPracticeData[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<DisplayableSavedPracticeData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]); // State for unique sub-categories
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all"); // Filter state for sub-category
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchAttempts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Cast the result to include the 'id' field expected from the DB
        const attempts = (await practiceService.getSavedPracticeAttempts()) as DisplayableSavedPracticeData[];
        setAllAttempts(attempts);
        setFilteredAttempts(attempts);

        setFilteredAttempts(attempts);

        // --- Extract unique filter options (excluding sub-categories initially) ---
        const uniqueCategoriesMap = new Map<string, boolean>();
        const uniqueDifficulties = new Set<string>();
        const uniqueTypes = new Set<string>();
        let hasUncategorized = false;

        attempts.forEach(a => {
          const category = a.category?.trim();
          if (category) {
            uniqueCategoriesMap.set(category, true);
          } else {
            hasUncategorized = true;
          }
          uniqueDifficulties.add(a.difficulty);
          uniqueTypes.add(a.question_type);
        });

        const sortedCategories = Array.from(uniqueCategoriesMap.keys()).sort();
        if (hasUncategorized) {
          sortedCategories.push("Uncategorized");
        }

        setCategories(sortedCategories);
        // Don't set all sub-categories here anymore
        setDifficulties(Array.from(uniqueDifficulties).sort());
        setTypes(Array.from(uniqueTypes).sort());
        // --- End initial extraction ---

      } catch (err: any) {
        setError(err.message || 'Failed to load saved practice attempts.');
        console.error("Error fetching saved attempts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttempts();
  }, []);

  // Update available sub-categories when the selected category changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== "all" && selectedCategory !== "Uncategorized") {
      const relevantSubCategories = Array.from(
        new Set(
          allAttempts
            .filter(a => a.category === selectedCategory && a.sub_category?.trim()) // Filter by selected category and ensure sub-category exists
            .map(a => a.sub_category!.trim()) // Map to sub-category
        )
      ).sort();
      setSubCategories(relevantSubCategories);
    } else {
      setSubCategories([]); // Clear sub-categories if no specific category is selected
    }
    // Reset sub-category selection whenever category changes (handled in handleCategoryChange)
  }, [selectedCategory, allAttempts]);


  // Filter attempts when any filter or the source data changes
  useEffect(() => {
    let currentlyFiltered = allAttempts;

    // Apply Category Filter
    if (selectedCategory !== "all") {
      if (selectedCategory === "Uncategorized") {
        currentlyFiltered = currentlyFiltered.filter(attempt => !attempt.category?.trim());
      } else {
        currentlyFiltered = currentlyFiltered.filter(attempt => attempt.category === selectedCategory);
      }
    }

    // Apply Sub-category Filter (only if a specific category is also selected)
    // If 'All Categories' is selected, sub-category filter doesn't make sense, so we ignore it.
    if (selectedCategory !== "all" && selectedCategory !== "Uncategorized" && selectedSubCategory !== "all") {
       currentlyFiltered = currentlyFiltered.filter(attempt => attempt.sub_category === selectedSubCategory);
    }
    // Note: We don't filter by sub-category if category is "Uncategorized" or "all"

    // Apply Difficulty Filter
    if (selectedDifficulty !== "all") {
      currentlyFiltered = currentlyFiltered.filter(attempt => attempt.difficulty === selectedDifficulty);
    }

    // Apply Type Filter
    if (selectedType !== "all") {
      currentlyFiltered = currentlyFiltered.filter(attempt => attempt.question_type === selectedType);
    }

    setFilteredAttempts(currentlyFiltered);
  }, [selectedCategory, selectedSubCategory, selectedDifficulty, selectedType, allAttempts]);

  const handleCategoryChange = (value: string) => {
      setSelectedCategory(value);
      setSelectedSubCategory("all"); // Reset sub-category when category changes
  };
  const handleSubCategoryChange = (value: string) => setSelectedSubCategory(value);
  const handleDifficultyChange = (value: string) => setSelectedDifficulty(value);
  const handleTypeChange = (value: string) => setSelectedType(value);

  return (
    <div className="saved-practice-list space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold mb-2 sm:mb-0">Saved Practice Questions</h2>
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
          {/* Category Filter */}
          {categories.length > 0 && (
             <Select value={selectedCategory} onValueChange={handleCategoryChange}>
               <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
                 <SelectValue placeholder="Filter by Category" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Categories</SelectItem>
                 {categories.map(cat => (
                   <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
          )}
          {/* Difficulty Filter */}
          {difficulties.length > 0 && (
             <Select value={selectedDifficulty} onValueChange={handleDifficultyChange}>
               <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
                 <SelectValue placeholder="Filter by Difficulty" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Difficulties</SelectItem>
                  {difficulties.map(diff => (
                    <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
           )}
           {/* Sub-category Filter (conditionally shown) */}
           {selectedCategory !== "all" && selectedCategory !== "Uncategorized" && subCategories.length > 0 && (
             <Select value={selectedSubCategory} onValueChange={handleSubCategoryChange}>
               <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
                 <SelectValue placeholder="Filter by Sub-category" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Sub-categories</SelectItem>
                 {/* Consider fetching sub-categories specific to the selected category here if needed */}
                 {subCategories.map(subCat => (
                   <SelectItem key={subCat} value={subCat}>{subCat}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           )}
           {/* Type Filter */}
           {types.length > 0 && (
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
                  <SelectValue placeholder="Filter by Type" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Types</SelectItem>
                 {types.map(type => (
                   <SelectItem key={type} value={type}>{type}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
          )}
        </div>
      </div>


      {isLoading && (
        <div className="flex justify-center items-center p-12">
          <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-2 text-muted-foreground">Loading saved questions...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && filteredAttempts.length === 0 && (
         <p className="text-muted-foreground text-center py-8">
           {allAttempts.length === 0
             ? "You haven't saved any practice questions yet."
             : "No saved questions match the current filters."}
         </p>
      )}

      {!isLoading && !error && filteredAttempts.length > 0 && (
        <div className="space-y-4">
          {filteredAttempts.map((attempt) => (
            <SavedAttemptCard key={attempt.id} attempt={attempt} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPracticeList;
