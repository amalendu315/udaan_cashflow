"use client";
import CreateProjectedInflow from "@/components/forms/projected-inflows/create";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CreateInflowDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Create Projected Inflow
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Inflow</DialogTitle>
        </DialogHeader>
        <CreateProjectedInflow />
      </DialogContent>
    </Dialog>
  );
};

export default CreateInflowDialog;
