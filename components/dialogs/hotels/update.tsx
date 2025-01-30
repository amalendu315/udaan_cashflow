"use client";

import UpdateHotelForm from "@/components/forms/hotels/update";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit } from "lucide-react";

interface UpdateHotelDialogProps {
  hotelId: number;
}

const UpdateHotelDialog = ({ hotelId }: UpdateHotelDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          <Edit className="h-5 w-5 object-contain" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Hotel</DialogTitle>
        </DialogHeader>
        <UpdateHotelForm hotelId={hotelId} />
      </DialogContent>
    </Dialog>
  );
};

export default UpdateHotelDialog;
