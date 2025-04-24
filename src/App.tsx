import { Toaster } from "@/components/ui/toaster";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import NavBar from "@/components/NavBar";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import SavedQuestionsComponent from "./components/SavedQuestions";
import { SavedCheatSheetsList } from "./components/SavedCheatSheetsList";
import { CheatSheetDetailView } from "./components/CheatSheetDetailView"; // Corrected import
import StudyHub from "./components/StudyHub/StudyHub"; // Import StudyHub
// Import Study Hub Views
import StudyHubWelcome from "./components/StudyHub/views/StudyHubWelcome";
import DsaSheetView from "./components/StudyHub/views/DsaSheetView";
import DsaPlaylistView from "./components/StudyHub/views/DsaPlaylistView";
import CoreSubjectsView from "./components/StudyHub/views/CoreSubjectsView";
import SystemDesignView from "./components/StudyHub/views/SystemDesignView";
import HrView from "./components/StudyHub/views/HrView";
import OthersView from "./components/StudyHub/views/OthersView";
import SheetsView from "./components/SheetsView"; // Import SheetsView
import UserProfile from "./components/UserProfile";
import NotFound from "./pages/NotFound";
import AIInstantInterviewPage from "./pages/ai-instant/page";
import MockInterviews from "./components/MockInterviews/MockInterviews";
import InterviewSession from "./components/MockInterviews/InterviewSession";
import PrepPlanner from "./components/PrepPlanner";
import SettingsPanel from "./components/SettingsPanel";
import PracticeQuestions from "./components/PracticeQuestions";
import DashboardHome from "./pages/DashboardHome"; // Import DashboardHome

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <NavBar />
      {children}
    </>
  );
};

// Public route with navbar
const PublicRouteWithNavBar = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Index />} />
      <Route path="/register" element={<Index />} />
      
     <Route 
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
>
  {/* Index route for the main dashboard view */}
  <Route index element={<DashboardHome />} /> 
  <Route path="practice" element={<PracticeQuestions />} />
  <Route path="planner" element={<PrepPlanner />} />
  <Route path="settings" element={<SettingsPanel />} />

  {/* 🧠 Interview Section */}
  <Route path="interviews">
    <Route
      index
      element={
        <div className="container py-8 max-w-6xl mx-auto">
          <MockInterviews />
        </div>
      }
    />
    {/* <Route
      path="session/:interviewId"
      element={
        <div className="container py-4 max-w-7xl mx-auto">
          <InterviewSession />
        </div>
      }
    /> */}
    <Route path="ai-instant" element={<AIInstantInterviewPage />} />
  </Route>
</Route>



      {/* Mock Interview Routes */}
      <Route 
        path="/saved" 
        element={
          <ProtectedRoute>
            <div className="container py-8 max-w-5xl mx-auto">
              {/* Render the component with Tabs */}
              <SavedQuestionsComponent />
            </div>
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <div className="container py-8 max-w-5xl mx-auto">
              <UserProfile />
            </div>
          </ProtectedRoute>
        } 
      />

      {/* Added Saved Cheat Sheets Route */}
      <Route 
        path="/saved-cheat-sheets" 
        element={
          <ProtectedRoute>
            <div className="container py-8 max-w-5xl mx-auto">
              <SavedCheatSheetsList />
            </div>
          </ProtectedRoute>
        } 
      />

      {/* Added Route for Cheat Sheet Detail View */}
      <Route 
        path="/saved-cheat-sheets/:sheetId" 
        element={
          <ProtectedRoute>
            <div className="container py-8 max-w-5xl mx-auto">
              <CheatSheetDetailView /> {/* Render the detail view */}
            </div>
          </ProtectedRoute>
        } 
      />

      {/* Added Route for Study Hub */}
      <Route 
        path="/study-hub/*" 
        element={
          <ProtectedRoute>
            {/* StudyHub component handles its own layout (sidebar + content via Outlet) */}
            <StudyHub /> 
          </ProtectedRoute>
        } 
      >
        {/* Nested Routes for Study Hub */}
        <Route index element={<StudyHubWelcome />} /> {/* Default view */}
        <Route path="dsa-sheet" element={<DsaSheetView />} />
        <Route path="dsa-playlist" element={<DsaPlaylistView />} />
        <Route path="core-subjects" element={<CoreSubjectsView />} />
        <Route path="system-design" element={<SystemDesignView />} />
        <Route path="hr" element={<HrView />} />
        <Route path="others" element={<OthersView />} />
        <Route path="question-sheets" element={<SheetsView />} /> {/* Added route for Question Sheets */}
        {/* Add routes for specific topics/questions later, e.g., dsa-sheet/:topicId */}
      </Route>

      <Route path="*" element={<PublicRouteWithNavBar><NotFound /></PublicRouteWithNavBar>} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SessionContextProvider supabaseClient={supabase}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </SessionContextProvider>
  </QueryClientProvider>
);


export default App;
