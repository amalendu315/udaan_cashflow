"use client";
import { useState } from "react";
import { useAuth, useVendors } from "@/contexts";
import { getVendorColumns } from "@/components/table-columns/vendor";
import Banner from "@/components/reusable/banner";
import { DataTable } from "@/components/ui/data-table";
import CreateVendorDialog from "@/components/dialogs/vendors/create";
import GlobalSearch from "@/components/reusable/globalSearch";

const VendorsPage = () => {
  const { token, user } = useAuth();
  const { vendors, fetchVendors } = useVendors();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter vendors based on search query
  const filteredVendors = vendors.filter((vendor) =>
    Object.values(vendor).some(
      (value) =>
        typeof value === "string" &&
        value.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Banner title="Vendor Management" action={<CreateVendorDialog />} />

      {/* Global Search Input */}
      {/* Global Search Component */}
      <div className="mb-4 flex justify-end">
        <GlobalSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search vendors..."
        />
      </div>

      {/* Filtered DataTable */}
      <DataTable
        columns={getVendorColumns({
          fetchVendors,
          token: token!,
          userRole: user?.role,
        })}
        data={filteredVendors}
        title="Vendors"
      />
    </div>
  );
};

export default VendorsPage;
