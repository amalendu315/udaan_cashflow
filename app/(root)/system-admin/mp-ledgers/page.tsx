"use client";

import Banner from "@/components/reusable/banner";
import { DataTable } from "@/components/ui/data-table";
import {
  getLedgerColumns,
} from "@/components/table-columns/monthly-payments-ledgers";
import CreateLedgerDialog from "@/components/dialogs/mp-ledgers/create";
import { useMonthlyPaymentLedgers } from "@/contexts/mp-ledger-context";
import { useAuth } from "@/contexts";
import { useState } from "react";
import GlobalSearch from "@/components/reusable/globalSearch";

const LedgersPage = () => {
  const { token, user } = useAuth();
  const { ledgers, fetchLedgers } = useMonthlyPaymentLedgers();
  const [searchQuery, setSearchQuery] = useState("");
  
    // Filter vendors based on search query
    const filteredLedgers = ledgers.filter((ledger) =>
      Object.values(ledger).some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );


  
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Banner
        title="Monthly Payments Ledger Management"
        action={<CreateLedgerDialog />}
      />
      {/* Global Search Component */}
      <div className="mb-4 flex justify-end">
        <GlobalSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search ledgers..."
        />
      </div>
      <DataTable
        columns={getLedgerColumns({
          fetchLedgers,
          token: token!,
          userRole: user?.role,
        })}
        data={filteredLedgers}
        title="Monthly Payment Ledgers"
      />
    </div>
  );
};

export default LedgersPage;
