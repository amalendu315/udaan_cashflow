"use client";

// Dependencies
import React, { useState } from "react";

// Local Imports
import { Button } from "@/components/ui/button";
import Banner from "@/components/reusable/banner";
import CashflowTable from "@/components/reusable/cashflow-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const CashflowPage = () => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");

  // 🟢 Generate report based on selected month
const handleGenerateReport = async () => {
  if (!selectedMonth) {
    toast.error("Please select a month");
    return;
  }

  setIsGeneratingReport(true);

  try {
    // Compute the first and last date of the selected month
    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDate = new Date(year, month - 1, 1).toISOString().split("T")[0]; // Correct month calculation
    const lastDate = new Date(year, month, 0).toISOString().split("T")[0];

    console.log("Generating report for:", { firstDate, lastDate });

    const response = await fetch("/api/cashflow/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: selectedMonth }), // Pass only the month, backend should handle dates
    });

    if (!response.ok) {
      throw new Error(`Failed to generate report: ${response.statusText}`);
    }

    // Convert response into a downloadable PDF
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cashflow-report-${selectedMonth}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url); // Free memory

    toast.success("Report downloaded successfully!");
  } catch (error) {
    console.error("Error generating report:", error);
    toast.error((error as Error).message || "Failed to generate report");
  } finally {
    setIsGeneratingReport(false);
    setIsDialogOpen(false);
  }
};


  return (
    <div>
      {/* Banner Section with Generate Report Button */}
      <Banner
        title="Cashflow"
        action={
          <Button
            onClick={() => setIsDialogOpen(true)}
            disabled={isGeneratingReport}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {isGeneratingReport ? "Generating Report..." : "Generate Report"}
          </Button>
        }
      />

      {/* Cashflow Table */}
      <CashflowTable readOnly={false} itemsPerPage={30} />

      {/* Generate Report Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Month for Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block font-medium">Select Month</label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <Button
              onClick={handleGenerateReport}
              disabled={!selectedMonth || isGeneratingReport}
              className="w-full bg-green-600 text-white py-2 rounded"
            >
              Generate Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashflowPage;
