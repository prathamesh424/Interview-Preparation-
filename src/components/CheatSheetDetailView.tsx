import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Import useParams
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cheatSheetService, SavedCheatSheet } from '@/services/cheatSheetService';
import { useAuth } from '@/context/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, ExternalLink, Youtube, FileText, BookMarked } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from './ui/button';

// Remove props interface as sheetId comes from URL params now
// interface CheatSheetDetailViewProps {
//   sheetId: string;
//   onClose?: () => void; 
// }

export function CheatSheetDetailView() { // Remove props from function signature
  const { sheetId } = useParams<{ sheetId: string }>(); // Get sheetId from URL
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());

  const { data: sheet, isLoading, error } = useQuery<SavedCheatSheet, Error>({
    queryKey: ['cheatSheetDetail', sheetId, user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (!sheetId) throw new Error("Sheet ID is required");
      const { data, error: fetchError } = await cheatSheetService.getCheatSheetById(sheetId, user.id);
      if (fetchError) throw new Error(fetchError.message || "Failed to fetch cheat sheet details");
      if (!data) throw new Error("Cheat sheet not found.");
      return data;
    },
    enabled: !!user && !!sheetId,
    // onSuccess removed - handle in useEffect
  });

  // --- NEW: useEffect to update local state when query data changes ---
  useEffect(() => {
    if (sheet?.completed_subtopics) {
      setCompletedDays(new Set(sheet.completed_subtopics));
    }
  }, [sheet]); // Depend on the fetched sheet data

  // Mutation for updating completed status
  const updateMutation = useMutation({
    mutationFn: (newCompletedDays: number[]) => {
      if (!user || !sheetId) throw new Error("Missing user or sheet ID");
      return cheatSheetService.updateCompletedSubtopics(sheetId, newCompletedDays, user.id);
    },
    onSuccess: (result) => {
      if (result.error) {
         throw new Error(result.error.message || "Update failed");
      }
      // Invalidate queries to refetch list and potentially this detail view
      queryClient.invalidateQueries({ queryKey: ['savedCheatSheets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['cheatSheetDetail', sheetId, user?.id] }); 
      toast({ title: "Progress Updated" });
    },
    onError: (err: Error) => {
      console.error("Error updating progress:", err);
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
      // Optionally revert local state on error, though optimistic updates are common too
      // For simplicity, we rely on refetching or the user retrying.
    },
  });

  const handleCheckboxChange = (dayNumber: number, isChecked: boolean) => {
    const newSet = new Set(completedDays);
    if (isChecked) {
      newSet.add(dayNumber);
    } else {
      newSet.delete(dayNumber);
    }
    setCompletedDays(newSet); // Update local state immediately (optimistic)
    
    // Debounce or call mutation directly
    // For simplicity, call directly here. Consider debouncing for rapid clicks.
    updateMutation.mutate(Array.from(newSet));
  };

  // Use isPending for mutation loading state
  if (isLoading || updateMutation.isPending) { 
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Details</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!sheet) {
     return <p>Cheat sheet data not available.</p>; // Should ideally be caught by error state
  }

  return (
    <ScrollArea className="max-h-[calc(90vh-150px)] pr-4"> {/* Adjust height as needed */}
      {/* Ensure sheet and generated_data exist before mapping */}
      {sheet?.generated_data?.dailyBreakdown && ( 
        <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
          {sheet.generated_data.dailyBreakdown.map((item, index) => {
            const isCompleted = completedDays.has(item.day);
            return (
              <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger className="flex justify-between items-center w-full">
                 <span className="flex-grow pr-2">Day {item.day}: {item.subtopic}</span>
                 <div className="flex items-center space-x-2 flex-shrink-0 mr-2">
                    <Checkbox
                      id={`day-${item.day}`}
                      checked={isCompleted}
                      onCheckedChange={(checked) => handleCheckboxChange(item.day, !!checked)}
                      onClick={(e) => e.stopPropagation()} // Prevent accordion toggle on checkbox click
                      aria-label={`Mark Day ${item.day} as complete`}
                    />
                    <Label htmlFor={`day-${item.day}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Done
                    </Label>
                 </div>
              </AccordionTrigger>
              {/* Refactored Accordion Content for more structure */}
              <AccordionContent className="pt-3 pb-4 px-6"> 
                <div className="flex flex-col md:flex-row md:items-start md:gap-6">
                  {/* Column 1: Subtopic & Schedule (Takes more space) */}
                  <div className="flex-grow mb-4 md:mb-0">
                     <h4 className="font-semibold mb-2 text-base">Daily Focus:</h4>
                     <p className="text-sm text-muted-foreground mb-3">{item.subtopic}</p>
                     <h4 className="font-semibold mb-2 text-base">Schedule Suggestion:</h4>
                     <p className="text-sm text-muted-foreground">{item.schedule}</p>
                  </div>

                  {/* Column 2: Resources (Takes less space) */}
                  <div className="flex-shrink-0 md:w-1/3">
                     <h4 className="font-semibold mb-2 text-base">Resources:</h4>
                     <ul className="space-y-1.5 text-sm">
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
                </div>
              </AccordionContent>
            </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </ScrollArea>
  );
}
