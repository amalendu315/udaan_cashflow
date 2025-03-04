"use client";

// Dependencies
import React from "react";

// Local Imports
import Banner from "@/components/reusable/banner";
import CashflowTable from "@/components/reusable/cashflow-table";

const CashflowPage = () => {

  return (
    <div>
      <Banner
        title="Cashflow"
      />
      <CashflowTable readOnly={true} itemsPerPage={30}/>
    </div>
  );
};

export default CashflowPage;
