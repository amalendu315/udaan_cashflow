"use client";

import PaymentRequestPage from "@/components/forms/payment-request";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CreatePaymentRequestDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Create Payment Request
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Create Payment Request</DialogTitle>
        </DialogHeader>
        <PaymentRequestPage />
      </DialogContent>
    </Dialog>
  );
};

export default CreatePaymentRequestDialog;
