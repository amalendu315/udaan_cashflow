"use client";

import CreateRoleForm from "@/components/forms/roles/create";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CreateRoleDialog = ({ fetchRoles }: { fetchRoles : () => void }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Create Role
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
        </DialogHeader>
        <CreateRoleForm fetchRoles={fetchRoles} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoleDialog;
