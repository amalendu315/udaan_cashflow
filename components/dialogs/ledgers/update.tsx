"use client";

import UpdateLedgerForm from "@/components/forms/ledgers/update";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit } from "lucide-react";

interface UpdateLedgerDialogProps {
  ledgerId: number;
}

const UpdateLedgerDialog = ({ ledgerId }: UpdateLedgerDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          <Edit className="h-5 w-5 object-contain" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Ledger</DialogTitle>
        </DialogHeader>
        <UpdateLedgerForm ledgerId={ledgerId} />
      </DialogContent>
    </Dialog>
  );
};

export default UpdateLedgerDialog;
