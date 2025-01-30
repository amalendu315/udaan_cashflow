"use client";

import { useState } from "react";
import { FetchWrapper } from "@/utils";
import { useAuth, useHotels } from "@/contexts";
import toast from "react-hot-toast";

const CreateHotelForm = () => {
    const { token } = useAuth();
  const { fetchHotels } = useHotels(); // Fetch hotels context function
  const [hotelName, setHotelName] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize FetchWrapper
  const fetchWrapper = new FetchWrapper(()=>token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create a new hotel using FetchWrapper
      await fetchWrapper.post("/hotels", {
        name: hotelName,
        location,
        description,
      });

      toast.success("Hotel created successfully!");
      setHotelName("");
      setLocation("");
      setDescription("");
      fetchHotels(); // Refresh hotels list
    } catch (error) {
      console.error("Error creating hotel:", error);
      toast.error("Error creating hotel. Please try again.");
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
        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? "Creating..." : "Create Hotel"}
      </button>
    </form>
  );
};

export default CreateHotelForm;
