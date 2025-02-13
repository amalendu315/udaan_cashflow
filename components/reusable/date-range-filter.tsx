"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DateRangeFilterProps {
  onFilterChange: (startDate: string, endDate: string) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onFilterChange,
}) => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const applyFilters = () => {
    if (startDate && endDate) {
      onFilterChange(startDate, endDate);
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    onFilterChange("", "");
  };

  return (
    <div className="flex justify-end items-center space-x-4 mb-4">
      <label htmlFor="start-date" className="font-medium text-gray-700">
        Start Date:
      </label>
      <input
        type="date"
        id="start-date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <label htmlFor="end-date" className="font-medium text-gray-700">
        End Date:
      </label>
      <input
        type="date"
        id="end-date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <Button variant="outline" onClick={applyFilters}>
        Apply Filter
      </Button>
      <Button variant="outline" onClick={clearFilters}>
        Clear Filter
      </Button>
    </div>
  );
};

export default DateRangeFilter;
