import Sidebar from "@/components/Sidebar";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

const Dashboard = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div
        className={cn(
          "flex-1 overflow-auto transition-all duration-300 ease-in-out",
          isSidebarExpanded ? "pl-64" : "pl-16"
        )}
      >
        <div className="p-6 mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
