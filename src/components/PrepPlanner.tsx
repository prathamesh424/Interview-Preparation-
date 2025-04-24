
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PrepPlannerForm } from "@/components/PrepPlannerForm";
import { PrepPlannerList } from "@/components/PrepPlannerList";
import { StudyCategory, StudyPlanItem } from "@/types";
import { prepPlannerService } from "@/services/prepPlannerService";
import { Calendar, CheckCircle, Clock, PlusCircle } from "lucide-react";

export default function PrepPlanner() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<StudyPlanItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    if (user) {
      loadPlans();
    }
  }, [user]);

  const loadPlans = () => {
    if (!user) return;
    const userPlans = prepPlannerService.getStudyPlansByUserId(user.id);
    setPlans(userPlans);
  };

  const filteredPlans = () => {
    if (activeTab === "all") return plans;
    
    if (activeTab === "upcoming") {
      return plans.filter(plan => new Date(plan.startDate) > new Date() || plan.status === "Not Started");
    }
    
    if (activeTab === "active") {
      return plans.filter(plan => plan.status === "In Progress");
    }
    
    if (activeTab === "completed") {
      return plans.filter(plan => plan.status === "Completed");
    }
    
    // Filter by category
    return plans.filter(plan => plan.category === activeTab);
  };

  const getStatusCounts = () => {
    const notStarted = plans.filter(plan => plan.status === "Not Started").length;
    const inProgress = plans.filter(plan => plan.status === "In Progress").length;
    const completed = plans.filter(plan => plan.status === "Completed").length;
    
    return { notStarted, inProgress, completed };
  };

  const getCategoryCounts = () => {
    const categories = {} as Record<StudyCategory, number>;
    
    plans.forEach(plan => {
      categories[plan.category] = (categories[plan.category] || 0) + 1;
    });
    
    return categories;
  };

  const { notStarted, inProgress, completed } = getStatusCounts();
  const categoryCounts = getCategoryCounts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Prep Planner</h2>
          <p className="text-muted-foreground">
            Organize your interview preparation and track your progress
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Study Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create Study Plan</DialogTitle>
              <DialogDescription>
                Create a new study plan to organize your interview preparation
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
              <PrepPlannerForm 
                onSuccess={() => {
                  setIsDialogOpen(false);
                  loadPlans();
                }} 
              />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{notStarted}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold">{inProgress}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">{completed}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 md:flex md:flex-wrap">
          <TabsTrigger value="all">All Plans</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          {Object.entries(categoryCounts).map(([category, count]) => (
            count > 0 && (
              <TabsTrigger key={category} value={category}>
                {category} ({count})
              </TabsTrigger>
            )
          ))}
        </TabsList>
        <Separator className="my-4" />
        <TabsContent value={activeTab} className="mt-0">
          <PrepPlannerList 
            plans={filteredPlans()} 
            onPlanUpdate={loadPlans} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
