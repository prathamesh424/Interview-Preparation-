import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; // Import Progress
import { Button } from '@/components/ui/button'; // Import Button for links
import { practiceService, SavedPracticeData } from '@/services/practiceService';
import { sheetService, QuestionSheet, SheetQuestion } from '@/services/sheetService'; // Added SheetQuestion
import { mockInterviewService, MockInterview } from '@/services/mockInterviewService';
import { prepPlannerService } from '@/services/prepPlannerService'; // Import planner service
import { StudyPlanItem, InterviewFeedback } from '@/types'; // Import necessary types
import { useAuth } from '@/context/AuthContext';
import { Loader2, ListChecks, ClipboardList, MessageSquareQuote, Target, CalendarCheck2, Star, TrendingUp, ExternalLink, Flame, Activity } from 'lucide-react'; // Added Flame, Activity Icons
import { cn } from '@/lib/utils'; // Import cn for conditional classes

// Helper function to calculate streak
const calculateStreak = (dates: Date[]): number => {
  if (!dates || dates.length === 0) return 0;

  // Normalize dates to the start of the day in local timezone and get unique days
  const uniqueDays = new Set<string>();
  dates.forEach(date => {
    // Ensure 'date' is a valid Date object before processing
    if (date instanceof Date && !isNaN(date.getTime())) {
       uniqueDays.add(new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0]);
    }
  });

  if (uniqueDays.size === 0) return 0;

  const sortedUniqueDays = Array.from(uniqueDays).sort((a, b) => b.localeCompare(a)); // Sort YYYY-MM-DD strings descending

  let currentStreak = 0;
  const today = new Date();
  const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString().split('T')[0];

  // Check if the most recent activity was today or yesterday
  if (sortedUniqueDays[0] === todayStr || sortedUniqueDays[0] === yesterdayStr) {
    currentStreak = 1;
    // Check consecutive days backwards
    for (let i = 0; i < sortedUniqueDays.length - 1; i++) {
      const currentDay = new Date(sortedUniqueDays[i]);
      const previousDay = new Date(sortedUniqueDays[i+1]);
      const expectedPreviousDay = new Date(currentDay);
      expectedPreviousDay.setDate(currentDay.getDate() - 1);

      if (previousDay.toISOString().split('T')[0] === expectedPreviousDay.toISOString().split('T')[0]) {
        currentStreak++;
      } else {
        break; // Streak broken
      }
    }
  }

  return currentStreak;
};

// Helper function to count activity in the last N days
const countRecentActivity = (dates: Date[], days: number): number => {
  if (!dates) return 0;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  cutoffDate.setHours(0, 0, 0, 0); // Start of the Nth day ago

  // Ensure 'date' is a valid Date object before comparison
  return dates.filter(date => date instanceof Date && !isNaN(date.getTime()) && date >= cutoffDate).length;
};


