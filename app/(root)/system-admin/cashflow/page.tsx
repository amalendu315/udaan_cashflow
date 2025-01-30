"use client";

// Dependencies
import React, { useState } from "react";

// Local Imports
import { Button } from "@/components/ui/button";
import Banner from "@/components/reusable/banner";
import CashflowTable from "@/components/reusable/cashflow-table";

const CashflowPage = () => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    const month = "2025-01"; // Replace with selected month
    const res = await fetch(`/api/cashflow/report?month=${month}`, {
      method: "GET",
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cashflow-report-${month}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setIsGeneratingReport(false);
    } else {
      console.error("Failed to generate report");
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
      <CashflowTable readOnly={false} itemsPerPage={30}/>
    </div>
  );
};

export default CashflowPage;
