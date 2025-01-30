"use client";

import { useState, useEffect, useMemo } from "react";
import { FetchWrapper } from "@/utils";
import { useAuth, Vendor } from "@/contexts";
import toast from "react-hot-toast";
import Spinner from "@/components/reusable/loading";

interface UpdateVendorFormProps {
  vendorId: number;
}

const UpdateVendorForm = ({ vendorId }: UpdateVendorFormProps) => {
    const {token} = useAuth();
  const [vendorName, setVendorName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  // const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize FetchWrapper
  const fetchWrapper = useMemo(() => new FetchWrapper(() => token), [token]);

  useEffect(() => {
    const fetchVendor = async () => {
      setIsLoading(true);
      try {
        const vendor:Vendor = await fetchWrapper.get(`/vendors/${vendorId}`);
        setVendorName(vendor.name);
        setPhone(vendor?.phone);
        setEmail(vendor?.email);
        setLocation(vendor?.location);
        setDescription(vendor?.description);
      } catch (error) {
        console.error("Failed to fetch vendor:", error);
        toast.error("Failed to fetch vendor");
        // setMessage("Error fetching vendor details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendor();
  }, [vendorId, fetchWrapper]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setMessage(null);
    setIsLoading(true);

    try {
      await fetchWrapper.put(`/vendors/${vendorId}`, {
        name: vendorName,
        location,
        description,
        email,
        phone,
      });
      // setMessage("Vendor updated successfully!");
      toast.success("Vendor updated successfully!");
    } catch (error) {
      console.error("Error updating vendor:", error);
      toast.error("Error updating vendor");
      // setMessage("Error updating vendor. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if(isLoading) {
    return <Spinner size={40} color="text-blue-500" />;
  }

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
          disabled={isLoading}
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
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? (
          <Spinner size={20} color="text-white" className="mr-2" />
        ) : (
          "Update Vendor"
        )}
      </button>
    </form>
  );
};

export default UpdateVendorForm;
