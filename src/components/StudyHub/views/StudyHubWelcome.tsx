// import React from 'react';
// import { useOutletContext } from 'react-router-dom'; // Import useOutletContext
// import StudyHubProgress from '../StudyHubProgress'; // Import the progress component
// import { StudyQuestion } from '@/types'; 
// import { BookOpenCheck } from 'lucide-react'; // Add an icon

// // Define the type for the context received from StudyHub
// type StudyHubContextType = {
//   allQuestions: StudyQuestion[];
//   // We don't need the handler in the welcome view, but it's part of the context
//   handleQuestionCompletionChange: (questionId: string, isCompleted: boolean) => void; 
// };


// const StudyHubWelcome: React.FC = () => {
//   // Get the shared state from the parent context
//   const { allQuestions } = useOutletContext<StudyHubContextType>();

//   return (
//     <div className="space-y-8"> {/* Add overall spacing */}
//       {/* Welcome Header */}
//       <div className="flex items-center gap-3">
//         <BookOpenCheck className="h-8 w-8 text-primary" /> {/* Icon */}
//         <h1 className="text-3xl font-bold tracking-tight">Welcome to the Study Hub!</h1>
//       </div>

//       {/* Introduction Text */}
//       <p className="text-lg text-muted-foreground max-w-3xl"> {/* Larger text, max width */}
//         Your central place to prepare for technical interviews. Track your progress across DSA, System Design, Core Subjects, and HR topics. Select a section from the sidebar to get started.
//       </p>
      
//       {/* Pass the shared questions state to the progress component */}
//       {/* The StudyHubProgress component already uses a Card for styling */}
//       <StudyHubProgress allQuestions={allQuestions} /> 

//       {/* Removed the simple paragraph, intro text is more descriptive */}
//       {/* Maybe add quick links or summary cards here later */}
//     </div>
//   );
// };

// export default StudyHubWelcome;




import React from 'react';
import { useOutletContext } from 'react-router-dom';
import StudyHubProgress from '../StudyHubProgress';
import { StudyQuestion } from '@/types';
import { BookOpenCheck } from 'lucide-react';

// Define the type for the context received from StudyHub
type StudyHubContextType = {
  allQuestions: StudyQuestion[];
  // We don't need the handler in the welcome view, but it's part of the context
  handleQuestionCompletionChange: (questionId: string, isCompleted: boolean) => void; 
};

const StudyHubWelcome: React.FC = () => {
  // Get the shared state from the parent context
  const { allQuestions } = useOutletContext<StudyHubContextType>();

  return (
    <div className="flex flex-col space-y-10 p-6 max-w-6xl mx-auto">
      {/* Hero Section with Welcome Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-4">
          <BookOpenCheck className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Welcome to the Study Hub!</h1>
        </div>

        {/* Introduction Text */}
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed pl-14">
          Your central place to prepare for technical interviews. Track your progress across DSA, 
          System Design, Core Subjects, and HR topics. Select a section from the sidebar to get started.
        </p>
      </div>
      
      {/* Progress Section */}
      <div className="bg-slate-50 rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-semibold mb-6">Your Progress</h2>
        {/* Pass the shared questions state to the progress component */}
        <StudyHubProgress allQuestions={allQuestions} />
      </div>

      {/* Quick Tips Section (Optional visual enhancement) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h3 className="text-lg font-medium mb-2 text-blue-700">Study Tips</h3>
          <p className="text-blue-600">Focus on one topic at a time. Regular practice is more effective than cramming.</p>
        </div>
        <div className="bg-green-50 rounded-lg p-6 border border-green-100">
          <h3 className="text-lg font-medium mb-2 text-green-700">Get Started</h3>
          <p className="text-green-600">Choose a category from the sidebar and begin with the fundamentals before moving to advanced topics.</p>
        </div>
      </div>
    </div>
  );
};

export default StudyHubWelcome;