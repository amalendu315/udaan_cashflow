"use client";

import { Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import UpdateHotelDialog from "../dialogs/hotels/update";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import { formatReadableDate } from "@/lib/utils";

// Define the Hotel interface
export interface Hotel {
  Id: number;
  name: string;
  location: string;
  description: string;
  created_at: string;
}

// Define props that need to be passed into getHotelColumns
interface GetHotelColumnsProps {
  fetchHotels: () => void;
  token: string;
  userRole?: string;
}

// Function to generate table columns
export const getHotelColumns = ({
  fetchHotels,
  token,
  userRole,
}: GetHotelColumnsProps): ColumnDef<Hotel>[] => {
  // Function to handle hotel deletion
  const handleDelete = async (hotel: Hotel) => {
    if (confirm(`Are you sure you want to delete hotel: ${hotel.name}?`)) {
      try {
        const res = await fetch(`/api/hotels/${hotel.Id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Use token from function props
          },
        });

        if (!res.ok) {
          toast.error("Failed to delete hotel");
          throw new Error("Failed to delete hotel.");
        }

        fetchHotels(); // ✅ Refresh table after delete
        toast.success(`Hotel ${hotel.name} deleted successfully.`);
      } catch (error) {
        console.error("Error deleting hotel:", error);
        toast.error("Error deleting hotel. Please try again.");
      }
    }
  };

  return [
    {
      id: "serial_number",
      header: "Sl No.",
      cell: ({ row }) => row.index + 1, // Generate serial number dynamically
    },
    {
      accessorKey: "name",
      header: "Hotel Name",
    },
    {
      accessorKey: "location",
      header: "Location",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {formatReadableDate(row?.original?.created_at)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <UpdateHotelDialog hotelId={row.original.Id} />
          {userRole === "System-Admin" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(row.original)}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              <Trash2 className="h-5 w-5 object-contain" />
            </Button>
          )}
        </div>
      ),
    },
  ];
};
