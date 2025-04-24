import React from 'react';
import { NavLink } from 'react-router-dom'; // Import NavLink
import { cn } from '@/lib/utils'; // For conditional classes
import { BookOpen, Code, Users, Brain, Settings, GripHorizontal, FileText } from 'lucide-react'; // Added FileText icon

interface StudyHubSidebarProps {
  isOpen: boolean;
}

const StudyHubSidebar: React.FC<StudyHubSidebarProps> = ({ isOpen }) => {
  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string => {
    return cn(
      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
      isActive 
        ? "bg-primary text-primary-foreground" 
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      !isOpen && "justify-center" // Center icon when collapsed
    );
  };

  // Define link items with icons
  const navItems = [
    { to: "/study-hub/question-sheets", label: "Web Development", icon: FileText }, // Added Question Sheets
    { to: "/study-hub/dsa-sheet", label: "DSA Sheet", icon: Code },
    // { to: "/study-hub/dsa-playlist", label: "DSA Playlist", icon: BookOpen }, // Placeholder icon
    { to: "/study-hub/core-subjects", label: "Core Subjects", icon: Brain },
    { to: "/study-hub/system-design", label: "System Design", icon: Settings }, // Placeholder icon
    { to: "/study-hub/hr", label: "HR Questions", icon: Users },
    // { to: "/study-hub/others", label: "Others", icon: GripHorizontal }, // Placeholder icon
  ];

  return (
    <aside 
      className={cn(
        "bg-background border-r border-border flex flex-col transition-all duration-300 ease-in-out h-full", // Use h-full to fill parent flex item
        isOpen ? "w-64 p-4" : "w-16 p-2 items-center" // Change width and padding
      )}
    >
      <h2 className={cn(
          "text-lg font-semibold mb-4 text-foreground",
          !isOpen && "sr-only" // Hide text when collapsed (accessibility)
      )}>
        Topics
      </h2>
      <nav className="flex flex-col space-y-1 flex-grow"> {/* Use flex-grow to push footer down */}
        {navItems.map(item => (
          <NavLink 
            to={item.to} 
            className={getNavLinkClass}
            key={item.to}
            title={!isOpen ? item.label : undefined} // Show tooltip when collapsed
          >
            <item.icon className={cn("h-5 w-5", isOpen && "mr-3")} />
            <span className={cn(!isOpen && "sr-only")}>{item.label}</span> 
          </NavLink>
        ))}
      </nav>
      <div className={cn("mt-auto pt-4 border-t border-border", !isOpen && "sr-only")} > {/* Hide footer text when collapsed */}
         <p className="text-xs text-muted-foreground text-center">Study Hub v0.1</p>
      </div>
    </aside>
  );
};

export default StudyHubSidebar;
