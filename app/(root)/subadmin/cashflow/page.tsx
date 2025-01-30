"use client";

// Dependencies
import React, { useState } from "react";

// Local Imports
import { Button } from "@/components/ui/button";
import Banner from "@/components/reusable/banner";
import { useAuth } from "@/contexts";
import CashflowTable from "@/components/reusable/cashflow-table";

const CashflowPage = () => {
  const { token } = useAuth();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);

    try {
      const res = await fetch("/api/cashflow/report", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to generate report");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `Cashflow_Report_${timestamp}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url); // Cleanup after download
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div>
      <Banner
        title="Cashflow"
        action={
          <Button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {isGeneratingReport ? "Generating Report..." : "Generate Report"}
          </Button>
        }
      />
      <CashflowTable readOnly={true} itemsPerPage={30}/>
    </div>
  );
};

export default CashflowPage;
