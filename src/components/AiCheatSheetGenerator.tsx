import React, { useState, useEffect } from "react"; // Import useEffect
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
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
import { ScrollArea } from "@/components/ui/scroll-area";
 
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom"; // Use react-router-dom for Vite projects
import { Sparkles, Loader2, ExternalLink, Youtube, FileText, BookMarked, Save, Trash, RefreshCw, AlertCircle } from "lucide-react"; // Added icons
// Import types from the central types file
import { StudyPlanItem, LearningPace, CheatSheetData } from "@/types";
// Remove storageService import for saving/loading cheat sheets
// import { storageService } from "@/services/storageService"; 
import { apiKeyService } from "@/services/apiKeyService"; // Import apiKeyService
import { cheatSheetService } from "@/services/cheatSheetService"; // Import the new service
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"; // Import SDK
import { useAuth } from "@/context/AuthContext"; // Import useAuth

interface AiCheatSheetGeneratorProps {
  plan: StudyPlanItem; // Pass the whole plan for context
}

// Remove local type definitions as they are now imported
// type LearningPace = "Slow" | "Medium" | "Fast"; 
// interface CheatSheetData { ... }

export function AiCheatSheetGenerator({ plan }: AiCheatSheetGeneratorProps) {
  const { toast } = useToast();
  const navigate = useNavigate(); // Use useNavigate hook
  const { user, isLoading: isAuthLoading } = useAuth(); // Get auth state
  const [isOpen, setIsOpen] = useState(false);
  const [days, setDays] = useState<number>(5); // Default days
  const [pace, setPace] = useState<LearningPace>("Medium"); // Default pace
  const [cheatSheet, setCheatSheet] = useState<CheatSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Remove isSaved state and useEffect related to local storage loading
  // const [isSaved, setIsSaved] = useState(false); 
  // const storageKey = `cheatSheet_${plan.id}`; 
  // useEffect(() => { ... }, [isOpen, storageKey]);

  const [isSaving, setIsSaving] = useState(false); // Add state for saving operation


  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setCheatSheet(null);
    // setIsSaved(false); // No longer needed

    // Add check for authentication before proceeding
    if (isAuthLoading) {
      setError("Authentication status is loading. Please wait.");
      setIsLoading(false);
      return;
    }
    if (!user) {
      setError("You must be logged in to generate a cheat sheet.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch API Key (User is confirmed to exist here by the check above)
      const apiKeyResult = await apiKeyService.getApiKey(); 
      if (apiKeyResult.error || !apiKeyResult.key) {
        setError(`Failed to get API key: ${apiKeyResult.error || 'Key not found. Please configure it in settings.'}`);
        toast({
          variant: "destructive",
          title: "API Key Error",
          description: error,
        });
        setIsLoading(false);
        return;
      }
      const apiKey = apiKeyResult.key;

      // 2. Initialize Gemini Client
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "llama-3.3-70b-versatile", // Or allow selection later
        // Adjust safety settings if needed, e.g., for code generation
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
         generationConfig: {
            // Ensure JSON output
            responseMimeType: "application/json", 
        }
      });

      // 3. Construct Prompt
      const prompt = `
        Generate a study cheat sheet for the topic "${plan.title}".
        The user wants to complete this topic in ${days} days with a learning pace of "${pace}".

        Please provide the output strictly in the following JSON format:
        {
          "dailyBreakdown": [
            {
              "day": <number>,
              "subtopic": "<string: specific subtopic for the day>",
              "resources": [
                { "title": "<string: descriptive title>", "url": "<string: valid URL>", "type": "<'YouTube' | 'Article' | 'Docs'>" } 
                // Include 2-4 relevant resources per day. Prioritize official docs and high-quality tutorials.
              ],
              "schedule": "<string: suggested study schedule for the day, e.g., 'Read X (1hr), Watch Y (30min), Practice Z (1hr)'>"
            }
            // Repeat this structure for each of the ${days} days.
          ]
        }

        Ensure the subtopics logically progress through the main topic "${plan.title}". 
        Adjust the depth and breadth of subtopics based on the ${days}-day timeframe and "${pace}" pace.
        Provide real, publicly accessible URLs for resources. If unsure about a specific URL, provide a descriptive title and a placeholder URL like "#".
        The JSON output should be valid and parseable. Do not include any text outside the JSON structure itself.
      `;

      // 4. Call Gemini API
      console.log(`Calling Gemini API directly for: ${plan.title}`);
      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();

      // 5. Parse Response
      try {
        const generatedData: CheatSheetData = JSON.parse(responseText);
        
        // Basic validation
        if (!generatedData || !generatedData.dailyBreakdown || !Array.isArray(generatedData.dailyBreakdown) || generatedData.dailyBreakdown.length === 0) {
           throw new Error("API returned invalid or empty data structure.");
        }
        // Optional: Add more validation for sub-properties if needed

        setCheatSheet(generatedData); // Use actual data
      } catch (parseError: any) {
         console.error("Error parsing Gemini response:", parseError);
         console.error("Raw Gemini Response Text:", responseText); // Log raw response for debugging
         throw new Error(`Failed to parse the generated cheat sheet. Raw response: ${responseText.substring(0, 100)}...`);
      }

    } catch (err: any) {
      console.error("Error generating cheat sheet via direct API call:", err);
      const errorMessage = err.message || "An unexpected error occurred during cheat sheet generation.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: Handle saving to Supabase ---
  const handleSaveToDatabase = async () => {
    if (!cheatSheet || !user) {
      toast({ variant: "destructive", title: "Error", description: "No cheat sheet data or user found." });
      return;
    }
    setIsSaving(true);
    setError(null); // Clear previous errors

    const payload = {
      userId: user.id,
      topicTitle: plan.title, // Use the plan title
      generatedData: cheatSheet,
      studyPlanItemId: plan.id, // Link to the original study plan item
    };

    const { data: savedData, error: saveError } = await cheatSheetService.saveCheatSheet(payload);

    if (saveError) {
      console.error("Error saving cheat sheet to DB:", saveError);
      setError(`Failed to save cheat sheet: ${saveError.message || 'Unknown error'}`);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: `Could not save cheat sheet to your account. ${saveError.message || ''}`,
      });
    } else {
      toast({
        title: "Cheat Sheet Saved",
        description: `"${plan.title}" cheat sheet saved to your account.`,
      });
      // Optionally close the modal or navigate after saving? For now, just show toast.
      // setIsOpen(false); 
    }
    setIsSaving(false);
  };

  // Remove handleDeleteCheatSheet - will be handled in Saved Topics view
  // const handleDeleteCheatSheet = () => { ... };

  // Function to go back to options/generation screen (Reset state)
  const handleBackToOptions = () => {
    setCheatSheet(null);
    setError(null);
    // setIsSaved(false); // No longer needed
  };

  const handleStartPractice = () => {
    navigate(`/practice-questions?topic=${encodeURIComponent(plan.title)}`); // Use navigate
    setIsOpen(false); // Close modal on navigation
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when closing
      setCheatSheet(null);
      setError(null);
      setIsLoading(false);
      setIsSaving(false); // Reset saving state
      // Optionally reset days/pace or keep last values?
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {/* Disable button if auth is loading or user is not logged in */}
        <Button variant="outline" size="sm" disabled={isAuthLoading || !user} title={isAuthLoading ? "Checking authentication..." : !user ? "Please log in to use this feature" : "Generate AI Cheat Sheet"}>
          <Sparkles className="h-4 w-4 mr-1" />
          AI Cheat Sheet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Generate AI Cheat Sheet for "{plan.title}"</DialogTitle>
          <DialogDescription>
            Configure your preferences to generate a personalized study guide.
          </DialogDescription>
        </DialogHeader>
        
        {!cheatSheet && !isLoading && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="days">Days to Complete</Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  max="30" // Set a reasonable max
                  value={days}
                  onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pace">Learning Pace</Label>
                <Select value={pace} onValueChange={(value: LearningPace) => setPace(value)}>
                  <SelectTrigger id="pace" className="mt-1">
                    <SelectValue placeholder="Select pace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Slow">Slow</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Fast">Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive flex items-start">
                 <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                 <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Generating your cheat sheet...</p>
          </div>
        )}

        {cheatSheet && !isLoading && (
          <ScrollArea className="max-h-[calc(90vh-250px)] pr-4 mt-4">
            <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
              {cheatSheet.dailyBreakdown.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>Day {item.day}: {item.subtopic}</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold mb-1">Suggested Resources:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {item.resources.map((res, resIndex) => {
                          let Icon = FileText; // Default icon
                          if (res.type === "YouTube") Icon = Youtube;
                          if (res.type === "Docs") Icon = BookMarked;
                          
                          return (
                            <li key={resIndex} className="flex items-center">
                              <Icon className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
                              <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400 truncate">
                                {res.title}
                              </a>
                               <ExternalLink className="inline h-3 w-3 ml-1 flex-shrink-0 text-muted-foreground" />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Daily Schedule:</h4>
                      <p className="text-sm text-muted-foreground">{item.schedule}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        )}

        {/* Updated Footer Logic */}
        <DialogFooter className="mt-4 flex flex-wrap justify-end gap-2">
          {isLoading && (
             <Button disabled variant="outline">Cancel</Button> // Disable cancel while loading
           )}

          {!isLoading && !cheatSheet && (
            <>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleGenerate}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </>
          )}

          {!isLoading && cheatSheet && (
             <>
               {/* Save to Database Button */}
               <Button variant="outline" size="sm" onClick={handleSaveToDatabase} disabled={isSaving}>
                 {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} 
                 {isSaving ? "Saving..." : "Save to My Topics"}
               </Button>
               
               {/* Button to go back to generation options */}
               <Button variant="outline" size="sm" onClick={handleBackToOptions} disabled={isSaving}>
                 <RefreshCw className="mr-1 h-4 w-4" /> Regenerate/Options
               </Button>

               {/* Practice Button */}
               <Button size="sm" onClick={handleStartPractice}>
                 Start Practice on {plan.title}
               </Button>
             </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
