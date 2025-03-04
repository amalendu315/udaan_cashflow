"use client";

import { Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import UpdateVendorDialog from "../dialogs/vendors/update";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import { formatReadableDate } from "@/lib/utils";

// Define the Vendor interface
export interface Vendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  location: string;
  description: string;
  created_at: string;
}

// Define props that need to be passed into getVendorColumns
interface GetVendorColumnsProps {
  fetchVendors: () => void;
  token: string;
  userRole?: string;
}

// Function to generate table columns
export const getVendorColumns = ({
  fetchVendors,
  token,
  userRole,
}: GetVendorColumnsProps): ColumnDef<Vendor>[] => {
  // Function to handle vendor deletion
  const handleDelete = async (vendor: Vendor) => {
    if (confirm(`Are you sure you want to delete vendor: ${vendor.name}?`)) {
      try {
        const res = await fetch(`/api/vendors/${vendor.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Use token from function props
          },
        });

        if (!res.ok) {
          toast.error("Failed to delete vendor");
          throw new Error("Failed to delete vendor.");
        }

        toast.success(`Vendor ${vendor.name} deleted successfully.`);
        fetchVendors(); // ✅ Refresh table after delete
      } catch (error) {
        console.error("Error deleting vendor:", error);
        toast.error("Error deleting vendor. Please try again.");
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
      header: "Vendor Name",
    },
    // {
    //   accessorKey: "phone",
    //   header: "Phone",
    // },
    // {
    //   accessorKey: "email",
    //   header: "Email",
    // },
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
      cell: ({ row }) => {
        const date = row.original?.created_at;
        return date ? formatReadableDate(date) : "";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <UpdateVendorDialog vendorId={row.original.id} />
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
