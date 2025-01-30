"use client";

import { Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import UpdateDepartmentDialog from "../dialogs/departments/update";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import { formatReadableDate } from "@/lib/utils";

interface Department {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface GetDepartmentColumnsProps {
  fetchDepartments: () => void;
  token: string; // ✅ Pass token from parent component
  userRole?: string; // ✅ Pass user role from parent component
}

export const getDepartmentColumns = ({
  fetchDepartments,
  token,
  userRole,
}: GetDepartmentColumnsProps): ColumnDef<Department>[] => {
  const handleDelete = async (department: Department) => {
    if (
      confirm(`Are you sure you want to delete department: ${department.name}?`)
    ) {
      try {
        const res = await fetch(`/api/departments/${department.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Use token from function props
          },
        });

        if (!res.ok) {
          toast.error("Failed to delete department");
          throw new Error("Failed to delete department.");
        }

        fetchDepartments(); // ✅ Refresh table after delete
        toast.success(`Department ${department.name} deleted successfully.`);
      } catch (error) {
        console.error("Error deleting department:", error);
        toast.error("Error deleting department. Please try again.");
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
      header: "Department Name",
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
      accessorKey: "updated_at",
      header: "Updated At",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {formatReadableDate(row?.original?.updated_at)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <UpdateDepartmentDialog departmentId={row.original.id} />
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
