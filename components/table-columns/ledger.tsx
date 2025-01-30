"use client";

import { Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import UpdateLedgerDialog from "../dialogs/ledgers/update";
import { Button } from "../ui/button";
import toast from "react-hot-toast";

// Define the Ledger interface
export interface Ledger {
  id: number;
  name: string;
}

// Define props that need to be passed into getLedgerColumns
interface GetLedgerColumnsProps {
  fetchLedgers: () => void;
  token: string;
  userRole?: string;
}

// Function to generate table columns
export const getLedgerColumns = ({
  fetchLedgers,
  token,
  userRole,
}: GetLedgerColumnsProps): ColumnDef<Ledger>[] => {
  // Function to handle ledger deletion
  const handleDelete = async (ledger: Ledger) => {
    if (confirm(`Are you sure you want to delete ledger: ${ledger.name}?`)) {
      try {
        const res = await fetch(`/api/ledgers/${ledger.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Use token from function props
          },
        });

        if (!res.ok) {
          toast.error("Failed to delete ledger");
          throw new Error("Failed to delete ledger.");
        }

        fetchLedgers(); // ✅ Refresh table after delete
        toast.success(`Ledger ${ledger.name} deleted successfully.`);
      } catch (error) {
        console.error("Error deleting ledger:", error);
        toast.error("Error deleting ledger. Please try again.");
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
      header: "Ledger Name",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <UpdateLedgerDialog ledgerId={row.original.id} />
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
