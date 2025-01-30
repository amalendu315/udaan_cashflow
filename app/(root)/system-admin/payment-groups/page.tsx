"use client";

import Banner from "@/components/reusable/banner";
import { DataTable } from "@/components/ui/data-table";
import { getPaymentGroupColumns } from "@/components/table-columns/payment-groups";
import CreatePaymentGroupDialog from "@/components/dialogs/payment-groups/create";
import { usePaymentGroups } from "@/contexts/payment-group-context";
import { useAuth } from "@/contexts";

const PaymentGroupsPage = () => {
  const { token, user } = useAuth();
  const { paymentGroups, fetchPaymentGroups } = usePaymentGroups(); // Get data and fetch function from context


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Banner
        title="Payment Groups Management"
        action={<CreatePaymentGroupDialog />}
      />
      {paymentGroups.length === 0 ? (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">No payment groups found...</p>
        </div>
      ) : (
        <DataTable
          columns={getPaymentGroupColumns({fetchPaymentGroups, token:token!, userRole:user?.role})}
          data={paymentGroups}
          title={"Payment Groups"}
        />
      )}
    </div>
  );
};

export default PaymentGroupsPage;
