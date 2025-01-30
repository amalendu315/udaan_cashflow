"use client";

import { useState } from "react";
import { FetchWrapper } from "@/utils";
import { useAuth, useVendors } from "@/contexts";
import toast from "react-hot-toast";
import Spinner from "@/components/reusable/loading";

const CreateVendorForm = () => {
  const { token } = useAuth();
  const { fetchVendors } = useVendors(); // Fetch hotels context function
  const [vendorName, setVendorName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  // const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize FetchWrapper
  const fetchWrapper = new FetchWrapper(()=>token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setMessage(null);
    setIsLoading(true);

    try {
      // Create a new hotel using FetchWrapper
      await fetchWrapper.post("/vendors", {
        name: vendorName,
        phone,
        email,
        location,
        description,
      });

      // setMessage("Vendor created successfully!");
      toast.success("Vendor Created Successfully")
      setVendorName("");
      setLocation("");
      setDescription("");
      setPhone("");
      setEmail("");
      fetchVendors(); // Refresh hotels list
    } catch (error) {
      console.error("Error creating vendor:", error);
      toast.error("Error creating vendor. Please try again.");
      // setMessage("Error creating vendor. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* {message && (
        <p
          className={`text-${message.includes("Error") ? "red" : "green"}-500`}
        >
          {message}
        </p>
      )} */}
      <div>
        <label className="block font-medium">Vendor Name</label>
        <input
          type="text"
          name="name"
          value={vendorName}
          onChange={(e) => setVendorName(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      <div>
        <label className="block font-medium">Phone</label>
        <input
          type="text"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      <div>
        <label className="block font-medium">Email</label>
        <input
          type="text"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? (
          <Spinner size={20} color="text-white" className="mr-2" />
        ) : (
          "Create Vendor"
        )}
      </button>
    </form>
  );
};

export default CreateVendorForm;
