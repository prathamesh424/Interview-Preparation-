import React, { useState, useMemo } from 'react'; 
import { Outlet, useOutletContext } from 'react-router-dom'; 
import StudyHubSidebar from './StudyHubSidebar'; // Ensuring relative path and correct casing
import { Button } from '@/components/ui/button'; 
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'; 
import { cn } from '@/lib/utils'; // Utility for conditional classes
import { StudyQuestion } from '@/types'; // Import type
// Import all mock data sets
import { dsaQuestions } from './mockData';
import { systemDesignQuestions } from './mockData';
import { hrQuestions } from './mockData';
import { coreSubjectsQuestions } from './mockData';
// Removed useAuth import here, will be used in views
// import { useAuth } from '@/context/AuthContext'; 

// Combine initial data (do this outside component or useMemo if needed)
const initialAllQuestions = [ // Reverted name
  ...dsaQuestions,
  ...systemDesignQuestions,
  ...hrQuestions,
  ...coreSubjectsQuestions,
  // Add other sections if they exist
];

// Define the type for the context we'll pass down
type StudyHubContextType = {
  allQuestions: StudyQuestion[];
  handleQuestionCompletionChange: (questionId: string, isCompleted: boolean) => void;
};

const StudyHub: React.FC = () => {
  // Removed user import here
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Central state for all questions, initialized from mock data
  // Views will fetch actual progress from Supabase
  const [allQuestionsData, setAllQuestionsData] = useState<StudyQuestion[]>(initialAllQuestions);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handler to update the central state - Supabase call will happen in the view components
  const handleQuestionCompletionChange = (questionId: string, isCompleted: boolean) => {
    // This update is now primarily for real-time UI feedback across components
    // The actual persistence logic is delegated back to the view components
    setAllQuestionsData(currentQuestions =>
      currentQuestions.map(q =>
        q.id === questionId ? { ...q, isCompleted } : q
      )
    );
  };

  return (
    // Ensure parent div takes full height after NavBar
    <div className="flex h-[calc(100vh-4rem)]"> {/* Adjust height calculation if NavBar height differs */}
      <StudyHubSidebar isOpen={isSidebarOpen} />
      <main className={cn(
        "flex-1 p-6 overflow-y-auto transition-all duration-300 ease-in-out",
        // Adjust margin based on sidebar state if sidebar is fixed/absolute
        // If sidebar is part of flex, width adjustment happens automatically
      )}>
        {/* Button to toggle sidebar */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="absolute top-18 left-4 z-20 md:hidden" // Show on mobile, adjust positioning
        >
           {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </Button>
        {/* Desktop Toggle Button - positioned within main content flow */}
         <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="absolute top-4 left-4 z-20 hidden md:inline-flex" // Positioned inside main's padding, hidden on mobile
        >
           {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </Button>

        {/* Content Area */}
        <div className={cn(
             "relative transition-all duration-300 ease-in-out pt-10 md:pt-0", 
        )}>
           {/* Pass state and handler down via Outlet context */}
           <Outlet context={{ allQuestions: allQuestionsData, handleQuestionCompletionChange } satisfies StudyHubContextType} /> 
        </div>
      </main>
    </div>
  );
};

export default StudyHub;
