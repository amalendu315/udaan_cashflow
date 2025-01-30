"use client";

import CreateVendorForm from "@/components/forms/vendor/create";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CreateVendorDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Create Vendor
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Vendor</DialogTitle>
        </DialogHeader>
        <CreateVendorForm />
      </DialogContent>
    </Dialog>
  );
};

export default CreateVendorDialog;
