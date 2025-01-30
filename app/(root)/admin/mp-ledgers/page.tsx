"use client";

import Banner from "@/components/reusable/banner";
import { DataTable } from "@/components/ui/data-table";
import {
  getLedgerColumns,
} from "@/components/table-columns/monthly-payments-ledgers";
import CreateLedgerDialog from "@/components/dialogs/mp-ledgers/create";
import { useMonthlyPaymentLedgers } from "@/contexts/mp-ledger-context";
import { useAuth } from "@/contexts";

const LedgersPage = () => {
  const { token, user } = useAuth();
  const { ledgers, fetchLedgers } = useMonthlyPaymentLedgers();



  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Banner
        title="Monthly Payments Ledger Management"
        action={<CreateLedgerDialog />}
      />
      <DataTable
        columns={getLedgerColumns({ fetchLedgers, token:token!, userRole:user?.role })}
        data={ledgers}
        title="Monthly Payment Ledgers"
      />
    </div>
  );
};

export default LedgersPage;
