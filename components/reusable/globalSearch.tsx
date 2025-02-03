"use client";
// import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface GlobalSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  placeholder?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  searchQuery,
  setSearchQuery,
  placeholder = "Search...",
}) => {
  return (
    <div className="flex items-center gap-3 p-2 bg-white rounded-md shadow-sm border border-gray-300">
      <Search className="h-5 w-5 text-gray-500" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-64 border-none focus:ring-0"
      />
    </div>
  );
};

export default GlobalSearch;
