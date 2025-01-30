"use client";

import { useAuth, useVendors } from "@/contexts";
import { getVendorColumns } from "@/components/table-columns/vendor";
import Banner from "@/components/reusable/banner";
import { DataTable } from "@/components/ui/data-table";
import CreateVendorDialog from "@/components/dialogs/vendors/create";

const VendorsPage = () => {
  const { token, user } = useAuth();
  const { vendors, fetchVendors } = useVendors();


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Banner title="Vendor Management" action={<CreateVendorDialog />} />
      <DataTable columns={getVendorColumns({fetchVendors, token:token!, userRole:user?.role})} data={vendors} title="Vendors" />
    </div>
  );
};

export default VendorsPage;
