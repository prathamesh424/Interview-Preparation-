import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { differenceInSeconds, format } from "date-fns";

type InterviewTimerProps = {
  startTime: Date;
  endTime: Date;
};

const InterviewTimer = ({ startTime, endTime }: InterviewTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
  useEffect(() => {
    // Calculate time remaining in seconds
    const calculateTimeRemaining = () => {
      const now = new Date();
      
      // If current time is before start time, show time until start
      if (now < startTime) {
        setIsRunning(false);
        return differenceInSeconds(startTime, now);
      }
      
      // If current time is after end time, show 0
      if (now > endTime) {
        setIsRunning(false);
        return 0;
      }
      
      // Otherwise, show time until end
      setIsRunning(true);
      return differenceInSeconds(endTime, now);
    };
    
    // Initialize timer
    setTimeRemaining(calculateTimeRemaining());
    
    // Update timer every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime, endTime]);
  
  // Format time remaining
  const formatTimeRemaining = () => {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = Math.floor(timeRemaining % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            {isRunning ? "Time Remaining" : "Interview Starts In"}
          </div>
          <div className="text-3xl font-bold tracking-widest">
            {formatTimeRemaining()}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(startTime, "MMM d, yyyy h:mm a")} - {format(endTime, "h:mm a")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InterviewTimer;
