"use client";

import React from "react";
import { DataTable } from "@/components/ui/data-table";
import Banner from "@/components/reusable/banner";
import CreateHotelDialog from "@/components/dialogs/hotels/create";
import { useHotels } from "@/contexts/hotel-context";
import { getHotelColumns } from "@/components/table-columns/hotel";
import { useAuth } from "@/contexts";

const HotelsPage = () => {
  const {token, user} = useAuth();
  const { hotels, fetchHotels } = useHotels();


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Banner title="Hotel Management" action={<CreateHotelDialog />} />
      <DataTable columns={getHotelColumns({fetchHotels, token:token!, userRole:user?.role})} data={hotels} title="Hotels" />
    </div>
  );
};

export default HotelsPage;
