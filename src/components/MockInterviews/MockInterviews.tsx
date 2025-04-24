import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { mockInterviewService } from "@/services/mockInterviewService";
import { MockInterview, InterviewFeedback } from "@/types";
import InterviewsList from "./InterviewsList";
import ScheduleInterview from "./ScheduleInterview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { StarIcon } from "lucide-react";

const MockInterviews = () => {
  const { user } = useAuth();
  const [upcomingInterviews, setUpcomingInterviews] = useState<MockInterview[]>([]);
  const [pastInterviews, setPastInterviews] = useState<MockInterview[]>([]);
  const [feedbackList, setFeedbackList] = useState<InterviewFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        const userInterviews = await mockInterviewService.getMockInterviewsByUserId(user.id);
        
        const emailInterviews = await mockInterviewService.getMockInterviewsByEmail(user.email);
        
        const interviews = [...(userInterviews || [])];
        
        if (emailInterviews) { 
          emailInterviews.forEach(interview => {
            if (!interviews.some(i => i.id === interview.id)) {
              if (interview.intervieweeEmail === user.email && interview.intervieweeId === 'pending-user-registration') {
                const updatedInterview = { ...interview, intervieweeId: user.id };
                mockInterviewService.updateMockInterview(updatedInterview);
                interviews.push(updatedInterview);
              } else {
                interviews.push(interview);
              }
            }
          });
        }
        
        const now = new Date();
        
        const upcoming = interviews
          .filter(interview => 
            // interview.status === 'Scheduled' ||
            // interview.status === 'In Progress'
            //  &&
            new Date(interview.scheduledEndTime) > now
          )
          .sort((a, b) => 
            new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
          );
        
        const past = interviews
          .filter(interview => 
            interview.status === 'Completed' || 
            interview.status === 'Cancelled' ||
            new Date(interview.scheduledEndTime) < now
          )
          .sort((a, b) => 
            new Date(b.scheduledEndTime).getTime() - new Date(a.scheduledEndTime).getTime()
          );
        
        setUpcomingInterviews(upcoming);
        setPastInterviews(past);
        
        // Load feedback for the user
        const feedback = await mockInterviewService.getAllFeedbackForUser(user.id , user.email);
        setFeedbackList(feedback);
      } catch (error) {
        console.error("Error loading interview data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  const FeedbackItem = ({ feedback }: { feedback: InterviewFeedback }) => {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            Interview Feedback {feedback.interviewId}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Overall Rating</p>
                <div className="flex mt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <StarIcon 
                      key={star} 
                      className={`h-5 w-5 ${star <= feedback.overallRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Communication</p>
                <div className="flex mt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <StarIcon 
                      key={star} 
                      className={`h-5 w-5 ${star <= feedback.communicationRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Technical Skills</p>
                <div className="flex mt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <StarIcon 
                      key={star} 
                      className={`h-5 w-5 ${star <= feedback.technicalRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Problem Solving</p>
                <div className="flex mt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <StarIcon 
                      key={star} 
                      className={`h-5 w-5 ${star <= feedback.problemSolvingRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {feedback.strengths && (
              <div>
                <p className="text-sm font-medium">Strengths</p>
                <p className="text-sm">{feedback.strengths}</p>
              </div>
            )}
            
            {feedback.areasForImprovement && (
              <div>
                <p className="text-sm font-medium">Areas for Improvement</p>
                <p className="text-sm">{feedback.areasForImprovement}</p>
              </div>
            )}
            
            {feedback.additionalComments && (
              <div>
                <p className="text-sm font-medium">Additional Comments</p>
                <p className="text-sm">{feedback.additionalComments}</p>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground mt-2">
              Feedback provided on {format(new Date(feedback.createdAt), "MMM d, yyyy")}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mock Interviews</h2>
        <ScheduleInterview />
      </div>
      
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid grid-cols-3 w-[400px]">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Interviews</TabsTrigger>
          <TabsTrigger value="feedback">My Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6">
          {isLoading ? (
            <p className="text-center py-10">Loading your upcoming interviews...</p>
          ) : upcomingInterviews.length > 0 ? (
            <InterviewsList interviews={upcomingInterviews} />
          ) : (
            <p className="text-muted-foreground text-center py-10">
              You don't have any upcoming interviews. Schedule one now!
            </p>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-6">
          {isLoading ? (
            <p className="text-center py-10">Loading your past interviews...</p>
          ) : pastInterviews.length > 0 ? (
            <InterviewsList interviews={pastInterviews} />
          ) : (
            <p className="text-muted-foreground text-center py-10">
              You don't have any past interviews.
            </p>
          )}
        </TabsContent>
        
        <TabsContent value="feedback" className="mt-6">
          {isLoading ? (
            <p className="text-center py-10">Loading your feedback...</p>
          ) : feedbackList.length > 0 ? (
            <div className="space-y-4">
              {feedbackList.map(feedback => (
                <FeedbackItem key={feedback.id} feedback={feedback} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">
              You don't have any feedback yet.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MockInterviews;
