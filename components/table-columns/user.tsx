"use client";

import { Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import UpdateUserDialog from "../dialogs/user/update";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

// Define the User interface
export interface User {
  Id: number;
  email: string;
  hotel_id: number;
  hotel_name: string;
  role_id: string;
  role: string;
  username: string;
}

// Define props that need to be passed into getUserColumns
interface GetUserColumnsProps {
  fetchUsers: () => void;
  token: string;
  userRole?: string;
}

// Function to generate table columns
export const getUserColumns = ({
  fetchUsers,
  token,
  userRole,
}: GetUserColumnsProps): ColumnDef<User>[] => {
  // Function to handle user deletion
  const handleDelete = async (userData: User) => {
    if (
      confirm(`Are you sure you want to delete user: ${userData.username}?`)
    ) {
      try {
        const res = await fetch(`/api/users/${userData.Id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Use token from function props
          },
        });

        if (!res.ok) {
          toast.error("Failed to delete user");
          throw new Error("Failed to delete user.");
        }

        toast.success(`User ${userData.username} deleted successfully.`);
        fetchUsers(); // ✅ Refresh table after delete
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Error deleting user. Please try again.");
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
      accessorKey: "username",
      header: "Username",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
    },
    {
      accessorKey: "hotel",
      header: "Hotel",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <UpdateUserDialog userId={row.original.Id} fetchUsers={fetchUsers} />
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
