"use client";

import CreateLedgerForm from "@/components/forms/mp-ledgers/create";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CreateLedgerDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Create Ledger
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Ledger</DialogTitle>
        </DialogHeader>
        <CreateLedgerForm />
      </DialogContent>
    </Dialog>
  );
};

export default CreateLedgerDialog;
