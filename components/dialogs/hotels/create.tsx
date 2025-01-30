"use client";

import CreateHotelForm from "@/components/forms/hotels/create";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CreateHotelDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Create Hotel
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Hotel</DialogTitle>
        </DialogHeader>
        <CreateHotelForm />
      </DialogContent>
    </Dialog>
  );
};

export default CreateHotelDialog;
