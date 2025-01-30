"use client";

import { DataTable } from "@/components/ui/data-table";
import Banner from "@/components/reusable/banner";
import CreateLedgerDialog from "@/components/dialogs/ledgers/create";
import { useLedgers } from "@/contexts/ledger-context";
import { getLedgerColumns } from "@/components/table-columns/ledger";
import { useAuth } from "@/contexts";

const LedgersPage = () => {
  const { token, user } = useAuth();
  const { ledgers, fetchLedgers } = useLedgers();

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Banner title="Ledger Management" action={<CreateLedgerDialog />} />
      <DataTable columns={getLedgerColumns({fetchLedgers, token:token!, userRole:user?.role})} data={ledgers} title="Ledgers" />
    </div>
  );
};

export default LedgersPage;
