"use client";

import { useState, useEffect, useMemo } from "react";
import { FetchWrapper } from "@/utils";
import { useAuth } from "@/contexts";
import toast from "react-hot-toast";
import { Hotel } from "@/components/table-columns/hotel";

interface UpdateHotelFormProps {
  hotelId: number;
}

const UpdateHotelForm = ({ hotelId }: UpdateHotelFormProps) => {
    const {token} = useAuth();
  const [hotelName, setHotelName] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize FetchWrapper
 const fetchWrapper = useMemo(() => new FetchWrapper(() => token), [token]);

  useEffect(() => {
    const fetchHotel = async () => {
      setIsLoading(true);
      try {
        const hotel:Hotel = await fetchWrapper.get(`/hotels/${hotelId}`);
        setHotelName(hotel.name || "");
        setLocation(hotel.location || "");
        setDescription(hotel.description || "");
      } catch (error) {
        console.error("Failed to fetch hotel:", error);
        toast.error((error as Error)?.message || "Failed to fetch hotel");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotel();
  }, [hotelId, fetchWrapper]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await fetchWrapper.put(`/hotels/${hotelId}`, {
        name: hotelName,
        location,
        description,
      });
      toast.success("Hotel updated successfully!");
    } catch (error) {
      console.error("Error updating hotel:", error);
      toast.error("Error updating hotel. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Hotel Name</label>
        <input
          type="text"
          name="hotel_name"
          value={hotelName}
          onChange={(e) => setHotelName(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      <div>
        <label className="block font-medium">Location</label>
        <input
          type="text"
          name="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      <div>
        <label className="block font-medium">Description</label>
        <input
          type="text"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Update Hotel"}
      </button>
    </form>
  );
};

export default UpdateHotelForm;
