"use client";

import { useState } from "react";
import { FetchWrapper } from "@/utils";
import { useAuth } from "@/contexts";
import { usePaymentGroups } from "@/contexts/payment-group-context";
import toast from "react-hot-toast";

const CreatePaymentGroupForm = () => {
  const { token } = useAuth();
  const {fetchPaymentGroups} = usePaymentGroups();
  const [paymentGroupName, setPaymentGroupName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize FetchWrapper with the token
  const fetchWrapper = new FetchWrapper(() => token);

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();

    try {
      // Use FetchWrapper to make the POST request
      await fetchWrapper.post(
        "/payment-groups",
        { name: paymentGroupName },
        {
          includeAuth: true,
        }
      );

      toast.success("Payment Group created successfully!");
      fetchPaymentGroups();
      setPaymentGroupName(""); // Clear the form
    } catch (error) {
      toast.error("Error creating Payment Group. Please try again.");
      console.error("Error creating payment_group:", (error as Error).message || error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Payment Group Name</label>
        <input
          type="text"
          name="name"
          value={paymentGroupName}
          onChange={(e) => setPaymentGroupName(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
        disabled={isLoading}
      >
        Create Payment Group
      </button>
    </form>
  );
};

export default CreatePaymentGroupForm;
