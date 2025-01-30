"use client";

import UpdateRoleForm from "@/components/forms/roles/update";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit } from "lucide-react";

interface UpdateRoleDialogProps {
  roleId: number;
  fetchRoles: () => void;
}

const UpdateRoleDialog = ({ roleId, fetchRoles }: UpdateRoleDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          <Edit className="h-5 w-5 object-contain" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Role</DialogTitle>
        </DialogHeader>
        <UpdateRoleForm roleId={roleId} fetchRoles={fetchRoles} />
      </DialogContent>
    </Dialog>
  );
};

export default UpdateRoleDialog;
