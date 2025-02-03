"use client";

import { DataTable } from "@/components/ui/data-table";
import Banner from "@/components/reusable/banner";
import CreateHotelDialog from "@/components/dialogs/hotels/create";
import { useHotels } from "@/contexts/hotel-context";
import { getHotelColumns } from "@/components/table-columns/hotel";
import { useAuth } from "@/contexts";
import { useState } from "react";
import GlobalSearch from "@/components/reusable/globalSearch";

const HotelsPage = () => {
  const { token, user } = useAuth();
  const { hotels, fetchHotels } = useHotels();
  const [searchQuery, setSearchQuery] = useState("");
    
      // Filter vendors based on search query
      const filteredHotels = hotels.filter((hotel) =>
        Object.values(hotel).some(
          (value) =>
            typeof value === "string" &&
            value.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Banner title="Hotel Management" action={<CreateHotelDialog />} />
      {/* Global Search Component */}
      <div className="mb-4 flex justify-end">
        <GlobalSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search hotels..."
        />
      </div>
      <DataTable
        columns={getHotelColumns({
          fetchHotels,
          token: token!,
          userRole: user?.role,
        })}
        data={filteredHotels}
        title="Hotels"
      />
    </div>
  );
};

export default HotelsPage;
