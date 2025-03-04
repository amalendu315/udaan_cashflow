"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 h-full">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} />

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Navbar */}
          <Navbar toggleSidebar={toggleSidebar} />

          {/* Main Content */}
          <main className="flex-1 sm:p-2 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;
