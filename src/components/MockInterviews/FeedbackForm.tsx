import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { mockInterviewService } from "@/services/mockInterviewService";
import { useToast } from "@/hooks/use-toast";
import { StarIcon } from "lucide-react";

type FeedbackFormProps = {
  interview: any;
  onClose: () => void;
  interviewerId: string;
  intervieweeId: string;
};

const FeedbackForm = ({ interview, onClose, interviewerId, intervieweeId }: FeedbackFormProps) => {
  const { toast } = useToast();
  const [feedback, setFeedback] = useState({
    overall_rating: 3,
    communication_rating: 3,
    technical_rating: 3,
    problem_solving_rating: 3,
    strengths: '',
    areas_for_improvement: '',
    additional_comments: ''
  });



  const handleRatingChange = (field: string, value: number) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  const handleTextChange = (field: string, value: string) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const id = await mockInterviewService.getUserIdByEmail(interview.intervieweeEmail);
      await mockInterviewService.saveFeedback({
        interview_id: interview.id,
        interviewer_id: interviewerId,
        interviewee_id: id,
        interviewee_email: interview.intervieweeEmail ,
        ...feedback
      });
      
      toast({
        title: "Feedback submitted",
        description: "Your feedback has been submitted successfully",
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const RatingSelector = ({ 
    label, 
    field, 
    value 
  }: { 
    label: string; 
    field: string; 
    value: number 
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(rating => (
          <button
            key={rating}
            type="button"
            onClick={() => handleRatingChange(field, rating)}
            className={`p-1 rounded ${value >= rating ? 'text-yellow-500' : 'text-gray-300'}`}
          >
            <StarIcon className="h-6 w-6" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Interview Feedback</h2>
      
      <div className="space-y-4">
        <RatingSelector 
          label="Overall Rating" 
          field="overall_rating" 
          value={feedback.overall_rating} 
        />
        
        <RatingSelector 
          label="Communication Skills" 
          field="communication_rating" 
          value={feedback.communication_rating} 
        />
        
        <RatingSelector 
          label="Technical Knowledge" 
          field="technical_rating" 
          value={feedback.technical_rating} 
        />
        
        <RatingSelector 
          label="Problem Solving" 
          field="problem_solving_rating" 
          value={feedback.problem_solving_rating} 
        />
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Strengths</label>
          <Textarea
            placeholder="What did the interviewee do well?"
            value={feedback.strengths}
            onChange={(e) => handleTextChange('strengths', e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Areas for Improvement</label>
          <Textarea
            placeholder="What could the interviewee improve on?"
            value={feedback.areas_for_improvement}
            onChange={(e) => handleTextChange('areas_for_improvement', e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Additional Comments</label>
          <Textarea
            placeholder="Any other feedback or advice..."
            value={feedback.additional_comments}
            onChange={(e) => handleTextChange('additional_comments', e.target.value)}
            rows={3}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          Submit Feedback
        </Button>
      </div>
    </div>
  );
};

export default FeedbackForm;
