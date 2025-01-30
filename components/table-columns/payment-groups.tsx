"use client";

import { Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import UpdatePaymentGroupDialog from "../dialogs/payment-groups/update";
import { Button } from "../ui/button";
import toast from "react-hot-toast";

// Define the PaymentGroup interface
export interface PaymentGroup {
  id: number;
  name: string;
}

// Define props that need to be passed into getPaymentGroupColumns
interface GetPaymentGroupColumnsProps {
  fetchPaymentGroups: () => void;
  token: string;
  userRole?: string;
}

// Function to generate table columns
export const getPaymentGroupColumns = ({
  fetchPaymentGroups,
  token,
  userRole,
}: GetPaymentGroupColumnsProps): ColumnDef<PaymentGroup>[] => {
  // Function to handle payment group deletion
  const handleDelete = async (paymentGroup: PaymentGroup) => {
    if (
      confirm(
        `Are you sure you want to delete payment group: ${paymentGroup.name}?`
      )
    ) {
      try {
        const res = await fetch(`/api/payment-groups/${paymentGroup.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Use token from function props
          },
        });

        if (!res.ok) {
          toast.error("Failed to delete payment group");
          throw new Error("Failed to delete payment group.");
        }

        fetchPaymentGroups(); // ✅ Refresh table after delete
        toast.success(
          `Payment Group ${paymentGroup.name} deleted successfully.`
        );
      } catch (error) {
        console.error("Error deleting payment group:", error);
        toast.error("Error deleting payment group. Please try again.");
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
      header: "Payment Group Name",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <UpdatePaymentGroupDialog groupId={row.original.id} />
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