const DashboardHome = () => {
  const { user, isLoading: authLoading } = useAuth();

  // State for various stats
  const [practiceStats, setPracticeStats] = useState<{ count: number; avgScore: number | null }>({ count: 0, avgScore: null });
  const [sheetProgress, setSheetProgress] = useState<{ sheetCount: number; overallProgress: number | null }>({ sheetCount: 0, overallProgress: null });
  const [interviewStats, setInterviewStats] = useState<{ total: number; completed: number; scheduled: number; cancelled: number; avgRating: number | null }>({ total: 0, completed: 0, scheduled: 0, cancelled: 0, avgRating: null });
  const [plannerStats, setPlannerStats] = useState<{ total: number; pending: number }>({ total: 0, pending: 0 });
  const [activityStreak, setActivityStreak] = useState<number>(0);
  const [recentActivityCount, setRecentActivityCount] = useState<number>(0);

  // Loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProgressLoading, setIsProgressLoading] = useState<boolean>(false); // Specific loading for progress calc
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) {
      // Wait for user authentication
      if (!authLoading) setIsLoading(false); // If not loading auth and no user, stop loading
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setIsProgressLoading(true); // Start progress loading
      setError(null);

      try {
        // Fetch all data concurrently
        const [
          practiceAttempts,
          sheets,
          interviews,
          allFeedback,
          plannerItems,
          sheetProgressTimestamps // Added fetch for timestamps
        ] = await Promise.all([
          practiceService.getSavedPracticeAttempts(),
          sheetService.getQuestionSheets(),
          mockInterviewService.getMockInterviewsByUserId(user.id),
          mockInterviewService.getAllFeedbackForUser(user.id, user.email ?? ''), // Fetch feedback
          prepPlannerService.getStudyPlansByUserId(user.id), // Fetch planner items
          sheetService.getUserSheetProgressTimestamps() // Fetch sheet completion timestamps
        ]);

        // --- Calculate Practice Stats ---
        let totalScore = 0;
        let scoredCount = 0;
        const practiceTimestamps: Date[] = []; // Store practice timestamps
        practiceAttempts.forEach(attempt => {
          if (attempt.feedback?.score !== undefined && attempt.feedback.score !== null) {
            totalScore += attempt.feedback.score;
            scoredCount++;
          }
          // Assuming practice attempts have 'created_at' - adjust if needed
          if (attempt.created_at) {
             // Ensure created_at is treated as a string before creating Date
             const createdAtStr = attempt.created_at;
             if (typeof createdAtStr === 'string') {
                const date = new Date(createdAtStr);
                if (!isNaN(date.getTime())) {
                    practiceTimestamps.push(date);
                }
             }
          }
        });
        setPracticeStats({
          count: practiceAttempts.length,
          avgScore: scoredCount > 0 ? parseFloat((totalScore / scoredCount).toFixed(1)) : null
        });

        // --- Calculate Interview Stats ---
        const interviewStatsResult = interviews.reduce((acc, interview) => {
          acc.total++;
          if (interview.status === 'Completed') acc.completed++;
          else if (interview.status === 'Scheduled') acc.scheduled++;
          else if (interview.status === 'Cancelled') acc.cancelled++;
          return acc;
        }, { total: 0, completed: 0, scheduled: 0, cancelled: 0, avgRating: null as number | null });

        let totalRatingScore = 0;
        let totalFeedbackItems = 0;
        allFeedback.forEach(fb => {
          if (fb.feedbackItems && Array.isArray(fb.feedbackItems)) {
            fb.feedbackItems.forEach(item => {
              if (typeof item.score === 'number') {
                totalRatingScore += item.score;
                totalFeedbackItems++;
              }
            });
          }
          
        });
        interviewStatsResult.avgRating = totalFeedbackItems > 0 ? parseFloat((totalRatingScore / totalFeedbackItems).toFixed(1)) : null;
        setInterviewStats(interviewStatsResult);


        // --- Calculate Planner Stats ---
        // Count tasks that are not 'Completed' as pending/active
        const pendingTasks = plannerItems.filter(item => item.status === 'Not Started' || item.status === 'In Progress').length;
        setPlannerStats({
          total: plannerItems.length,
          pending: pendingTasks
        });

        // --- Calculate Sheet Progress (can be slow) ---
        setSheetProgress(prev => ({ ...prev, sheetCount: sheets.length })); // Set sheet count immediately

        // Fetch progress and questions for all sheets
        let totalCompleted = 0;
        let totalQuestions = 0;
        const progressPromises = sheets.map(async (sheet) => {
          const [questions, completedSet] = await Promise.all([
            sheetService.getSheetQuestions(sheet.id),
            sheetService.getUserSheetProgress(sheet.id)
          ]);
          return { questions, completedSet };
        });

        const sheetData = await Promise.all(progressPromises);
        sheetData.forEach(data => {
          totalQuestions += data.questions.length;
          totalCompleted += data.completedSet.size;
        });

        const overallProgress = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;
        setSheetProgress({ sheetCount: sheets.length, overallProgress });

        // --- Calculate Streak & Recent Activity ---
        const allTimestamps = [...practiceTimestamps, ...sheetProgressTimestamps];
        setActivityStreak(calculateStreak(allTimestamps));
        setRecentActivityCount(countRecentActivity(allTimestamps, 7)); // Count activity in last 7 days


      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
        setIsProgressLoading(false); // Finish progress loading
      }
    };

    fetchData();
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading Dashboard...</span>
      </div>
    );
  }

  if (error) {
     return <div className="text-destructive p-4">Error: {error}</div>;
  }

  if (!user) {
     return <div className="p-4">Please log in to view your dashboard.</div>;
  }

  // Safely access user name - using 'any' to bypass potential type issue in useAuth
  const userName = (user as any)?.user_metadata?.full_name || user?.email;

  return (
    <div className="space-y-8 p-4 md:p-6"> {/* Added padding */}
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back, {userName}!</h1>
      <p className="text-muted-foreground">Here's an overview of your preparation progress.</p>

      {/* Updated Grid Layout for 6 cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Practice Questions Card */}
        <Card className="border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>Practice Attempts</span>
              <ListChecks className="h-5 w-5 text-blue-500" />
            </CardDescription>
            <CardTitle className="text-4xl font-bold">{practiceStats.count}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            {practiceStats.avgScore !== null ? (
              <p className="text-xs text-muted-foreground flex items-center">
                <Star className="h-3 w-3 mr-1 text-yellow-400 fill-yellow-400" /> Average Score: {practiceStats.avgScore} / 10
              </p>
            ) : (
               <p className="text-xs text-muted-foreground">No scored attempts yet.</p>
            )}
          </CardContent>
           <CardFooter>
             <Button variant="outline" size="sm" asChild className="text-xs">
               <Link to="/saved">
                 <ExternalLink className="mr-1 h-3 w-3" /> View Practice
               </Link>
             </Button>
           </CardFooter>
        </Card>

        {/* Question Sheets Card */}


        <Card className="border-l-4 border-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
             <CardDescription className="flex items-center justify-between text-sm font-medium text-muted-foreground">
               <span>Sheet Progress</span>
               <ClipboardList className="h-5 w-5 text-green-500" />
             </CardDescription>
             <CardTitle className="text-4xl font-bold">
               {sheetProgress.overallProgress !== null ? `${sheetProgress.overallProgress}%` : (isProgressLoading ? <Loader2 className="h-7 w-7 animate-spin text-green-500" /> : 'N/A')}
             </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
             {sheetProgress.overallProgress !== null && !isProgressLoading && (
               <Progress value={sheetProgress.overallProgress} aria-label={`${sheetProgress.overallProgress}% Complete`} className="h-2 [&>*]:bg-green-500" />
             )}
             <p className="text-xs text-muted-foreground mt-2">
               Across {sheetProgress.sheetCount} available sheets.
             </p>
          </CardContent>
           <CardFooter>
             <Button variant="outline" size="sm" asChild className="text-xs">
               <Link to="/study-hub/question-sheets">
                 <ExternalLink className="mr-1 h-3 w-3" /> View Sheets
               </Link>
             </Button>
           </CardFooter>
        </Card>

        {/* Mock Interviews Card */}
        <Card className="border-l-4 border-purple-500 hover:shadow-md transition-shadow">
           <CardHeader className="pb-3">
             <CardDescription className="flex items-center justify-between text-sm font-medium text-muted-foreground">
               <span>Mock Interviews</span>
               <MessageSquareQuote className="h-5 w-5 text-purple-500" />
             </CardDescription>
             <CardTitle className="text-4xl font-bold">{interviewStats.total}</CardTitle>
           </CardHeader>
           <CardContent className="pt-0 pb-4">
             <p className="text-xs text-muted-foreground">
               {interviewStats.completed} Completed, {interviewStats.scheduled} Scheduled.
             </p>
             {interviewStats.avgRating !== null && (
               <p className="text-xs text-muted-foreground flex items-center mt-1">
                 <Star className="h-3 w-3 mr-1 text-yellow-400 fill-yellow-400" /> Avg. Feedback Score: {interviewStats.avgRating} / 5
               </p>
             )}
           </CardContent>
           <CardFooter>
             <Button variant="outline" size="sm" asChild className="text-xs">
               <Link to="/dashboard/interviews">
                 <ExternalLink className="mr-1 h-3 w-3" /> View Interviews
               </Link>
             </Button>
           </CardFooter>
        </Card>

        {/* Prep Planner Card */}
        <Card className="border-l-4 border-indigo-500 hover:shadow-md transition-shadow">
           <CardHeader className="pb-3">
             <CardDescription className="flex items-center justify-between text-sm font-medium text-muted-foreground">
               <span>Prep Planner</span>
               <CalendarCheck2 className="h-5 w-5 text-indigo-500" />
             </CardDescription>
             <CardTitle className="text-4xl font-bold">{plannerStats.pending}</CardTitle>
           </CardHeader>
           <CardContent className="pt-0 pb-4">
             <p className="text-xs text-muted-foreground">
               Pending tasks out of {plannerStats.total} total.
             </p>
           </CardContent>
           <CardFooter>
             <Button variant="outline" size="sm" asChild className="text-xs">
               <Link to="/dashboard/planner">
                 <ExternalLink className="mr-1 h-3 w-3" /> View Planner
               </Link>
             </Button>
           </CardFooter>
        </Card>

         {/* Activity Streak Card */}
        <Card className="border-l-4 border-orange-500 hover:shadow-md transition-shadow">
           <CardHeader className="pb-3">
             <CardDescription className="flex items-center justify-between text-sm font-medium text-muted-foreground">
               <span>Current Streak</span>
               <Flame className="h-5 w-5 text-orange-500" />
             </CardDescription>
             <CardTitle className="text-4xl font-bold">{activityStreak} <span className="text-2xl font-medium text-muted-foreground">{activityStreak === 1 ? 'Day' : 'Days'}</span></CardTitle>
           </CardHeader>
           <CardContent className="pt-0 pb-4">
             <p className="text-xs text-muted-foreground">
               Consecutive days with completed practice or sheet questions. Keep it going! 🔥
             </p>
           </CardContent>
           {/* Footer can be omitted or used for encouragement */}
        </Card>

        {/* Recent Activity Card */}
        <Card className="border-l-4 border-teal-500 hover:shadow-md transition-shadow">
           <CardHeader className="pb-3">
             <CardDescription className="flex items-center justify-between text-sm font-medium text-muted-foreground">
               <span>Recent Activity</span>
               <Activity className="h-5 w-5 text-teal-500" />
             </CardDescription>
             <CardTitle className="text-4xl font-bold">{recentActivityCount}</CardTitle>
           </CardHeader>
           <CardContent className="pt-0 pb-4">
             <p className="text-xs text-muted-foreground">
               Practice/Sheet questions completed in the last 7 days.
             </p>
           </CardContent>
            {/* Footer can be omitted */}
        </Card>

      </div>

      {/* Consider adding charts or recent activity list later */}
      {/* <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Progress Over Time</h2>
        {/* Placeholder for a chart component */}
        {/* <div className="p-4 border rounded-lg bg-card h-64 flex items-center justify-center text-muted-foreground">Chart Placeholder</div> */}
      {/*</div> */}
    </div>
  );
};

export default DashboardHome;
