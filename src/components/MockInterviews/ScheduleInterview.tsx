import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addHours, startOfDay } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { mockInterviewService } from "@/services/mockInterviewService";
import { MockInterview } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AIInstantInterview from "./AIInstantInterview";
 
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  date: z.date({ required_error: "Interview date is required" }),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: "Start time must be in HH:MM format" 
  }),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: "End time must be in HH:MM format" 
  }),
  intervieweeEmail: z.string().email({ message: "Please enter a valid email" }),
});

type FormValues = z.infer<typeof formSchema>;

const ScheduleInterview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: format(new Date(), 'HH:mm'),
      endTime: format(addHours(new Date(), 1), 'HH:mm'),
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to schedule an interview",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert date and times to Date objects
      const startDateTime = new Date(values.date);
      const [startHours, startMinutes] = values.startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes);

      const endDateTime = new Date(values.date);
      const [endHours, endMinutes] = values.endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes);

      const now = new Date();
      
      if (startDateTime.getTime() - now.getTime() < 60000) {
        toast({
          title: "Invalid time",
          description: "Interview must be scheduled at least 1 minute from now",
          variant: "destructive",
        });
        return;
      }

      // Validate end time is after start time
      if (endDateTime <= startDateTime) {
        toast({
          title: "Invalid time range",
          description: "End time must be after start time",
          variant: "destructive",
        });
        return;
      }

      // Create mock interview object
      const interviewData: Omit<MockInterview, 'id' | 'createdAt' | 'updatedAt'> = {
        title: values.title,
        description: values.description,
        scheduledStartTime: startDateTime,
        scheduledEndTime: endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: 'Scheduled',
        interviewerId: user.id,
        intervieweeId: 'pending-user-registration',
        intervieweeEmail: values.intervieweeEmail,
        interviewerName: user.name,
        questions: [],
      };

      mockInterviewService.scheduleMockInterview(interviewData);
      
      toast({
        title: "Interview scheduled",
        description: "Your mock interview has been scheduled successfully and an invitation email has been sent.",
      });
      
      setIsOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule the interview. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isValidTime = (date: Date, timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const selectedTime = new Date(date);
    selectedTime.setHours(hours, minutes);
    
    const now = new Date();
    return selectedTime.getTime() - now.getTime() >= 60000;
  };

  const getMinTime = (selectedDate: Date) => {
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    if (!isToday) return '00:00';
    
    now.setMinutes(now.getMinutes() + 1);
    return format(now, 'HH:mm');
  };

  const handleAIInterviewClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to start an AI interview",
        variant: "destructive",
      });
      return;
    }
    
    navigate("/dashboard/interviews/ai-instant");
  };

  return (
    <div className="flex space-x-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>Schedule New Interview</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule a Mock Interview</DialogTitle>
            <DialogDescription>
              Set up a mock interview session with a peer. You'll be the interviewer in this session.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Frontend Developer Interview" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the interview focus"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Interview Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            // Reset times when date changes
                            const minTime = getMinTime(date || new Date());
                            form.setValue('startTime', minTime);
                            form.setValue('endTime', format(addHours(new Date(`2000-01-01T${minTime}`), 1), 'HH:mm'));
                          }}
                          disabled={(date) => {
                            const now = new Date();
                            return date < startOfDay(now);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field}
                          min={form.getValues('date') ? getMinTime(form.getValues('date')) : undefined}
                          onChange={(e) => {
                            field.onChange(e);
                            // Update end time to be 1 hour after start time
                            const newEndTime = format(addHours(new Date(`2000-01-01T${e.target.value}`), 1), 'HH:mm');
                            form.setValue('endTime', newEndTime);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field}
                          min={form.getValues('startTime')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="intervieweeEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interviewee Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="colleague@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the email of the person you want to interview
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Schedule Interview</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Button variant="outline" onClick={handleAIInterviewClick} className="flex items-center">
        <Bot className="mr-2 h-4 w-4" />
        AI Instant Interview
      </Button>
    </div>
  );
};

export default ScheduleInterview;
