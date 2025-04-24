
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MockInterview } from "@/types";
import InterviewSession from "./InterviewSession";

type InterviewDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  interview: MockInterview | null;
};

const InterviewDialog: React.FC<InterviewDialogProps> = ({ 
  isOpen, 
  onClose, 
  interview 
}) => {
  if (!interview) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[100%] h-[98vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{interview.title}</DialogTitle>
          <DialogDescription>
            {interview.description || "Mock interview session"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-auto">
          <InterviewSession 
            interview={interview} 
            onClose={onClose} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewDialog;
