import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { mockInterviewService } from "@/services/mockInterviewService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User } from "lucide-react";
import { InterviewStatus, MockInterview } from "@/types";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import InterviewDialog from "./InterviewDialog";

type InterviewItemProps = {
  interview: MockInterview;
  currentUserId: string;
  onCancelInterview: (id: string) => void;
  onJoinInterview: (interview: MockInterview) => void;
};

type InterviewsListProps = {
  interviews?: MockInterview[];
};

const statusColors: Record<InterviewStatus, string> = {
  'Scheduled': 'bg-blue-500',
  'In Progress': 'bg-green-500',
  'Completed': 'bg-gray-500',
  'Cancelled': 'bg-red-500'
};

const InterviewItem: React.FC<InterviewItemProps> = ({ 
  interview, 
  currentUserId, 
  onCancelInterview,
  onJoinInterview
}) => {
  const isInterviewer = interview.interviewerId === currentUserId;
  const userRole = isInterviewer ? 'Interviewer' : 'Interviewee';
  const canJoin = interview.status === 'Scheduled' || interview.status === 'In Progress';
  const canCancel = interview.status === 'Scheduled';
  
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };
  
  const formatTime = (date: Date) => {
    return format(new Date(date), 'h:mm a');
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle>{interview.title}</CardTitle>
          <Badge className={statusColors[interview.status]}>{interview.status}</Badge>
        </div>
        <CardDescription>{interview.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{formatDate(interview.scheduledStartTime)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            <span>{formatTime(interview.scheduledStartTime)} - {formatTime(interview.scheduledEndTime)}</span>
          </div>
          <div className="flex items-center col-span-2">
            <User className="mr-2 h-4 w-4" />
            <span>Your role: <strong>{userRole}</strong></span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex space-x-2 w-full justify-end">
          {canCancel && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onCancelInterview(interview.id)}
            >
              Cancel
            </Button>
          )}
          {canJoin && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onJoinInterview(interview)}
            >
              Join Interview
            </Button>
          )}
          {interview.status === 'Completed' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onJoinInterview(interview)}
            >
              View Feedback
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

const InterviewsList = ({ interviews }: InterviewsListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedInterview, setSelectedInterview] = useState<MockInterview | null>(null);
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);
  const [displayedInterviews, setDisplayedInterviews] = useState<MockInterview[]>([]);

   useState(() => {
    if (interviews) {
      setDisplayedInterviews(interviews);
    }
  });

  const handleCancelInterview = async (id: string) => {
    try {
      await mockInterviewService.cancelMockInterview(id);
      setDisplayedInterviews(prevInterviews => 
        prevInterviews.map(interview => 
          interview.id === id 
            ? { ...interview, status: 'Cancelled' } 
            : interview
        )
      );
      toast({
        title: "Interview cancelled",
        description: "The interview has been cancelled successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel the interview. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinInterview = (interview: MockInterview) => {
    setSelectedInterview(interview);
    setIsInterviewDialogOpen(true);
  };

  const handleCloseInterviewDialog = async () => {
    setIsInterviewDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {!displayedInterviews || displayedInterviews.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No interviews to display.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedInterviews.map(interview => (
            <InterviewItem
              key={interview.id}
              interview={interview}
              currentUserId={user?.id || ''}
              onCancelInterview={handleCancelInterview}
              onJoinInterview={handleJoinInterview}
            />
          ))}
        </div>
      )}
      
      <InterviewDialog 
        isOpen={isInterviewDialogOpen}
        onClose={handleCloseInterviewDialog}
        interview={selectedInterview}
      />
    </div>
  );
};

export default InterviewsList;
