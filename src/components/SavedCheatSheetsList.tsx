import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useQuery } from '@tanstack/react-query';
import { cheatSheetService, SavedCheatSheet } from '@/services/cheatSheetService';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from "@/components/ui/label"; // Keep Label if needed elsewhere, otherwise remove
// Dialog imports are removed
import { Loader2, AlertCircle, Trash2, Eye } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
// Detail view import is not needed here if opening in new task
// import { CheatSheetDetailView } from './CheatSheetDetailView'; 

// --- Simple Circular Progress SVG Component ---
interface CircularProgressProps {
  progress: number; // Percentage 0-100
  size?: number;
  strokeWidth?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 100,
  strokeWidth = 10
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90" // Start from the top
    >
      {/* Background Circle */}
      <circle
        stroke="hsl(var(--secondary))" // Use theme color
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      {/* Progress Circle */}
      <circle
        stroke="hsl(var(--primary))" // Use theme color
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round" // Make the ends rounded
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{ transition: 'stroke-dashoffset 0.3s ease-out' }} // Add transition
      />
    </svg>
  );
};


export function SavedCheatSheetsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate(); // Get navigate function
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null); 

  const { data: savedSheets, isLoading, error, refetch } = useQuery<SavedCheatSheet[], Error>({
    queryKey: ['savedCheatSheets', user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const { data, error: fetchError } = await cheatSheetService.getCheatSheetsForUser(user.id);
      if (fetchError) throw new Error(fetchError.message || "Failed to fetch saved cheat sheets");
      return data || [];
    },
    enabled: !!user,
  });

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      const { error: deleteError } = await cheatSheetService.deleteCheatSheet(id, user.id);
      if (deleteError) throw deleteError;
      toast({ title: "Cheat Sheet Deleted", description: "Successfully removed from your saved topics." });
      refetch();
    } catch (err: any) {
      console.error("Error deleting cheat sheet:", err);
      toast({ variant: "destructive", title: "Deletion Failed", description: err.message || "Could not delete cheat sheet." });
    }
  };

  const calculateProgress = (sheet: SavedCheatSheet): number => {
    const totalDays = sheet.generated_data?.dailyBreakdown?.length || 0;
    if (totalDays === 0) return 0;
    const completedCount = sheet.completed_subtopics?.length || 0;
    return Math.round((completedCount / totalDays) * 100);
  };

  // --- Function to prepare context for new task ---
  // --- Function to navigate to the detail view ---
  function handleViewDetails(sheetId: string) {
    navigate(`/saved-cheat-sheets/${sheetId}`); // Navigate to the detail route
  }


  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Saved Topics</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!savedSheets || savedSheets.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/50">
        <h3 className="text-lg font-medium">No Saved Cheat Sheets Found</h3>
        <p className="text-muted-foreground mt-2">
          Generate an AI Cheat Sheet from a study plan and save it to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">My Saved Cheat Sheets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedSheets.map((sheet) => {
          const progress = calculateProgress(sheet);
          return (
            <Card
              key={sheet.id}
              className="flex flex-col duration-200 ease-in-out overflow-hidden" // Removed transition-all
              onMouseEnter={() => setHoveredCardId(sheet.id)}
              onMouseLeave={() => setHoveredCardId(null)}
            >
              {/* Header is always visible */}
              <CardHeader>
                <CardTitle className="line-clamp-1">{sheet.topic_title}</CardTitle>
                <CardDescription>
                  {sheet.generated_data?.dailyBreakdown?.length || 0} days plan
                </CardDescription>
              </CardHeader>

              {/* Content area changes on hover */}
              <CardContent className="flex-grow flex items-center justify-center p-4 min-h-[100px]"> {/* Added min-height */}
                {hoveredCardId === sheet.id ? (
                  // --- Render Circular Progress on Hover ---
                  <div className="flex flex-col items-center justify-center text-center">
                    <CircularProgress progress={progress} size={80} strokeWidth={8} /> {/* Use the component */}
                    <p className="mt-2 text-xs text-muted-foreground">
                        {sheet.completed_subtopics?.length || 0} / {sheet.generated_data?.dailyBreakdown?.length || 0} days completed
                    </p>
                  </div>
                ) : (
                  // --- Render Normal Progress Text ---
                  <div className="text-center">
                     <p className="text-lg font-semibold">{progress}%</p>
                     <p className="text-xs text-muted-foreground">Complete</p>
                  </div>
                )}
              </CardContent>

              {/* Footer with buttons is always visible */}
              <CardFooter className="flex justify-end gap-2">
                  {/* Updated Button to navigate */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(sheet.id)} // Pass only sheetId
                  >
                    <Eye className="h-4 w-4 mr-1" /> View Details
                  </Button>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                       <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                             This will permanently delete the cheat sheet for "{sheet.topic_title}". This action cannot be undone.
                          </AlertDialogDescription>
                       </AlertDialogHeader>
                       <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(sheet.id)}>
                             Delete
                          </AlertDialogAction>
                       </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      {/* Modal section is completely removed */}
    </div>
  );
}
