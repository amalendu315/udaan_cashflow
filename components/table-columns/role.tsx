"use client";

import { Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import UpdateRoleDialog from "../dialogs/roles/update";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

// Define the Role interface
interface Role {
  id: number;
  role_name: string;
}

// Define props that need to be passed into getRoleColumns
interface GetRoleColumnsProps {
  fetchRoles: () => void;
  token: string;
  userRole?: string;
}

// Function to generate table columns
export const getRoleColumns = ({
  fetchRoles,
  token,
  userRole,
}: GetRoleColumnsProps): ColumnDef<Role>[] => {
  // Function to handle role deletion
  const handleDelete = async (roleData: Role) => {
    if (
      confirm(`Are you sure you want to delete role: ${roleData.role_name}?`)
    ) {
      try {
        const res = await fetch(`/api/roles/${roleData.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Use token from function props
          },
        });

        if (!res.ok) {
          toast.error("Failed to delete role");
          throw new Error("Failed to delete role.");
        }

        toast.success(`Role ${roleData.role_name} deleted successfully.`);
        fetchRoles(); // ✅ Refresh table after delete
      } catch (error) {
        console.error("Error deleting role:", error);
        toast.error("Error deleting role. Please try again.");
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
      accessorKey: "role_name",
      header: "Role Name",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <UpdateRoleDialog roleId={row.original.id} fetchRoles={fetchRoles} />
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
