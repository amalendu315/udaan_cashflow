"use client";

import CreatePaymentGroupForm from "@/components/forms/payment-groups/create";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CreatePaymentGroupDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Create Payment Group
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Payment Group</DialogTitle>
        </DialogHeader>
        <CreatePaymentGroupForm />
      </DialogContent>
    </Dialog>
  );
};

export default CreatePaymentGroupDialog;
