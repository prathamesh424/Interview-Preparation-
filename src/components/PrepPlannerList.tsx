import { useState } from "react";
import { format } from "date-fns";
import { StudyPlanItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PrepPlannerForm } from "@/components/PrepPlannerForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Calendar, BookOpen, ListChecks, Sparkles } from "lucide-react";
import { prepPlannerService } from "@/services/prepPlannerService";
import { useToast } from "@/components/ui/use-toast";
import { AiCheatSheetGenerator } from "@/components/AiCheatSheetGenerator";

interface PrepPlannerListProps {
  plans: StudyPlanItem[];
  onPlanUpdate: () => void;
}

export function PrepPlannerList({ plans, onPlanUpdate }: PrepPlannerListProps) {
  const { toast } = useToast();
  const [editingPlan, setEditingPlan] = useState<StudyPlanItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = (plan: StudyPlanItem) => {
    try {
      prepPlannerService.deleteStudyPlan(plan.id);
      toast({
        title: "Study plan deleted",
        description: "The study plan has been deleted successfully.",
      });
      onPlanUpdate();
    } catch (error) {
      console.error("Error deleting study plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error deleting the study plan. Please try again.",
      });
    }
  };

  // --- Badge Color Helpers (Keep as is) ---
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-700"; // Added border
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"; // Added border
      case "Low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700"; // Added border
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600"; // Added border
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700"; // Added border
      case "In Progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700"; // Added border
      case "Not Started": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600"; // Added border
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600"; // Added border
    }
  };
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Data Structures": case "Algorithms": return <BookOpen className="h-4 w-4 mr-1.5" />; // Increased margin
      case "System Design": return <ListChecks className="h-4 w-4 mr-1.5" />; // Increased margin
      default: return <Calendar className="h-4 w-4 mr-1.5" />; // Increased margin
    }
  };
  // --- End Badge Color Helpers ---

  if (plans.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/50">
        <h3 className="text-lg font-medium">No study plans found</h3>
        <p className="text-muted-foreground mt-2">
          Create your first study plan to start organizing your interview preparation.
        </p>
      </div>
    );
  }

  return (
    // Increased gap between cards
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> 
      {plans.map((plan) => (
        // Added hover effect and transition
        <Card 
          key={plan.id} 
          className="flex flex-col h-full transition-shadow duration-200 hover:shadow-md dark:hover:shadow-primary/20"
        >
          {/* Adjusted padding and spacing in header */}
          <CardHeader className="pb-3 pt-4 px-5"> 
            <div className="flex flex-wrap gap-2 mb-3"> {/* Increased bottom margin */}
              <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getPriorityColor(plan.priority)}`}> {/* Adjusted padding/size */}
                {plan.priority} Priority
              </Badge>
              <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getStatusColor(plan.status)}`}> {/* Adjusted padding/size */}
                {plan.status}
              </Badge>
            </div>
            <CardTitle className="line-clamp-1 text-lg">{plan.title}</CardTitle> {/* Slightly larger title */}
            <CardDescription className="flex items-center text-sm pt-1"> {/* Added padding-top */}
              {getCategoryIcon(plan.category)} {plan.category}
            </CardDescription>
          </CardHeader>
          {/* Adjusted padding and spacing in content */}
          <CardContent className="flex-grow px-5 pb-4"> 
            {plan.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{plan.description}</p>
            )}
            <div className="text-sm space-y-3"> {/* Increased space between items */}
              <div className="flex flex-col">
                <span className="font-medium text-xs uppercase text-muted-foreground tracking-wider">Timeframe</span> {/* Label style */}
                <span className="text-foreground/90"> {/* Adjusted text color */}
                  {format(new Date(plan.startDate), "MMM d, yyyy")} - {format(new Date(plan.endDate), "MMM d, yyyy")}
                </span>
              </div>
              
              {plan.resources && plan.resources.length > 0 && (
                <div className="flex flex-col">
                  <span className="font-medium text-xs uppercase text-muted-foreground tracking-wider">Resources</span> {/* Label style */}
                  <span className="text-foreground/90 line-clamp-1"> {/* Adjusted text color */}
                    {plan.resources.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
          {/* Adjusted padding and spacing in footer */}
          <CardFooter className="pt-3 pb-4 px-5 border-t flex flex-wrap gap-2 justify-end"> 
            <Dialog open={isEditDialogOpen && editingPlan?.id === plan.id} onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) setEditingPlan(null);
            }}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingPlan(plan);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </DialogTrigger>
              {/* DialogContent remains the same */}
              <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Edit Study Plan</DialogTitle>
                  <DialogDescription>
                    Make changes to your study plan
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                  {editingPlan && (
                    <PrepPlannerForm 
                      initialData={editingPlan} 
                      onSuccess={() => {
                        setIsEditDialogOpen(false);
                        setEditingPlan(null);
                        onPlanUpdate();
                      }} 
                    />
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {/* AI Button remains the same */}
            <AiCheatSheetGenerator plan={plan} />
            
            {/* Delete Button remains the same */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10"> 
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this study plan. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(plan)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
