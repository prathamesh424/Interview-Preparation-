import { useState } from "react";
import { List, Calendar, Video, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { id: "practice", label: "Practice Questions", icon: <List className="h-5 w-5" />, path: "/dashboard/practice" },
  { id: "planner", label: "Prep Planner", icon: <Calendar className="h-5 w-5" />, path: "/dashboard/planner" },
  { id: "interviews", label: "Mock Interviews", icon: <Video className="h-5 w-5" />, path: "/dashboard/interviews" },
  { id: "settings", label: "Settings", icon: <Settings className="h-5 w-5" />, path: "/dashboard/settings" },
];

const Sidebar = () => {
  const { user } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "fixed left-0 h-full border-r bg-background flex flex-col transition-all duration-300 ease-in-out z-10",
        isSidebarExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={() => setIsSidebarExpanded(true)}
      onMouseLeave={() => setIsSidebarExpanded(false)}
    >
      <div className={cn("p-4 border-b h-[69px] flex items-center shrink-0", !isSidebarExpanded ? "justify-center" : "justify-start")}>
        <h2 className={cn(
          "font-semibold text-lg truncate transition-opacity duration-300 ease-in-out",
          isSidebarExpanded ? "opacity-100" : "opacity-0 absolute"
        )}>
          Welcome, <br /> {user?.name || "User"}!
        </h2>
        <div className={cn(
          "h-10 w-10 bg-muted rounded-full flex items-center justify-center font-semibold transition-opacity duration-300 ease-in-out",
          !isSidebarExpanded ? "opacity-100" : "opacity-0 absolute"
        )}>
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            title={!isSidebarExpanded ? item.label : undefined}
            className={cn(
              "w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isSidebarExpanded ? "gap-3" : "justify-center",
              location.pathname.includes(item.path)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span className={cn(
              "ml-3 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
              isSidebarExpanded ? "opacity-100 max-w-xs" : "opacity-0 max-w-0 hidden"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
