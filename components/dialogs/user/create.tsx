"use client";

import CreateUserForm from "@/components/forms/user/create";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CreateUserDialog = ({fetchUsers}:{fetchUsers:()=>void}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Create User
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <CreateUserForm fetchUsers={fetchUsers} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
