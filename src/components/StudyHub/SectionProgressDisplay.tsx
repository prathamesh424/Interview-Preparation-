import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card"; // Optional: wrap in a card

interface SectionProgressDisplayProps {
  sectionName: string;
  totalQuestions: number;
  completedQuestions: number;
}

const SectionProgressDisplay: React.FC<SectionProgressDisplayProps> = ({
  sectionName,
  totalQuestions,
  completedQuestions,
}) => {
  const progressPercentage = totalQuestions > 0 
    ? Math.round((completedQuestions / totalQuestions) * 100) 
    : 0;

  return (
    <div className="mb-6"> {/* Removed Card for simpler integration */}
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-md font-medium text-muted-foreground">{sectionName} Progress</h3>
        <span className="text-sm font-semibold">
          {`${completedQuestions} / ${totalQuestions} (${progressPercentage}%)`}
        </span>
      </div>
      <Progress value={progressPercentage} aria-label={`${sectionName} progress: ${progressPercentage}%`} />
    </div>
  );
};

export default SectionProgressDisplay;
