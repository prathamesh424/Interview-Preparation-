
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SavedPracticeList from "./SavedPracticeList"; // Import the list component
import SheetsView from "./SheetsView"; // Import the new Sheets view
import { BookOpenText, Bookmark } from "lucide-react"; // Icons for tabs

const SavedQuestionsComponent = () => {
  // This component now acts as a container for the two main views:
  // 1. Saved Practice Attempts (using SavedPracticeList)
  // 2. Question Sheets (using SheetsView)

  return (

        <SavedPracticeList />

  );
};

export default SavedQuestionsComponent;
