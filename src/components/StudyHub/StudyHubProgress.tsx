import React from 'react';
import CircularProgress from '@/components/ui/CircularProgress';
import { Card, CardContent } from "@/components/ui/card";
import { StudyQuestion } from '@/types';

interface StudyHubProgressProps {
  allQuestions: StudyQuestion[];
}

const StudyHubProgress: React.FC<StudyHubProgressProps> = ({ allQuestions }) => {
  // Calculate progress based on the passed-in questions prop
  const totalQuestions = allQuestions.length;
  const completedQuestions = allQuestions.filter(q => q.isCompleted).length;
  
  const progressPercentage = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

  // Calculate difficulty breakdown based on passed-in questions
  const difficultyCounts = allQuestions.reduce((acc, q) => {
    acc.total[q.difficulty] = (acc.total[q.difficulty] || 0) + 1;
    if (q.isCompleted) {
      acc.completed[q.difficulty] = (acc.completed[q.difficulty] || 0) + 1;
    }
    return acc;
  }, { total: {} as Record<string, number>, completed: {} as Record<string, number> });

  return (
    <Card className="overflow-hidden border border-slate-200">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800">Overall Study Progress</h2>
      </div>
      
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Side: Stats & Breakdown */}
          <div className="flex-1 space-y-6">
            {/* Overall Count in a highlighted box */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Total Questions Completed</p>
              <p className="text-3xl font-bold text-foreground">{`${completedQuestions} / ${totalQuestions}`}</p>
            </div>

            {/* Difficulty Breakdown in a clean, organized table */}
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Breakdown by Difficulty</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-sm font-medium text-slate-700 text-left py-2 px-4">Difficulty</th>
                      <th className="text-sm font-medium text-slate-700 text-right py-2 px-4">Completed</th>
                      <th className="text-sm font-medium text-slate-700 text-right py-2 px-4">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Beginner', 'Intermediate', 'Hard'].map((difficulty) => {
                      const total = difficultyCounts.total[difficulty] || 0;
                      const completed = difficultyCounts.completed[difficulty] || 0;
                      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                      
                      // Only render if there are questions of this difficulty
                      if (total === 0) return null;
                      
                      return (
                        <tr key={difficulty} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 px-4 text-slate-700">{difficulty}</td>
                          <td className="py-3 px-4 text-right font-medium">{`${completed}/${total}`}</td>
                          <td className="py-3 px-4 text-right font-medium">
                            <span className={`px-2 py-1 rounded ${percentage >= 70 ? 'bg-green-50 text-green-700' : percentage >= 30 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                              {`${percentage}%`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Right Side: Circular Progress with better visual */}
          <div className="flex-shrink-0 flex items-center justify-center bg-slate-50 p-6 rounded-lg border border-slate-100">
            <div className="text-center">
              <CircularProgress 
                value={progressPercentage} 
                size={140}
                strokeWidth={10}
                aria-label={`${progressPercentage}% total study progress`}
              />
              <p className="mt-4 text-sm font-medium text-slate-600">Overall Progress</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyHubProgress;