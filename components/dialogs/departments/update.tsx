"use client";

import UpdateDepartmentForm from "@/components/forms/department/update";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit } from "lucide-react";

const UpdateDepartmentDialog = ({ departmentId }: { departmentId: number }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          <Edit className="h-5 w-5 object-contain" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Department</DialogTitle>
        </DialogHeader>
        <UpdateDepartmentForm departmentId={departmentId} />
      </DialogContent>
    </Dialog>
  );
};

export default UpdateDepartmentDialog;
