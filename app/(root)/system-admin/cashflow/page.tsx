"use client";

// Dependencies
import React from "react";

// Local Imports
import Banner from "@/components/reusable/banner";
import CashflowTable from "@/components/reusable/cashflow-table";

const CashflowPage = () => {
  return (
    <div>
      {/* Banner Section with Generate Report Button */}
      <Banner
        title="Cashflow"
        // action={
        //   <Button
        //     onClick={() => setIsDialogOpen(true)}
        //     disabled={isGeneratingReport}
        //     className="bg-blue-500 text-white px-4 py-2 rounded"
        //   >
        //     {isGeneratingReport ? "Generating Report..." : "Generate Report"}
        //   </Button>
        // }
      />

      {/* Cashflow Table */}
      <CashflowTable readOnly={false} itemsPerPage={10} />
    </div>
  );
};

export default CashflowPage;
